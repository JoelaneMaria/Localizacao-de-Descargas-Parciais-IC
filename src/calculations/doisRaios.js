/* * Two-Ray Ground Reflection Model — Core Calculations
 *
 * Mathematical implementation based on Eqs. 3.1–3.7, Section 3.2
 * of the reference dissertation.
 *
 * Complex numbers are represented internally as { re, im }.
 */

const C = 3e8; // Speed of light (m/s)
const EPS0 = 8.8541878128e-12; // Vacuum permittivity (F/m)

// Minimal complex-number helpers: z = { re, im }.
function cAdd(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cSub(a, b) {
  return { re: a.re - b.re, im: a.im - b.im };
}

function cMul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function cDiv(a, b) {
  const denominator = b.re * b.re + b.im * b.im;
  if (denominator === 0) {
    return { re: NaN, im: NaN };
  }
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator,
  };
}

function cSqrt(z) {
  // Principal complex square root.
  const magnitude = Math.hypot(z.re, z.im);
  const re = Math.sqrt(Math.max((magnitude + z.re) / 2, 0));
  const imMagnitude = Math.sqrt(Math.max((magnitude - z.re) / 2, 0));
  return { re, im: z.im < 0 ? -imMagnitude : imMagnitude };
}

function cScale(z, scalar) {
  return { re: z.re * scalar, im: z.im * scalar };
}

function cAbsSquared(z) {
  return z.re * z.re + z.im * z.im;
}

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
 * Eq. 3.1: R_b = 4 * ht * hr / lambda
 */
export function calcBreakpoint(ht, hr, lambda) {
  return (4 * ht * hr) / lambda;
}

/**
 * Calculate the complex Fresnel reflection coefficient for parallel
 * polarization using Eqs. 3.3 and 3.4.
 *
 * eps and mu are relative permittivity and permeability.
 * sigma is conductivity in S/m.
 *
 * q = (k2/k1)^2 = eps*mu - j*sigma*mu/(omega*eps0)
 *
 * The principal complex square root is used, consistent with a passive
 * lossy medium and the -j conductivity convention in Eq. 3.4.
 */
function calcFresnelCoefficient(cosTheta, eps, mu, sigma, omega) {
  const sinSquared = Math.max(0, 1 - cosTheta * cosTheta);

  const q = {
    re: eps * mu,
    im: -(sigma * mu) / (omega * EPS0),
  };

  const qCos = cScale(q, cosTheta);
  const sqrtTerm = cSqrt(cSub(q, { re: sinSquared, im: 0 }));

  const numerator = cSub(qCos, sqrtTerm);
  const denominator = cAdd(qCos, sqrtTerm);

  return cDiv(numerator, denominator);
}

/**
 * Calculate the Two-Ray model for a set of horizontal separations.
 *
 * @param {object} params
 * @param {number} params.Pt   - Transmitted power (dBm)
 * @param {number} params.Gt   - Transmitter gain (dB)
 * @param {number} params.Gr   - Receiver gain (dB)
 * @param {number} params.ht   - Transmitter height (m)
 * @param {number} params.hr   - Receiver height (m)
 * @param {number} params.f    - Frequency (Hz)
 * @param {number} params.eps  - Relative permittivity
 * @param {number} params.mu   - Relative permeability
 * @param {number} params.sigma - Conductivity (S/m)
 * @param {number} params.s    - Surface roughness (m)
 * @param {number[]} distances - Horizontal separations (m)
 *
 * @returns {object} { lambda, breakpoint, Pr[], F[], rhoEf[], Gamma[],
 *                     d1[], d2[], cosT[] }
 *
 * F is retained as the real power interference factor |1 + Gamma*phase|^2.
 * rhoEf and Gamma are complex values represented as { re, im }.
 */
export function calcTwoRayModel(params, distances) {
  const {
    Pt, Gt, Gr, ht, hr, f, eps, s,
    mu = 1,
    sigma = 0,
  } = params;

  const lambda = calcWavelength(f);
  const omega = 2 * Math.PI * f;
  const breakpoint = calcBreakpoint(ht, hr, lambda);
  const count = distances.length;

  const d1 = new Array(count);
  const d2 = new Array(count);
  const cosT = new Array(count);
  const rhoEf = new Array(count);
  const Gamma = new Array(count);
  const F = new Array(count);
  const Pr = new Array(count);

  for (let i = 0; i < count; i++) {
    const horizontalDistance = distances[i];

    // Direct and reflected path lengths.
    d1[i] = Math.sqrt(horizontalDistance ** 2 + (ht - hr) ** 2);
    d2[i] = Math.sqrt(horizontalDistance ** 2 + (ht + hr) ** 2);

    // Incidence angle measured from the surface normal.
    cosT[i] = (ht + hr) / d2[i];

    // Eq. 3.3/3.4: complex Fresnel coefficient.
    rhoEf[i] = calcFresnelCoefficient(cosT[i], eps, mu, sigma, omega);

    // Eq. 3.5: Rayleigh roughness factor.
    // The complementary angle gives sin(gamma) = cos(theta_i).
    const roughnessFactor = Math.exp(
      -8 * ((Math.PI * s * cosT[i]) / lambda) ** 2
    );

    // Effective complex reflection coefficient.
    Gamma[i] = cScale(rhoEf[i], roughnessFactor);

    // Eq. 3.6: F = 1 + Gamma * exp(-j*phase).
    const phase = (2 * Math.PI * (d2[i] - d1[i])) / lambda;
    const reflectedPhasor = cMul(Gamma[i], {
      re: Math.cos(phase),
      im: -Math.sin(phase),
    });
    const totalField = cAdd({ re: 1, im: 0 }, reflectedPhasor);

    // Eq. 3.7 uses the squared magnitude of the total field.
    F[i] = cAbsSquared(totalField);

    // Eq. 3.7 in dBm. R is the direct transmitter-receiver separation d1.
    // Pt is in dBm and antenna gains are in dB, so their logarithmic
    // contributions are added directly.
    Pr[i] =
      Pt +
      Gt +
      Gr +
      20 * Math.log10(lambda / (4 * Math.PI * d1[i])) +
      10 * Math.log10(F[i]);
  }

  return { lambda, breakpoint, Pr, F, rhoEf, Gamma, d1, d2, cosT };
}

/**
 * Generate default distance array (1 to 1000 m, 2000 points).
 */
export function generateDistances(start = 1, end = 1000, n = 2000) {
  return Array.from(
    { length: n },
    (_, i) => start + ((end - start) / (n - 1)) * i
  );
}

/**
 * Calculate received power for varying transmitter heights at a fixed distance.
 */
export function calcTwoRayVsHeight(params, fixedDistance, heights) {
  const count = heights.length;
  const Pr = new Array(count);
  const F = new Array(count);

  for (let i = 0; i < count; i++) {
    const modifiedParams = { ...params, ht: heights[i] };
    const result = calcTwoRayModel(modifiedParams, [fixedDistance]);
    Pr[i] = result.Pr[0];
    F[i] = result.F[0];
  }

  return { Pr, F, heights };
}

/**
 * Generate array of transmitter heights for the second graph.
 */
export function generateHeights(min = 1, max = 100, n = 500) {
  return Array.from(
    { length: n },
    (_, i) => min + ((max - min) / (n - 1)) * i
  );
}

/**
 * Apply relative uncertainty to received power values.
 * Uncertainty is applied in watts (linear domain), then converted to dBm.
 */
export function calcUncertaintyBands(PrDbm, uncertaintyPercent) {
  if (uncertaintyPercent <= 0) {
    return { lower: null, upper: null };
  }

  const u = uncertaintyPercent / 100;
  const count = PrDbm.length;
  const lower = new Array(count);
  const upper = new Array(count);

  for (let i = 0; i < count; i++) {
    const PrWatts = dbmToWatts(PrDbm[i]);
    lower[i] = wattsToDbm(PrWatts * (1 - u));
    upper[i] = wattsToDbm(PrWatts * (1 + u));
  }

  return { lower, upper };
}

/**
 * Default model parameters matching the original interface.
 */
export const DEFAULT_PARAMS = {
  Pt: 0,       // dBm
  Gt: 0,       // dB
  Gr: 0,       // dB
  ht: 30,      // m
  hr: 2,       // m
  f: 2.4e9,    // Hz
  eps: 15,     // relative permittivity
  mu: 1,       // relative permeability
  sigma: 0.01, // electrical conductivity (S/m)
  s: 0.005,    // surface roughness (m)
};
