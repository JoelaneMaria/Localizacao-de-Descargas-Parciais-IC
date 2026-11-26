
import React, { useState } from 'react';
import ParameterInput from './ParameterInput';
import './Sidebar.css';

const ENVIRONMENTS = {
  open: {
    label: 'Área aberta / rural',
    min: 2.0,
    max: 2.0,
    value: 2.0,
  },
  los: {
    label: 'Edifício com visada (LOS)',
    min: 1.6,
    max: 1.8,
    value: 1.7,
  },
  warehouse: {
    label: 'Armazém',
    min: 1.8,
    max: 1.8,
    value: 1.8,
  },
  paperFactory: {
    label: 'Fábrica de papel / cereais',
    min: 1.8,
    max: 1.8,
    value: 1.8,
  },
  conference: {
    label: 'Sala de conferência',
    min: 2.09,
    max: 2.09,
    value: 2.09,
  },
  supermarket: {
    label: 'Supermercado',
    min: 2.2,
    max: 2.2,
    value: 2.2,
  },
  factoryNlos: {
    label: 'Fábrica sem visada (NLOS)',
    min: 2.0,
    max: 3.0,
    value: 2.5,
  },
  residential: {
    label: 'Ambiente residencial',
    min: 2.8,
    max: 2.8,
    value: 2.8,
  },
  officeNlos: {
    label: 'Escritório sem visada (NLOS)',
    min: 2.7,
    max: 4.3,
    value: 3.5,
  },
};

/**
 * Sidebar with Equipment and Propagation tabs.
 */
export default function Sidebar({
  params,
  onParamChange,
  uncertainty,
  onUncertaintyChange,
  activeTab,
  heightConfig,
  onHeightConfigChange,
  fixedDistance,
  onFixedDistanceChange,
  onCalculate,
  errorMsg,
}) {
  const [sidebarTab, setSidebarTab] = useState('equipment');
  const [nMode, setNMode] = useState('reference');
  const [environment, setEnvironment] = useState('open');

  const selectedEnvironment = ENVIRONMENTS[environment];

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate();
  };

  const handleEnvironmentChange = (key) => {
    setEnvironment(key);
    onParamChange('n', ENVIRONMENTS[key].value);
  };

  const handleModeChange = (mode) => {
    setNMode(mode);

    if (mode === 'reference') {
      onParamChange('n', selectedEnvironment.value);
    }
  };

  const handleReferenceValueChange = (value) => {
    const n = parseFloat(value);

    if (
      !Number.isNaN(n) &&
      n >= selectedEnvironment.min &&
      n <= selectedEnvironment.max
    ) {
      onParamChange('n', value);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          type="button"
          className={`sidebar-tab ${sidebarTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setSidebarTab('equipment')}
        >
          Equipamento
        </button>

        <button
          type="button"
          className={`sidebar-tab ${sidebarTab === 'propagation' ? 'active' : ''}`}
          onClick={() => setSidebarTab('propagation')}
        >
          Propagação
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {sidebarTab === 'equipment' && (
          <>
            <p className="section-title">Equipamento</p>

            <ParameterInput
              id="Pt"
              label="Potência de transmissão (Pt)"
              unit="dBm"
              value={params.Pt}
              onChange={(v) => onParamChange('Pt', v)}
              tooltip="Potência do sinal entregue à antena transmissora, em dBm. Valores típicos variam de 0 dBm (1 mW) a 30 dBm (1 W)."
            />

            <ParameterInput
              id="Gt"
              label="Ganho do transmissor (Gt)"
              unit="dB"
              value={params.Gt}
              onChange={(v) => onParamChange('Gt', v)}
              tooltip="Ganho da antena transmissora em relação a uma antena isotrópica. Indica a capacidade de concentrar energia em uma direção específica."
            />

            <ParameterInput
              id="Gr"
              label="Ganho do receptor (Gr)"
              unit="dB"
              value={params.Gr}
              onChange={(v) => onParamChange('Gr', v)}
              tooltip="Ganho da antena receptora em relação a uma antena isotrópica. Descreve a sensibilidade direcional da antena receptora."
            />

            <ParameterInput
              id="ht"
              label="Altura do transmissor (ht)"
              unit="m"
              value={params.ht}
              onChange={(v) => onParamChange('ht', v)}
              tooltip="Altura da antena transmissora em relação ao solo. Influencia o comprimento dos percursos direto e refletido."
            />

            <ParameterInput
              id="hr"
              label="Altura do receptor (hr)"
              unit="m"
              value={params.hr}
              onChange={(v) => onParamChange('hr', v)}
              tooltip="Altura da antena receptora em relação ao solo. Junto com a altura do transmissor, determina a geometria do modelo de dois raios."
            />

            <ParameterInput
              id="f"
              label="Frequência de operação (f)"
              unit="Hz"
              value={params.f}
              onChange={(v) => onParamChange('f', v)}
              tooltip="Frequência do sinal eletromagnético. Determina o comprimento de onda e influencia a distância de transição e a atenuação."
            />

            <p className="section-title">Propriedades do Solo</p>

            <ParameterInput
              id="eps"
              label="Permissividade relativa (εr)"
              unit="—"
              value={params.eps}
              onChange={(v) => onParamChange('eps', v)}
              tooltip="Permissividade elétrica relativa do solo. Determina a intensidade do coeficiente de reflexão de Fresnel. Solo seco ≈ 4–7, solo úmido ≈ 15–30."
            />

            <ParameterInput
              id="mu"
              label="Permeabilidade magnética (μr)"
              unit="—"
              value={params.mu}
              onChange={(v) => onParamChange('mu', v)}
              tooltip="Permeabilidade magnética relativa do solo. Influencia o número de onda complexo do meio e o coeficiente de reflexão de Fresnel. Para a maioria dos solos, considera-se μr ≈ 1."
            />

            <ParameterInput
              id="sigma"
              label="Condutividade elétrica (σ)"
              unit="S/m"
              value={params.sigma}
              onChange={(v) => onParamChange('sigma', v)}
              tooltip="Condutividade elétrica do solo, medida em Siemens por metro (S/m). Representa a capacidade do solo de conduzir corrente elétrica e influencia a parte imaginária da permissividade complexa, afetando o coeficiente de reflexão."
            />

            <ParameterInput
              id="s"
              label="Rugosidade do terreno (s)"
              unit="m"
              value={params.s}
              onChange={(v) => onParamChange('s', v)}
              tooltip="Desvio padrão da altura das irregularidades do terreno. Utilizado no critério de rugosidade de Rayleigh para atenuar o coeficiente de reflexão."
            />

            <p className="section-title">Incerteza</p>

            <ParameterInput
              id="uncertainty"
              label="Incerteza relativa da potência (%)"
              unit="%"
              value={uncertainty}
              onChange={onUncertaintyChange}
              min="0"
              max="99.99"
              step="0.1"
              tooltip="Incerteza relativa aplicada à potência recebida. O cálculo é feito em watts (domínio linear) antes da conversão para dBm. Intervalo: 0% a menos de 100%."
            />

            {activeTab === 'height' && (
              <>
                <p className="section-title">
                  Configuração — Gráfico por Altura
                </p>

                <ParameterInput
                  id="fixedDistance"
                  label="Distância fixa do enlace"
                  unit="m"
                  value={fixedDistance}
                  onChange={onFixedDistanceChange}
                  min="0.1"
                  tooltip="Distância fixa entre transmissor e receptor utilizada no segundo gráfico. Todos os demais parâmetros permanecem fixos enquanto a altura do transmissor é variada."
                />

                <ParameterInput
                  id="htMin"
                  label="Altura mínima do transmissor"
                  unit="m"
                  value={heightConfig.min}
                  onChange={(v) => onHeightConfigChange('min', v)}
                  min="0.1"
                  tooltip="Altura mínima do transmissor para a varredura no segundo gráfico."
                />

                <ParameterInput
                  id="htMax"
                  label="Altura máxima do transmissor"
                  unit="m"
                  value={heightConfig.max}
                  onChange={(v) => onHeightConfigChange('max', v)}
                  min="0.1"
                  tooltip="Altura máxima do transmissor para a varredura no segundo gráfico."
                />

                <ParameterInput
                  id="htSamples"
                  label="Número de amostras"
                  unit="—"
                  value={heightConfig.samples}
                  onChange={(v) => onHeightConfigChange('samples', v)}
                  min="10"
                  max="5000"
                  step="1"
                  tooltip="Quantidade de pontos simulados entre a altura mínima e máxima do transmissor."
                />
              </>
            )}
          </>
        )}

        {sidebarTab === 'propagation' && (
          <>
            <p className="section-title">Expoente de perda de percurso</p>

            <p className="propagation-description">
            O expoente de perda de percurso caracteriza a atenuação do sinal durante sua propagação.
            Seu valor depende do ambiente e das condições de propagação, como obstáculos, reflexões e presença de visada direta.
            Selecione um ambiente de referência ou informe um valor personalizado.
            </p>

            <div className="n-mode-selector">
              <button
                type="button"
                className={`n-mode-btn ${nMode === 'reference' ? 'active' : ''}`}
                onClick={() => handleModeChange('reference')}
              >
                Referência
              </button>

              <button
                type="button"
                className={`n-mode-btn ${nMode === 'custom' ? 'active' : ''}`}
                onClick={() => handleModeChange('custom')}
              >
                Personalizado
              </button>
            </div>

            {nMode === 'reference' && (
              <>
                <label className="propagation-label" htmlFor="environment">
                  Ambiente de propagação
                </label>

                <select
                  id="environment"
                  className="propagation-select"
                  value={environment}
                  onChange={(e) => handleEnvironmentChange(e.target.value)}
                >
                  {Object.entries(ENVIRONMENTS).map(([key, env]) => (
                    <option key={key} value={key}>
                      {env.label}
                    </option>
                  ))}
                </select>

                <div className="n-reference-info">
                  {selectedEnvironment.min === selectedEnvironment.max ? (
                    <>
                      <span>Valor de referência</span>
                      <strong>n = {selectedEnvironment.value}</strong>
                    </>
                  ) : (
                    <>
                      <span>Intervalo de referência</span>
                      <strong>
                        {selectedEnvironment.min} ≤ n ≤ {selectedEnvironment.max}
                      </strong>

                      <label className="propagation-label" htmlFor="referenceN">
                        Escolha o valor de n
                      </label>

                      <input
                        id="referenceN"
                        className="propagation-input"
                        type="number"
                        min={selectedEnvironment.min}
                        max={selectedEnvironment.max}
                        step="0.01"
                        value={params.n}
                        onChange={(e) => handleReferenceValueChange(e.target.value)}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {nMode === 'custom' && (
              <>
                <label className="propagation-label" htmlFor="customN">
                  Valor personalizado de n
                </label>

                <input
                  id="customN"
                  className="propagation-input"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.01"
                  value={params.n}
                  onChange={(e) => onParamChange('n', e.target.value)}
                />

                <p className="propagation-hint">
                  Informe um valor positivo. O valor será utilizado na
                  equação de propagação após a implementação do cálculo.
                </p>
              </>
            )}

            <div className="n-current-value">
              <span>Valor atual de n</span>
              <strong>{Number(params.n).toFixed(2)}</strong>
            </div>

            <p className="propagation-hint">
              Os valores de referência são aproximados e dependem das
              características reais do ambiente.
            </p>
          </>
        )}

        <button className="calc-btn" type="submit">
          ⚡ Calcular
        </button>

        {errorMsg && <div className="error-msg">{errorMsg}</div>}
      </form>
    </aside>
  );
}
