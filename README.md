# Localização de Descargas Parciais

## Simulador do Modelo de Dois Raios

## Sobre o projeto

Este projeto apresenta um simulador baseado no Modelo de Dois Raios com Reflexão no Solo (Two-Ray Ground Reflection Model), permitindo analisar a propagação de ondas eletromagnéticas e a potência recebida em função da distância e da altura da antena transmissora.

## Tecnologias utilizadas

- React
- JavaScript
- Vite
- Plotly

## Acesso ao simulador

O programa pode ser utilizado diretamente pelo navegador, sem necessidade de instalação.

[**Abrir Simulador.**](https://joelanemaria.github.io/Localizacao-de-Descargas-Parciais-IC/)

## Código-fonte

Todo o código-fonte e os arquivos do projeto estão disponíveis neste repositório.

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
- Fórmula do breakpoint: Rb = 4·ht·hr
- Faixa de incerteza relativa da potência recebida
- Dois modos de gráfico: Potência vs Distância e Potência vs Altura do transmissor
- Temas claro e escuro
- Interface responsiva
- Tooltips explicativos nos parâmetros
  
