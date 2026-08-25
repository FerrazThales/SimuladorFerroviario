# Simulador Ferroviário

Este simulador foi criado por mim como uma forma de estudar e entender melhor alguns conceitos da ferrovia.

A ideia surgiu da necessidade de visualizar como funcionam elementos como linhas, blocos, pátios, sinais, sensores, AMVs, rotas e a movimentação dos trens.

## Acessar

https://ferrazthales.github.io/SimuladorFerroviario/

## Funcionalidades

O simulador possui:

- cenários de circulação;
- situações com falhas e bloqueios;
- movimentação em linhas e pátios;
- missões com escolhas operacionais;
- configuração personalizada de dois trens;
- representação visual dos estados da malha.

## Estados dos trechos

- **Verde:** livre
- **Amarelo:** reservado
- **Vermelho:** ocupado
- **Cinza:** indisponível ou interditado

## Tecnologias

- HTML
- CSS
- JavaScript
- SVG
- GitHub Pages

## Estrutura

```text
SimuladorFerroviario/
├── index.html
├── css/
│   └── cco.css
└── js/
    ├── cco.js
    └── decisions.js
