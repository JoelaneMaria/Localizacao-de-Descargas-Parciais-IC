/**
 * Numerical Equivalence Tests
 *
 * Compares the React implementation against the original HTML model
 * using identical default parameters and equations.
 *
 * Usage: node src/calculations/test_doisRaios.js
 */

import {
  calcWavelength,
  calcBreakpoint,
  calcTwoRayModel,
  calcUncertaintyBands,
  generateDistances,
  dbmToWatts,
  wattsToDbm,
  DEFAULT_PARAMS,
} from './doisRaios.js';

const TOLERANCE = 1e-10;
let passed = 0;
let failed = 0;

function assertEqual(label, actual, expected, tol = TOLERANCE) {
  const diff = Math.abs(actual - expected);
  if (diff <= tol) {
    console.log(`  ✓ ${label}: ${actual} (expected ${expected}, diff ${diff.toExponential(2)})`);
    passed++;
  } else {
    console.error(`  ✗ ${label}: ${actual} (expected ${expected}, diff ${diff.toExponential(2)})`);
    failed++;
  }
}

console.log('═══════════════════════════════════════════════');
console.log('  NUMERICAL EQUIVALENCE TESTS');
console.log('  Default parameters from original HTML');
console.log('═══════════════════════════════════════════════\n');

// Original defaults
const params = {
  Pt: 0,       // dBm
  Gt: 0,       // dB
  Gr: 0,       // dB
  ht: 30,      // m
  hr: 2,       // m
  f: 2.4e9,    // Hz
  eps: 15,     // relative permittivity
  s: 0.005,    // surface roughness (m)
};

console.log('--- 1. Wavelength ---');
const c = 3e8;
const lambda = calcWavelength(params.f);
const expectedLambda = c / params.f;
assertEqual('Wavelength (λ)', lambda, expectedLambda);

console.log('\n--- 2. Breakpoint Distance ---');
const breakpoint = calcBreakpoint(params.ht, params.hr, lambda);
const expectedBreakpoint = (4 * params.ht * params.hr) / lambda;
assertEqual('Breakpoint (Rb)', breakpoint, expectedBreakpoint);
console.log(`  Info: Rb = ${breakpoint.toFixed(4)} m (no pi factor, as required)`);

console.log('\n--- 3. Full Model Calculation ---');
const distances = generateDistances(1, 1000, 2000);
const result = calcTwoRayModel(params, distances);

// Verify at specific distances by recalculating manually
const testDistances = [1, 10, 100, 500, 1000];

for (const d of testDistances) {
  const idx = distances.findIndex((di) => Math.abs(di - d) < 0.6);
  const di = distances[idx];

  // Manual calculation matching original HTML code
  const d1 = Math.sqrt(di * di + Math.pow(params.ht - params.hr, 2));
  const d2 = Math.sqrt(di * di + Math.pow(params.ht + params.hr, 2));
  const cosT = (params.ht + params.hr) / d2;
  const sinT = Math.sin(Math.acos(cosT));
  const sqrtTerm = Math.sqrt(Math.max(params.eps - sinT * sinT, 0));
  const rhoEf = (params.eps * cosT - sqrtTerm) / (params.eps * cosT + sqrtTerm);
  const Gamma = rhoEf * Math.exp(-Math.pow((4 * Math.PI * params.s * cosT) / lambda, 2));
  const F = 1 + Gamma * Gamma + 2 * Gamma * Math.cos(2 * Math.PI * (d2 - d1) / lambda);
  const Pr = params.Pt + params.Gt + params.Gr + 20 * Math.log10(lambda / (4 * Math.PI * di)) + 10 * Math.log10(F);

  console.log(`\n  At d ≈ ${d} m (actual ${di.toFixed(2)} m):`);
  assertEqual(`  d1`, result.d1[idx], d1);
  assertEqual(`  d2`, result.d2[idx], d2);
  assertEqual(`  cosT`, result.cosT[idx], cosT);
  assertEqual(`  rhoEf (reflection coeff)`, result.rhoEf[idx], rhoEf);
  assertEqual(`  Gamma (roughness atten)`, result.Gamma[idx], Gamma);
  assertEqual(`  F (multipath gain)`, result.F[idx], F);
  assertEqual(`  Pr (dBm)`, result.Pr[idx], Pr);
}

console.log('\n--- 4. KPI Values ---');
const prAt1m = result.Pr[0];
const idxR = distances.findIndex((di) => di >= result.breakpoint);
const prAtR = idxR >= 0 ? result.Pr[idxR] : result.Pr[result.Pr.length - 1];

console.log(`  Lambda: ${result.lambda.toExponential(3)}`);
console.log(`  Breakpoint: ${result.breakpoint.toFixed(1)} m`);
console.log(`  Pr @ 1m: ${prAt1m.toFixed(2)} dBm`);
console.log(`  Pr @ breakpoint: ${prAtR.toFixed(2)} dBm`);

console.log('\n--- 5. Uncertainty Band Calculation ---');
const testPrDbm = [-30, -50, -70, -100];
const uncertaintyPercent = 10;

for (const pr of testPrDbm) {
  const { lower, upper } = calcUncertaintyBands([pr], uncertaintyPercent);
  const prWatts = dbmToWatts(pr);
  const expectedLower = wattsToDbm(prWatts * 0.9);
  const expectedUpper = wattsToDbm(prWatts * 1.1);
  assertEqual(`  Lower @ ${pr} dBm`, lower[0], expectedLower);
  assertEqual(`  Upper @ ${pr} dBm`, upper[0], expectedUpper);
}

// Test zero uncertainty
const zeroUncert = calcUncertaintyBands([-50], 0);
if (zeroUncert.lower === null && zeroUncert.upper === null) {
  console.log('  ✓ Zero uncertainty returns null bands');
  passed++;
} else {
  console.error('  ✗ Zero uncertainty should return null bands');
  failed++;
}

console.log('\n--- 6. Breakpoint Formula Verification ---');
// Ensure NO pi factor
const rbNoPi = (4 * params.ht * params.hr) / lambda;
const rbWithPi = (4 * Math.PI * params.ht * params.hr) / lambda;
assertEqual('Rb matches 4*ht*hr/λ (no pi)', result.breakpoint, rbNoPi);
if (Math.abs(result.breakpoint - rbWithPi) < 0.001) {
  console.error('  ✗ WARNING: Breakpoint appears to use pi factor!');
  failed++;
} else {
  console.log('  ✓ Breakpoint correctly does NOT use pi factor');
  passed++;
}

console.log('\n--- 7. dBm ↔ Watts Conversion ---');
assertEqual('0 dBm → 1 mW', dbmToWatts(0), 0.001);
assertEqual('30 dBm → 1 W', dbmToWatts(30), 1.0);
assertEqual('-30 dBm → 1 μW', dbmToWatts(-30), 1e-6);
assertEqual('1 mW → 0 dBm', wattsToDbm(0.001), 0, 1e-10);
assertEqual('1 W → 30 dBm', wattsToDbm(1.0), 30, 1e-10);

console.log('\n═══════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
