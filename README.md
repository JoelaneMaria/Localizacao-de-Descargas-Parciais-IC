# Modelo de Dois Raios — Two-Ray Ground Reflection Model

Simulador interativo do Modelo de Reflexão no Solo de Dois Raios, desenvolvido em React + Vite.

## Executar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173/` no navegador.

## Estrutura do projeto

```
├── referencia/                  # Arquivo HTML original (referência)
│   └── two_ray_model.html
├── src/
│   ├── calculations/
│   │   ├── doisRaios.js         # Funções matemáticas do modelo
│   │   └── test_doisRaios.js    # Testes de equivalência numérica
│   ├── components/
│   │   ├── Graph.jsx / .css     # Gráficos interativos (Plotly)
│   │   ├── KPI.jsx / .css       # Cartões de resultados calculados
│   │   ├── ParameterInput.jsx / .css  # Entrada numérica reutilizável
│   │   └── Sidebar.jsx / .css   # Painel lateral de parâmetros
│   ├── App.jsx / .css           # Componente principal
│   ├── index.css                # Variáveis de tema e estilos globais
│   └── main.jsx                 # Ponto de entrada do React
├── index.html
├── package.json
└── vite.config.js
```

## Testes numéricos

```bash
node src/calculations/test_doisRaios.js
```

Compara os resultados do módulo de cálculo com os valores esperados do arquivo HTML original.

## Funcionalidades

- Preservação exata das equações do modelo original
- Fórmula do breakpoint: Rb = 4·ht·hr / λ (sem π)
- Faixa de incerteza relativa da potência recebida
- Dois modos de gráfico: Potência vs Distância e Potência vs Altura do transmissor
- Temas claro e escuro
- Interface responsiva
- Tooltips explicativos nos parâmetros
