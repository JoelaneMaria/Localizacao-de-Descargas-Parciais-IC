
/**
 * Two-Ray Ground Reflection Model — Core Calculations
 *
 * Implementation based on equations 3.1–3.7 of the reference article.
 *
 * Breakpoint:
 * Rb = 4 * ht * hr / lambda
 *
 * Pt: dBm
 * Gt, Gr: dB
 * Pr: dBm
 * eps, mu: relative permittivity and permeability
 * sigma: electrical conductivity (S/m)
 * s: surface roughness (m)
 */

const C = 3e8;
const EPS0 = 8.854187817e-12;

// --------------------------------------------------
// Unit conversions
// --------------------------------------------------

export function dbmToWatts(dBm) {
  return Math.pow(10, (dBm - 30) / 10);
}

export function wattsToDbm(watts) {
  if (watts <= 0) return -Infinity;
  return 10 * Math.log10(watts) + 30;
}

// --------------------------------------------------
// Basic model calculations
// --------------------------------------------------

export function calcWavelength(f) {
  return C / f;
}

export function calcBreakpoint(ht, hr, lambda) {
  return (4 * ht * hr) / lambda;
}

// --------------------------------------------------
// Complex number helpers
// --------------------------------------------------

function complexSqrt(z) {
  const magnitude = Math.hypot(z.re, z.im);

  return {
    re: Math.sqrt(Math.max((magnitude + z.re) / 2, 0)),
    im: Math.sign(z.im || 1) *
      Math.sqrt(Math.max((magnitude - z.re) / 2, 0)),
  };
}

function complexDivide(a, b) {
  const denominator = b.re * b.re + b.im * b.im;

  if (denominator === 0) {
    return { re: NaN, im: NaN };
  }

  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator,
  };
}

// --------------------------------------------------
// Two-Ray model
// --------------------------------------------------

export function calcTwoRayModel(params, distances) {
  const {
    Pt, Gt, Gr,
    ht, hr, f,
    eps, mu, sigma, s
  } = params;

  const lambda = calcWavelength(f);
  const breakpoint = calcBreakpoint(ht, hr, lambda);
  const omega = 2 * Math.PI * f;

  // Complex relative permittivity/permeability term:
  // q = (k2/k1)^2
  // q = eps*mu - j*(sigma*mu)/(omega*EPS0)

  const q = {
    re: eps * mu,
    im: -(sigma * mu) / (omega * EPS0),
  };

  const n = distances.length;

  const d1 = new Array(n);
  const d2 = new Array(n);
  const cosT = new Array(n);

  const rhoEf = new Array(n);
  const Gamma = new Array(n);
  const F = new Array(n);
  const Pr = new Array(n);

  const constFs = 20 * Math.log10(lambda / (4 * Math.PI));

  for (let i = 0; i < n; i++) {
    const d = distances[i];

    // Direct and reflected path lengths

    d1[i] = Math.sqrt(
      d * d + Math.pow(ht - hr, 2)
    );

    d2[i] = Math.sqrt(
      d * d + Math.pow(ht + hr, 2)
    );

    // Cosine of incidence angle measured from the normal

    cosT[i] = (ht + hr) / d2[i];

    // Sine squared of incidence angle

    const sinT2 = Math.max(0, 1 - cosT[i] * cosT[i]);

    // Fresnel reflection coefficient (Eq. 3.3)

    const root = complexSqrt({
      re: q.re - sinT2,
      im: q.im,
    });

    const numerator = {
      re: q.re * cosT[i] - root.re,
      im: q.im * cosT[i] - root.im,
    };

    const denominator = {
      re: q.re * cosT[i] + root.re,
      im: q.im * cosT[i] + root.im,
    };

    const rho = complexDivide(numerator, denominator);

    // Rayleigh roughness factor (Eq. 3.5)

    const roughnessFactor = Math.exp(
      -8 * Math.pow(
        (Math.PI * s * cosT[i]) / lambda,
        2
      )
    );

    // Effective complex reflection coefficient

    const rhoRe = rho.re * roughnessFactor;
    const rhoIm = rho.im * roughnessFactor;

    rhoEf[i] = Math.hypot(rhoRe, rhoIm);

    // Phase difference between the two paths

    const phase =
      (2 * Math.PI * (d2[i] - d1[i])) / lambda;

    // Multipath factor |F|² (Eq. 3.6)

    const F2 =
      1 +
      rhoRe * rhoRe +
      rhoIm * rhoIm +
      2 * (
        rhoRe * Math.cos(phase) +
        rhoIm * Math.sin(phase)
      );

    F[i] = Math.max(F2, 0);

    // Received power in dBm (Eq. 3.7)

    const pathLoss = constFs - 20 * Math.log10(d);

    Pr[i] = F[i] > 0
      ? Pt + Gt + Gr + pathLoss + 10 * Math.log10(F[i])
      : -Infinity;

    // Magnitude of effective reflection coefficient

    Gamma[i] = rhoEf[i];
  }

  return {
    lambda,
    breakpoint,
    Pr,
    F,
    rhoEf,
    Gamma,
    d1,
    d2,
    cosT,
  };
}

// --------------------------------------------------
// Distance generation
// --------------------------------------------------

export function generateDistances(
  start = 1,
  end = 1000,
  n = 2000
) {
  return Array.from(
    { length: n },
    (_, i) => start + ((end - start) / (n - 1)) * i
  );
}

// --------------------------------------------------
// Two-Ray model with variable transmitter height
// --------------------------------------------------

export function calcTwoRayVsHeight(
  params,
  fixedDistance,
  heights
) {
  const n = heights.length;

  const Pr = new Array(n);
  const F = new Array(n);

  for (let i = 0; i < n; i++) {
    const modifiedParams = {
      ...params,
      ht: heights[i],
    };

    const result = calcTwoRayModel(
      modifiedParams,
      [fixedDistance]
    );

    Pr[i] = result.Pr[0];
    F[i] = result.F[0];
  }

  return { Pr, F, heights };
}

// --------------------------------------------------
// Transmitter height generation
// --------------------------------------------------

export function generateHeights(
  min = 1,
  max = 100,
  n = 500
) {
  return Array.from(
    { length: n },
    (_, i) => min + ((max - min) / (n - 1)) * i
  );
}

// --------------------------------------------------
// Relative uncertainty bands
// --------------------------------------------------

export function calcUncertaintyBands(
  PrDbm,
  uncertaintyPercent
) {
  if (uncertaintyPercent <= 0) {
    return { lower: null, upper: null };
  }

  const u = uncertaintyPercent / 100;

  const lower = new Array(PrDbm.length);
  const upper = new Array(PrDbm.length);

  for (let i = 0; i < PrDbm.length; i++) {
    const PrWatts = dbmToWatts(PrDbm[i]);

    const Plower = PrWatts * (1 - u);
    const Pupper = PrWatts * (1 + u);

    lower[i] = wattsToDbm(Plower);
    upper[i] = wattsToDbm(Pupper);
  }

  return { lower, upper };
}

// --------------------------------------------------
// Default parameters
// --------------------------------------------------

export const DEFAULT_PARAMS = {
  n: 2,       // Future propagation exponent extension

  Pt: 0,      // Transmitted power (dBm)
  Gt: 0,      // Transmitter gain (dB)
  Gr: 0,      // Receiver gain (dB)

  ht: 30,     // Transmitter height (m)
  hr: 2,      // Receiver height (m)

  f: 2.4e9,   // Frequency (Hz)

  eps: 15,    // Relative permittivity
  mu: 1,      // Relative permeability
  sigma: 0.01,// Conductivity (S/m)

  s: 0.005,   // Surface roughness (m)
};
