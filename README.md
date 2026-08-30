# Simulador Ferroviário

Aprender sobre ferrovia é um desafio porque a operação reúne muitos elementos que precisam funcionar de forma coordenada. Linhas, blocos, pátios, aparelhos de mudança de via, sinais, sensores, rotas, interdições e diferentes tipos de movimento fazem parte de um sistema amplo, no qual uma decisão pode afetar diversas áreas ao mesmo tempo.

Para quem está começando, nem sempre é fácil visualizar como esses conceitos se conectam. Textos, procedimentos e diagramas técnicos são fundamentais, mas podem parecer abstratos quando estudados separadamente. Este simulador foi criado para transformar parte desse conhecimento em uma experiência visual e interativa, ajudando a observar a malha, acompanhar a movimentação dos trens e compreender relações operacionais de maneira mais integrada.

O projeto apresenta um painel sinóptico ferroviário simplificado, inspirado na forma como linhas, pátios, blocos, sinais e rotas podem ser representados em ambientes de controle operacional. A proposta é oferecer um espaço de estudo no qual seja possível experimentar cenários, acompanhar alterações de estado na malha e analisar consequências de decisões simuladas.

> **Importante:** este projeto tem finalidade exclusivamente educacional. O simulador não reproduz integralmente uma ferrovia real, não representa procedimentos oficiais e não substitui normas, treinamentos, sistemas homologados ou orientações de empresas ferroviárias.

## Acessar o simulador

[https://ferrazthales.github.io/SimuladorFerroviario/](https://ferrazthales.github.io/SimuladorFerroviario/)

## O que pode ser estudado

O simulador permite observar conceitos relacionados a:

- linhas principais e vias de pátio;
- divisão da malha em blocos;
- ocupação, reserva e liberação de trechos;
- estabelecimento e proteção de rotas;
- liberação progressiva dos blocos após a passagem do trem;
- circulação em linha dupla;
- encontros e cruzamentos de trens em pátios;
- aparelhos de mudança de via, representados como AMVs;
- sinais e sensores distribuídos pela malha;
- manobras e estacionamento de composições;
- interdições e janelas de manutenção;
- falhas simuladas em trechos e AMVs;
- regulação de trens de carga;
- aproximação e recebimento em terminais;
- conflitos entre rotas e movimentos incompatíveis;
- tomada de decisão em situações operacionais simuladas.

## Modos de uso

### Cenários

Apresenta situações previamente configuradas para demonstrar comportamentos da malha. Os cenários incluem circulação simultânea, encontro de trens, falhas, bloqueios, manutenção, manobras, uso da pera de retorno e situações relacionadas à sinalização ferroviária.

### Modo Decisão

Apresenta missões divididas em fases. Em cada etapa, a pessoa analisa uma situação e escolhe uma alternativa. As decisões alteram indicadores como pontuação, segurança, tentativas e sequência, além de produzir consequências visuais no painel.

Após cada escolha, o simulador apresenta uma explicação didática sobre o impacto da decisão. O objetivo não é avaliar procedimentos reais, mas incentivar o raciocínio sobre segurança, capacidade, conflitos, comunicação, falhas e continuidade da operação.

### Operação Personalizada

Permite selecionar trens, velocidades e rotas previamente validadas. O simulador oferece somente percursos compatíveis com a posição inicial de cada trem e verifica a continuidade física entre os segmentos, reduzindo movimentos incoerentes ou saltos entre linhas.

Também é possível configurar mais de um trem para observar circulação paralela, compartilhamento de recursos e bloqueios causados por rotas incompatíveis.

## Leitura visual da malha

A representação gráfica utiliza cores para indicar o estado dos trechos:

- **Verde:** trecho livre;
- **Amarelo:** trecho pertencente a uma rota estabelecida e protegida;
- **Vermelho:** trecho ocupado por um trem;
- **Cinza:** trecho indisponível, interditado ou associado a uma falha simulada.

Durante uma movimentação, a rota pode ser reservada antes da partida. Conforme o trem avança, o bloco atual fica ocupado, os blocos à frente permanecem protegidos e os blocos já liberados retornam ao estado livre.

## Elementos representados

O painel sinóptico inclui:

- duas linhas principais;
- estações e limites de áreas operacionais;
- pátios de cruzamento, estacionamento e manobra;
- blocos e circuitos de via simplificados;
- AMVs e conexões entre vias;
- sinais ferroviários;
- sensores de detecção;
- pera de retorno;
- identificadores de trens;
- painel de estados da malha;
- linha do tempo de eventos operacionais;
- controles de zoom, navegação e tela cheia.

## Limitações

A ferrovia real envolve regras, tecnologias, responsabilidades e condições operacionais muito mais amplas do que as apresentadas neste projeto. Por isso:

- as distâncias e velocidades são ilustrativas;
- a geometria da malha é esquemática;
- os sinais e estados foram simplificados;
- os cenários não representam procedimentos oficiais;
- as decisões não devem ser utilizadas como orientação operacional;
- a lógica não substitui um sistema real de sinalização ou intertravamento;
- os conceitos podem variar conforme a ferrovia, a tecnologia adotada e a regulamentação aplicável.

## Tecnologias utilizadas

- HTML;
- CSS;
- JavaScript;
- SVG;
- GitHub Pages.

## Estrutura do projeto

```text
SimuladorFerroviario/
├── index.html
├── css/
│   └── cco.css
└── js/
    ├── cco.js
    └── decisions.js
```

## Objetivo do projeto

O objetivo principal é facilitar a aprendizagem por meio da visualização. Ao reunir diferentes elementos em um único painel, o simulador ajuda a construir uma visão mais ampla da ferrovia e das relações entre infraestrutura, sinalização, circulação, manutenção, pátios, terminais e tomada de decisão.

O projeto pode evoluir continuamente com novos cenários, rotas, elementos visuais e explicações. A intenção é tornar conceitos ferroviários mais acessíveis sem eliminar a complexidade que faz da ferrovia um ambiente técnico, integrado e desafiador.
