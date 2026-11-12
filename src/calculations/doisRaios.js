/**
 * Two-Ray Ground Reflection Model — Core Calculations
 *
 * All equations strictly follow the original implementation.
 * Equation references correspond to the original project documentation.
 *
 * IMPORTANT: The breakpoint formula is  R_b = 4 * ht * hr / lambda  (no pi).
 *
 * Unused parameters in the original equations:
 *   - mu (relative permeability): declared but not used in any calculation.
 *   - sigma (electrical conductivity): declared but not used in any calculation.
 *   These parameters are kept in the interface for future extensions.
 */

const C = 3e8; // Speed of light (m/s)

/**
 * Convert dBm to watts.
 */
export function dbmToWatts(dBm) {
  return Math.pow(10, (dBm - 30) / 10);
}

/**
 * Convert watts to dBm. Returns -Infinity for P <= 0.
 */
export function wattsToDbm(watts) {
  if (watts <= 0) return -Infinity;
  return 10 * Math.log10(watts) + 30;
}

/**
 * Calculate wavelength from frequency.
 * @param {number} f - Frequency in Hz
 * @returns {number} Wavelength in meters
 */
export function calcWavelength(f) {
  return C / f;
}

/**
 * Calculate breakpoint distance.
 * R_b = 4 * ht * hr / lambda
 * NO pi factor — this is an explicit project requirement.
 *
 * @param {number} ht - Transmitter height (m)
 * @param {number} hr - Receiver height (m)
 * @param {number} lambda - Wavelength (m)
 * @returns {number} Breakpoint distance (m)
 */
export function calcBreakpoint(ht, hr, lambda) {
  return (4 * ht * hr) / lambda;
}

/**
 * Calculate the Two-Ray model for a given set of parameters across distances.
 *
 * @param {object} params
 * @param {number} params.Pt   - Transmitted power (dBm)
 * @param {number} params.Gt   - Transmitter gain (dB)
 * @param {number} params.Gr   - Receiver gain (dB)
 * @param {number} params.ht   - Transmitter height (m)
 * @param {number} params.hr   - Receiver height (m)
 * @param {number} params.f    - Frequency (Hz)
 * @param {number} params.eps  - Relative permittivity
 * @param {number} params.s    - Surface roughness (m)
 * @param {number[]} distances - Array of distances (m)
 * @returns {object} { lambda, breakpoint, Pr[], F[], rhoEf[], Gamma[], d1[], d2[], cosT[] }
 */
export function calcTwoRayModel(params, distances) {
  const { Pt, Gt, Gr, ht, hr, f, eps, s } = params;

  const lambda = calcWavelength(f);
  const breakpoint = calcBreakpoint(ht, hr, lambda);

  const n = distances.length;

  // Pre-allocate arrays
  const d1 = new Array(n);
  const d2 = new Array(n);
  const cosT = new Array(n);
  const rhoEf = new Array(n);
  const Gamma = new Array(n);
  const F = new Array(n);
  const Pr = new Array(n);

  for (let i = 0; i < n; i++) {
    const di = distances[i];

    // Direct and reflected path lengths
    d1[i] = Math.sqrt(di * di + Math.pow(ht - hr, 2));
    d2[i] = Math.sqrt(di * di + Math.pow(ht + hr, 2));

    // Cosine of incidence angle (grazing angle from the ground)
    cosT[i] = (ht + hr) / d2[i];

    // Fresnel reflection coefficient (Eq 3.4)
    const sinT = Math.sin(Math.acos(cosT[i]));
    const sqrtTerm = Math.sqrt(Math.max(eps - sinT * sinT, 0));
    rhoEf[i] = (eps * cosT[i] - sqrtTerm) / (eps * cosT[i] + sqrtTerm);

    // Rayleigh roughness attenuation (Eq 3.5)
    Gamma[i] = rhoEf[i] * Math.exp(-Math.pow((4 * Math.PI * s * cosT[i]) / lambda, 2));

    // Multipath gain factor (Eq 3.6)
    F[i] = 1 + Gamma[i] * Gamma[i] + 2 * Gamma[i] * Math.cos(2 * Math.PI * (d2[i] - d1[i]) / lambda);

    // Received power in dBm (Eq 3.7)
    Pr[i] = Pt + Gt + Gr + 20 * Math.log10(lambda / (4 * Math.PI * di)) + 10 * Math.log10(F[i]);
  }

  return { lambda, breakpoint, Pr, F, rhoEf, Gamma, d1, d2, cosT };
}

/**
 * Generate default distance array (1 to 1000 m, 2000 points) matching original.
 * @param {number} [start=1] - Start distance (m)
 * @param {number} [end=1000] - End distance (m)
 * @param {number} [n=2000] - Number of points
 * @returns {number[]}
 */
export function generateDistances(start = 1, end = 1000, n = 2000) {
  return Array.from({ length: n }, (_, i) => start + ((end - start) / (n - 1)) * i);
}

/**
 * Calculate received power for varying transmitter heights at a fixed distance.
 *
 * @param {object} params - Same as calcTwoRayModel, but ht will be overridden
 * @param {number} fixedDistance - Fixed link distance (m)
 * @param {number[]} heights - Array of transmitter heights (m)
 * @returns {object} { Pr[], F[], heights[] }
 */
export function calcTwoRayVsHeight(params, fixedDistance, heights) {
  const n = heights.length;
  const Pr = new Array(n);
  const F = new Array(n);

  for (let i = 0; i < n; i++) {
    const modifiedParams = { ...params, ht: heights[i] };
    const result = calcTwoRayModel(modifiedParams, [fixedDistance]);
    Pr[i] = result.Pr[0];
    F[i] = result.F[0];
  }

  return { Pr, F, heights };
}

/**
 * Generate array of transmitter heights for the second graph.
 * @param {number} [min=1] - Minimum height (m)
 * @param {number} [max=100] - Maximum height (m)
 * @param {number} [n=500] - Number of points
 * @returns {number[]}
 */
export function generateHeights(min = 1, max = 100, n = 500) {
  return Array.from({ length: n }, (_, i) => min + ((max - min) / (n - 1)) * i);
}

/**
 * Apply relative uncertainty to received power values.
 * Uncertainty is applied in watts (linear domain), then converted to dBm.
 *
 * @param {number[]} PrDbm - Received power in dBm
 * @param {number} uncertaintyPercent - Relative uncertainty (0 to <100)
 * @returns {object} { lower[], upper[] } in dBm
 */
export function calcUncertaintyBands(PrDbm, uncertaintyPercent) {
  if (uncertaintyPercent <= 0) {
    return { lower: null, upper: null };
  }

  const u = uncertaintyPercent / 100; // decimal fraction
  const n = PrDbm.length;
  const lower = new Array(n);
  const upper = new Array(n);

  for (let i = 0; i < n; i++) {
    const PrWatts = dbmToWatts(PrDbm[i]);
    const Plower = PrWatts * (1 - u);
    const Pupper = PrWatts * (1 + u);
    lower[i] = wattsToDbm(Plower);
    upper[i] = wattsToDbm(Pupper);
  }

  return { lower, upper };
}

/**
 * Default model parameters matching the original HTML file.
 */
export const DEFAULT_PARAMS = {
  Pt: 0,       // dBm
  Gt: 0,       // dB
  Gr: 0,       // dB
  ht: 30,      // m
  hr: 2,       // m
  f: 2.4e9,    // Hz
  eps: 15,     // relative permittivity
  mu: 1,       // relative permeability (unused in current equations)
  sigma: 0.01, // electrical conductivity S/m (unused in current equations)
  s: 0.005,    // surface roughness (m)
};
