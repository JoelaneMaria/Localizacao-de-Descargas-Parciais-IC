
/**
 * Two-Ray Ground Reflection Model — Core Calculations
 *
 * Mathematical implementation based on Eqs. 3.1–3.7, Section 3.2
 * of the reference dissertation.
 *
 * Complex numbers are represented internally as { re, im }.
 *
 * Received power is expressed in dB, referenced to 1 W.
 */

const C = 3e8;
const EPS0 = 8.8541878128e-12;

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
 * Convert watts to dBm.
 */
export function wattsToDbm(watts) {
  if (watts <= 0) return -Infinity;
  return 10 * Math.log10(watts) + 30;
}

/**
 * Convert watts to dB, referenced to 1 W.
 */
export function wattsToDb(watts) {
  if (watts <= 0) return -Infinity;
  return 10 * Math.log10(watts);
}

/**
 * Calculate wavelength from frequency.
 */
export function calcWavelength(f) {
  return C / f;
}

/**
 * Calculate breakpoint distance.
 */
export function calcBreakpoint(ht, hr, lambda) {
  return (4 * ht * hr) / lambda;
}

/**
 * Calculate the complex Fresnel reflection coefficient.
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
 * Pt: transmitted power in dBm (input)
 * Gt, Gr: antenna gains in dB
 *
 * Pr: received power in dB, referenced to 1 W (output)
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

    // Complex Fresnel coefficient.
    rhoEf[i] = calcFresnelCoefficient(
      cosT[i], eps, mu, sigma, omega
    );

    // Rayleigh roughness factor.
    const roughnessFactor = Math.exp(
      -8 * ((Math.PI * s * cosT[i]) / lambda) ** 2
    );

    // Effective complex reflection coefficient.
    Gamma[i] = cScale(rhoEf[i], roughnessFactor);

    // Interference factor.
    const phase = (2 * Math.PI * (d2[i] - d1[i])) / lambda;

    const reflectedPhasor = cMul(Gamma[i], {
      re: Math.cos(phase),
      im: -Math.sin(phase),
    });

    const totalField = cAdd(
      { re: 1, im: 0 },
      reflectedPhasor
    );

    F[i] = cAbsSquared(totalField);

    // Received power in dB, referenced to 1 W.
    // Pt is originally in dBm, so subtract 30 dB.
    Pr[i] =
      Pt +
      Gt +
      Gr +
      20 * Math.log10(lambda / (4 * Math.PI * d1[i])) +
      10 * Math.log10(F[i]) -
      30;
  }

  return { lambda, breakpoint, Pr, F, rhoEf, Gamma, d1, d2, cosT };
}

/**
 * Generate default distance array.
 */
export function generateDistances(start = 1, end = 1000, n = 2000) {
  return Array.from(
    { length: n },
    (_, i) => start + ((end - start) / (n - 1)) * i
  );
}

/**
 * Calculate received power for varying transmitter heights.
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
 * Generate array of transmitter heights.
 */
export function generateHeights(min = 1, max = 100, n = 500) {
  return Array.from(
    { length: n },
    (_, i) => min + ((max - min) / (n - 1)) * i
  );
}

/**
 * Apply relative uncertainty in watts,
 * then convert the limits to dB (reference: 1 W).
 *
 * Input PrDb must be in dB referenced to 1 W.
 */
export function calcUncertaintyBands(PrDb, uncertaintyPercent) {
  if (uncertaintyPercent <= 0) {
    return { lower: null, upper: null };
  }

  const u = uncertaintyPercent / 100;
  const count = PrDb.length;
  const lower = new Array(count);
  const upper = new Array(count);

  for (let i = 0; i < count; i++) {
    // Convert dB (ref. 1 W) to watts.
    const PrWatts = Math.pow(10, PrDb[i] / 10);

    // Apply relative uncertainty in the linear domain.
    lower[i] = wattsToDb(PrWatts * (1 - u));
    upper[i] = wattsToDb(PrWatts * (1 + u));
  }

  return { lower, upper };
}

/**
 * Default model parameters.
 *
 * Pt remains in dBm as an input parameter.
 */
export const DEFAULT_PARAMS = {
  Pt: 0,
  Gt: 0,
  Gr: 0,
  ht: 30,
  hr: 2,
  f: 2.4e9,
  eps: 15,
  mu: 1,
  sigma: 0.01,
  s: 0.005,
};
