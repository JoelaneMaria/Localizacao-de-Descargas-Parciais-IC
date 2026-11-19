import React, { useState } from 'react';
import ParameterInput from './ParameterInput';
import './Sidebar.css';

/**
 * Sidebar with all model parameters organized in sections.
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
  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate();
  };

  // ---- Expoente de propagação (n) ----
  const [nMode, setNMode] = useState('reference'); // 'reference' ou 'custom'
  const [selectedEnv, setSelectedEnv] = useState('open');

  const envOptions = [
    { key: 'open', label: 'Espaço aberto', value: 2 },
    { key: 'vision', label: 'Construção com linha de visão', min: 1.6, max: 1.8 },
    { key: 'warehouse', label: 'Armazém', value: 1.8 }, 
    { key: 'paper', label: 'Fábrica de papel/cereais', value: 1.8 },
    { key: 'conference', label: 'Sala de conferência típica (15 × 7,6 m), com mesas e cadeiras', value: 2.09 },
    { key: 'supermarket', label: 'Supermercado', value: 2.2 },
    { key: 'factory_noLOS', label: 'Fábrica sem linha de visão', min: 2, max: 3 },
    { key: 'residential', label: 'Ambiente residencial', value: 2.8 },
    { key: 'office_noLOS', label: 'Prédio de escritórios sem linha de visão', min: 2.7, max: 4.3 },
  ];

  const currentEnv = envOptions.find((e) => e.key === selectedEnv);
  const isRange = currentEnv && typeof currentEnv.min === 'number';

  const handleEnvChange = (e) => {
    const key = e.target.value;
    setSelectedEnv(key);
    const env = envOptions.find((x) => x.key === key);
    if (env) {
      const val = typeof env.value === 'number' ? env.value : env.min; // para ranges, pega o minimo
      onParamChange('n', val);
    }
  };

  const handleCustomNChange = (e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onParamChange('n', v);
  };

  const handleNModeChange = (e) => {
    const mode = e.target.value;
    setNMode(mode);
    if (mode === 'reference') {
      // quando volta ao modo de referência, garante que o valor reflita o ambiente selecionado
      const env = envOptions.find((x) => x.key === selectedEnv);
      if (env) {
        const val = typeof env.value === 'number' ? env.value : env.min;
        onParamChange('n', val);
      }
    }
  };

  return (
    <aside className="sidebar">
      <form onSubmit={handleSubmit}>

        {/* ── Equipment ── */}
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

        {/* ── Ground ── */}
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
          tooltip="Permeabilidade magnética relativa do solo. Para a maioria dos solos, μr ≈ 1. Este parâmetro é mantido para extensões futuras e não é utilizado nas equações atuais."
        />
        <ParameterInput
          id="sigma"
          label="Condutividade elétrica (σ)"
          unit="S/m"
          value={params.sigma}
          onChange={(v) => onParamChange('sigma', v)}
          tooltip="Condutividade elétrica do solo em Siemens/metro. Este parâmetro é mantido para extensões futuras e não é utilizado nas equações atuais."
        />
        <ParameterInput
          id="s"
          label="Rugosidade do terreno (s)"
          unit="m"
          value={params.s}
          onChange={(v) => onParamChange('s', v)}
          tooltip="Desvio padrão da altura das irregularidades do terreno. Utilizado no critério de rugosidade de Rayleigh para atenuar o coeficiente de reflexão."
        />

        {/* ── Propagation Exponent (n) ── */}
        <p className="section-title">Expoente de propagação (n)</p>

        {/* modo de escolha */}
        <div className="field">
          <label>
            <span className="field-label-text">Modo</span>
          </label>
          <div>
            <label>
              <input
                type="radio"
                name="nMode"
                value="reference"
                checked={nMode === 'reference'}
                onChange={handleNModeChange}
              />
              Selecionar ambiente
            </label>
            <label style={{ marginLeft: '0.8rem' }}>
              <input
                type="radio"
                name="nMode"
                value="custom"
                checked={nMode === 'custom'}
                onChange={handleNModeChange}
              />
              Personalizado
            </label>
          </div>
        </div>

        {/* lista de ambientes (apenas quando mode = reference) */}
        {nMode === 'reference' && (
          <div className="field">
            <label htmlFor="envSelect">
              <span className="field-label-text">Ambiente</span>
            </label>
            <select id="envSelect" value={selectedEnv} onChange={handleEnvChange}>
              {envOptions.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* campo livre (apenas quando mode = custom) */}
        {nMode === 'custom' && (
          <ParameterInput
            id="nCustom"
            label="Expoente n"
            unit="—"
            value={params.n}
            onChange={handleCustomNChange}
            step="any"
            min={isRange ? currentEnv.min : undefined}
            max={isRange ? currentEnv.max : undefined}
          />
        )}

        {/* ── Uncertainty ── */}
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

        {/* ── Height graph config (only shown when tab 2 is active) ── */}
        {activeTab === 'height' && (
          <>
            <p className="section-title">Configuração — Gráfico por Altura</p>
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

        <button className="calc-btn" type="submit">⚡ Calcular</button>
        {errorMsg && <div className="error-msg">{errorMsg}</div>}
      </form>
    </aside>
  );
}
