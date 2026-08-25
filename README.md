# Simulador Ferroviário

Durante minha carreira, atuei em diversos segmentos. Já trabalhei em consultorias de TI, empresas de extração de petróleo e gás, na indústria de plásticos e no setor automotivo.

Por ser formado em Engenharia de Produção, sempre tento entender a lógica por trás dos processos e a forma como a dinâmica organizacional foi estruturada. Por que determinadas atividades são realizadas de uma maneira específica? Por que existem algumas diretorias e áreas especializadas? Como cada parte se conecta ao processo como um todo?

Atualmente, estou atuando no setor ferroviário, e tem sido um grande desafio entender não apenas os dados, mas também toda a parte técnica e processual envolvida.

Busquei em livros e artigos compreender melhor a nomenclatura utilizada na ferrovia. Por que uma estrutura é chamada de **obra de arte**? Por que se utiliza o termo **via permanente**? Por que existem diferentes bitolas? Aliás, entender a questão das bitolas no Brasil já é outro assunto bastante interessante.

Percebi que apenas ler sobre esses conceitos nem sempre era suficiente para compreender como tudo se relacionava. Por isso, criei este simulador como uma ferramenta pessoal de estudo e uma forma de visualizar melhor alguns elementos da ferrovia.

A ideia surgiu da necessidade de entender, de maneira mais prática, como funcionam linhas, blocos, pátios, sinais, sensores, AMVs, rotas e a movimentação dos trens.

Este simulador ainda é uma representação simplificada e acompanha o meu próprio processo de aprendizado. A intenção não é reproduzir uma operação ferroviária real, mas transformar conceitos que antes pareciam abstratos em algo visual, interativo e mais fácil de compreender.

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
