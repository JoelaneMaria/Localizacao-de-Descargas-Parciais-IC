import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KPI from './components/KPI';
import Graph from './components/Graph';
import {
  DEFAULT_PARAMS,
  calcTwoRayModel,
  calcTwoRayVsHeight,
  calcUncertaintyBands,
  generateDistances,
  generateHeights,
} from './calculations/doisRaios';
import './App.css';

function App() {
  // Theme state
  const [dark, setDark] = useState(true);

  // Model parameters
  const [params, setParams] = useState({ ...DEFAULT_PARAMS });

  // Uncertainty
  const [uncertainty, setUncertainty] = useState(10);

  // Graph tab
  const [activeTab, setActiveTab] = useState('distance');

  // Height graph configuration
  const [heightConfig, setHeightConfig] = useState({
    min: 1,
    max: 100,
    samples: 500,
  });
  const [fixedDistance, setFixedDistance] = useState(500);

  // Computed results
  const [distResult, setDistResult] = useState(null);
  const [heightResult, setHeightResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Handle parameter changes
  const handleParamChange = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleHeightConfigChange = useCallback((key, value) => {
    setHeightConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Validation
  const validateParams = useCallback(() => {
    const p = params;
    const numericFields = { Pt: p.Pt, Gt: p.Gt, Gr: p.Gr, ht: p.ht, hr: p.hr, f: p.f, eps: p.eps, s: p.s };

    for (const [key, val] of Object.entries(numericFields)) {
      const n = parseFloat(val);
      if (isNaN(n)) {
        return `Valor inválido para o parâmetro "${key}".`;
      }
    }

    const ht = parseFloat(p.ht);
    const hr = parseFloat(p.hr);
    const f = parseFloat(p.f);
    const eps = parseFloat(p.eps);
    const s = parseFloat(p.s);

    if (ht <= 0) return 'A altura do transmissor (ht) deve ser positiva.';
    if (hr <= 0) return 'A altura do receptor (hr) deve ser positiva.';
    if (f <= 0) return 'A frequência (f) deve ser positiva.';
    if (eps <= 0) return 'A permissividade relativa (εr) deve ser positiva.';
    if (s < 0) return 'A rugosidade (s) não pode ser negativa.';

    const u = parseFloat(uncertainty);
    if (isNaN(u) || u < 0 || u >= 100) {
      return 'A incerteza deve estar entre 0% e 99,99%.';
    }

    if (activeTab === 'height') {
      const fd = parseFloat(fixedDistance);
      const hMin = parseFloat(heightConfig.min);
      const hMax = parseFloat(heightConfig.max);
      const hSamples = parseInt(heightConfig.samples);

      if (isNaN(fd) || fd <= 0) return 'A distância fixa deve ser positiva.';
      if (isNaN(hMin) || hMin <= 0) return 'A altura mínima deve ser positiva.';
      if (isNaN(hMax) || hMax <= 0) return 'A altura máxima deve ser positiva.';
      if (hMin >= hMax) return 'A altura mínima deve ser menor que a máxima.';
      if (isNaN(hSamples) || hSamples < 10) return 'O número de amostras deve ser pelo menos 10.';
    }

    return null;
  }, [params, uncertainty, activeTab, fixedDistance, heightConfig]);

  // Main calculation
  const handleCalculate = useCallback(() => {
    setErrorMsg('');

    const error = validateParams();
    if (error) {
      setErrorMsg(error);
      return;
    }

    const numParams = {
      Pt: parseFloat(params.Pt),
      Gt: parseFloat(params.Gt),
      Gr: parseFloat(params.Gr),
      ht: parseFloat(params.ht),
      hr: parseFloat(params.hr),
      f: parseFloat(params.f),
      eps: parseFloat(params.eps),
      s: parseFloat(params.s),
    };

    const u = parseFloat(uncertainty);

    try {
      // Always calculate distance graph
      const distances = generateDistances(1, 1000, 2000);
      const distCalc = calcTwoRayModel(numParams, distances);
      const distUncertainty = calcUncertaintyBands(distCalc.Pr, u);

      // Find Pr at d=1m and at breakpoint
      const prAt1m = distCalc.Pr[0];
      const idxR = distances.findIndex((di) => di >= distCalc.breakpoint);
      const prAtR = idxR >= 0 ? distCalc.Pr[idxR] : distCalc.Pr[distCalc.Pr.length - 1];

      setDistResult({
        distances,
        Pr: distCalc.Pr,
        lambda: distCalc.lambda,
        breakpoint: distCalc.breakpoint,
        prAt1m,
        prAtR,
        uncertainty: distUncertainty,
      });

      // Calculate height graph if on that tab
      if (activeTab === 'height') {
        const hMin = parseFloat(heightConfig.min);
        const hMax = parseFloat(heightConfig.max);
        const hSamples = parseInt(heightConfig.samples);
        const fd = parseFloat(fixedDistance);

        const heights = generateHeights(hMin, hMax, hSamples);
        const heightCalc = calcTwoRayVsHeight(numParams, fd, heights);
        const heightUncertainty = calcUncertaintyBands(heightCalc.Pr, u);

        setHeightResult({
          heights,
          Pr: heightCalc.Pr,
          uncertainty: heightUncertainty,
        });
      }
    } catch (err) {
      setErrorMsg(`Erro no cálculo: ${err.message}`);
      console.error(err);
    }
  }, [params, uncertainty, activeTab, heightConfig, fixedDistance, validateParams]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setDark((prev) => !prev);
  }, []);

  return (
    <div className="app-root">
      {/* Top Bar */}
      <div className="topbar">
        <h1>
          Two-Ray Ground Reflection&nbsp;
          <span>— Modelo de Dois Raios</span>
        </h1>
        <button className="toggle-btn" onClick={toggleTheme} type="button">
          <span className="toggle-icon">{dark ? '☀️' : '🌙'}</span>
          <span>{dark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>

      {/* Layout */}
      <div className="layout">
        <Sidebar
          params={params}
          onParamChange={handleParamChange}
          uncertainty={uncertainty}
          onUncertaintyChange={setUncertainty}
          activeTab={activeTab}
          heightConfig={heightConfig}
          onHeightConfigChange={handleHeightConfigChange}
          fixedDistance={fixedDistance}
          onFixedDistanceChange={setFixedDistance}
          onCalculate={handleCalculate}
          errorMsg={errorMsg}
        />

        <main className="main">
          {/* KPI Cards */}
          <div className="info-strip">
            <KPI
              label="Comprimento de onda (λ)"
              value={distResult ? distResult.lambda.toExponential(3) : '—'}
              sub="metros"
              tooltip="Comprimento de onda do sinal eletromagnético, calculado como c/f."
            />
            <KPI
              label="Distância de transição (Rb)"
              value={distResult ? distResult.breakpoint.toFixed(1) : '—'}
              sub="metros"
              tooltip="Distância de transição (breakpoint): Rb = 4·ht·hr / λ. Além desta distância, o modelo de dois raios prevê atenuação mais acentuada."
            />
            <KPI
              label="Potência recebida a 1 m"
              value={distResult ? distResult.prAt1m.toFixed(2) : '—'}
              sub="dBm"
              tooltip="Potência recebida calculada na distância de referência de 1 metro."
            />
            <KPI
              label="Potência recebida na distância de transição"
              value={distResult ? distResult.prAtR.toFixed(2) : '—'}
              sub="dBm"
              tooltip="Potência recebida calculada na distância de transição (breakpoint)."
            />
          </div>

          {/* Graph */}
          <Graph
            activeTab={activeTab}
            onTabChange={setActiveTab}
            distances={distResult?.distances}
            Pr={distResult?.Pr}
            breakpoint={distResult?.breakpoint}
            uncertaintyDist={distResult?.uncertainty}
            heights={heightResult?.heights}
            PrHeight={heightResult?.Pr}
            uncertaintyHeight={heightResult?.uncertainty}
            dark={dark}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
