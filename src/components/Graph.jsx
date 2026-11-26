
import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import './Graph.css';

/**
 * Get theme-aware colors for Plotly.
 */
function getPlotColors(dark) {
  return {
    paperBg: dark ? '#22263a' : '#ffffff',
    plotBg: dark ? '#1a1d27' : '#f8f9ff',
    gridClr: dark ? '#2e3350' : '#dde1f5',
    textClr: dark ? '#e8eaf6' : '#1a1d2e',
    lineClr: dark ? '#5c7cfa' : '#3b5bdb',
    legendBg: dark ? 'rgba(26,29,39,.8)' : 'rgba(255,255,255,.85)',

    // Faixa de incerteza em laranja
    bandColor: dark
      ? 'rgba(255, 159, 67, 0.25)'
      : 'rgba(230, 126, 34, 0.18)',
  };
}

/**
 * Graph 1: Received power vs distance.
 */
function DistanceGraph({ distances, Pr, breakpoint, uncertainty, dark }) {
  const colors = getPlotColors(dark);

  const traces = useMemo(() => {
    const t = [];

    // Verifica se existem dados válidos de incerteza
    const hasUncertainty =
      uncertainty &&
      Array.isArray(uncertainty.upper) &&
      Array.isArray(uncertainty.lower) &&
      uncertainty.upper.length === distances.length &&
      uncertainty.lower.length === distances.length;

    // Faixa de incerteza
    if (hasUncertainty) {
      // Limite superior
      t.push({
        x: distances,
        y: uncertainty.upper,
        mode: 'lines',
        line: { color: 'rgba(0,0,0,0)', width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
        type: 'scatter',
      });

      // Limite inferior e preenchimento entre os limites
      t.push({
        x: distances,
        y: uncertainty.lower,
        mode: 'lines',
        line: { color: 'rgba(0,0,0,0)', width: 0 },
        fill: 'tonexty',
        fillcolor: colors.bandColor,
        name: 'Faixa de incerteza',
        showlegend: true,
        hoverinfo: 'skip',
        type: 'scatter',
      });
    }

    // CURVA PRINCIPAL: sempre desenhada
    t.push({
      x: distances,
      y: Pr,
      mode: 'lines',
      name: 'Potência recebida (dBm)',
      line: {
        color: colors.lineClr,
        width: 1,
      },
      hovertemplate:
        '<b>Distância</b>: %{x:.1f} m<br><b>Pr</b>: %{y:.2f} dBm<extra></extra>',
      type: 'scatter',
    });

    return t;
  }, [distances, Pr, uncertainty, colors]);

  const prMin = Pr && Pr.length ? Math.min(...Pr) : -100;
  const prMax = Pr && Pr.length ? Math.max(...Pr) : 0;

  const layout = useMemo(
    () => ({
      paper_bgcolor: colors.paperBg,
      plot_bgcolor: colors.plotBg,

      margin: { l: 65, r: 30, t: 45, b: 55 },

      title: {
        text: 'Potência Recebida vs Distância',
        font: {
          color: colors.textClr,
          size: 15,
          family: 'Segoe UI, sans-serif',
        },
      },

      xaxis: {
        title: {
          text: 'Distância (m)',
          font: { color: colors.textClr },
        },
        type: 'log',
        tickcolor: colors.gridClr,
        gridcolor: colors.gridClr,
        tickfont: { color: colors.textClr },
        showgrid: true,
      },

      yaxis: {
        title: {
          text: 'Potência recebida (dBm)',
          font: { color: colors.textClr },
        },
        tickcolor: colors.gridClr,
        gridcolor: colors.gridClr,
        tickfont: { color: colors.textClr },
        showgrid: true,
      },

      shapes: breakpoint
        ? [
            {
              type: 'line',
              x0: breakpoint,
              x1: breakpoint,
              xref: 'x',
              y0: prMin,
              y1: prMax,
              yref: 'y',
              line: {
                color: '#f03e3e',
                dash: 'dash',
                width: 2,
              },
            },
          ]
        : [],

      annotations: breakpoint
        ? [
            {
              x: Math.log10(breakpoint),
              xref: 'x',
              y: prMax,
              yref: 'y',
              text: `<b>Transição</b><br>${breakpoint.toFixed(1)} m`,
              showarrow: true,
              arrowcolor: '#f03e3e',
              arrowhead: 2,
              ax: 50,
              ay: -30,
              font: {
                color: '#f03e3e',
                size: 11,
              },
              bgcolor: colors.paperBg,
              bordercolor: '#f03e3e',
              borderwidth: 1,
              borderpad: 4,
            },
          ]
        : [],

      legend: {
        x: 0.01,
        y: 0.01,
        bgcolor: colors.legendBg,
        bordercolor: colors.gridClr,
        borderwidth: 1,
        font: { color: colors.textClr },
      },
    }),
    [breakpoint, prMin, prMax, colors]
  );

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: [
      'select2d',
      'lasso2d',
      'autoScale2d',
    ],
    displaylogo: false,
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={config}
      className="plot-container"
    />
  );
}

/**
 * Graph 2: Received power vs transmitter antenna height.
 */
function HeightGraph({ heights, Pr, uncertainty, dark }) {
  const colors = getPlotColors(dark);

  const traces = useMemo(() => {
    const t = [];

    const hasUncertainty =
      uncertainty &&
      Array.isArray(uncertainty.upper) &&
      Array.isArray(uncertainty.lower) &&
      uncertainty.upper.length === heights.length &&
      uncertainty.lower.length === heights.length;

    // Faixa de incerteza
    if (hasUncertainty) {
      t.push({
        x: [
          ...uncertainty.upper,
          ...[...uncertainty.lower].reverse(),
        ],
        y: [
          ...heights,
          ...[...heights].reverse(),
        ],
        fill: 'toself',
        fillcolor: colors.bandColor,
        line: { color: 'transparent' },
        name: 'Faixa de incerteza',
        showlegend: true,
        hoverinfo: 'skip',
        type: 'scatter',
      });
    }

    // Curva principal: sempre desenhada
    t.push({
      x: Pr,
      y: heights,
      mode: 'lines',
      name: 'Potência recebida (dBm)',
      line: {
        color: colors.lineClr,
        width: 2.2,
      },
      hovertemplate:
        '<b>ht</b>: %{y:.1f} m<br><b>Pr</b>: %{x:.2f} dBm<extra></extra>',
      type: 'scatter',
    });

    return t;
  }, [heights, Pr, uncertainty, colors]);

  const layout = useMemo(
    () => ({
      paper_bgcolor: colors.paperBg,
      plot_bgcolor: colors.plotBg,

      margin: { l: 65, r: 30, t: 45, b: 55 },

      title: {
        text: 'Potência Recebida vs Altura do Transmissor',
        font: {
          color: colors.textClr,
          size: 15,
          family: 'Segoe UI, sans-serif',
        },
      },

      xaxis: {
        title: {
          text: 'Potência recebida (dBm)',
          font: { color: colors.textClr },
        },
        tickcolor: colors.gridClr,
        gridcolor: colors.gridClr,
        tickfont: { color: colors.textClr },
        showgrid: true,
      },

      yaxis: {
        title: {
          text: 'Altura do transmissor — ht (m)',
          font: { color: colors.textClr },
        },
        tickcolor: colors.gridClr,
        gridcolor: colors.gridClr,
        tickfont: { color: colors.textClr },
        showgrid: true,
      },

      legend: {
        x: 0.01,
        y: 0.99,
        bgcolor: colors.legendBg,
        bordercolor: colors.gridClr,
        borderwidth: 1,
        font: { color: colors.textClr },
      },
    }),
    [colors]
  );

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: [
      'select2d',
      'lasso2d',
      'autoScale2d',
    ],
    displaylogo: false,
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={config}
      className="plot-container"
    />
  );
}

/**
 * Main Graph component with tab switching.
 */
export default function Graph({
  activeTab,
  onTabChange,

  // Distance graph props
  distances,
  Pr,
  breakpoint,
  uncertaintyDist,

  // Height graph props
  heights,
  PrHeight,
  uncertaintyHeight,

  // Theme
  dark,
}) {
  const hasDistData =
    distances &&
    Pr &&
    distances.length > 0;

  const hasHeightData =
    heights &&
    PrHeight &&
    heights.length > 0;

  return (
    <div className="plot-card">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'distance' ? 'active' : ''}`}
          onClick={() => onTabChange('distance')}
        >
          📊 Potência vs Distância
        </button>

        <button
          className={`tab-btn ${activeTab === 'height' ? 'active' : ''}`}
          onClick={() => onTabChange('height')}
        >
          📐 Potência vs Altura do Transmissor
        </button>
      </div>

      <div className="plot-area">
        {activeTab === 'distance' && hasDistData && (
          <DistanceGraph
            distances={distances}
            Pr={Pr}
            breakpoint={breakpoint}
            uncertainty={uncertaintyDist}
            dark={dark}
          />
        )}

        {activeTab === 'height' && hasHeightData && (
          <HeightGraph
            heights={heights}
            Pr={PrHeight}
            uncertainty={uncertaintyHeight}
            dark={dark}
          />
        )}

        {(
          (activeTab === 'distance' && !hasDistData) ||
          (activeTab === 'height' && !hasHeightData)
        ) && (
          <div className="plot-placeholder">
            <p>
              Clique em <strong>⚡ Calcular</strong> para gerar o gráfico.
            </p>
          </div>
        )}
      </div>

      <p className="hint">
        Zoom: scroll &bull; Pan: clique e arraste &bull; Hover: passe o mouse sobre a curva
      </p>
    </div>
  );
}
