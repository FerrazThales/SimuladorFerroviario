// CCO Ferroviario de Carga - v18.1 - ajuste pera e cruzamento
// Responsabilidade deste arquivo: controlar a simulacao visual no navegador.
// Django continua apenas renderizando o template. Nenhum model, view ou url e alterado por este JS.

'use strict';

const CCO_CORES = {
    livre: '#36d979',
    reservado: '#d9b84a',
    ocupado: '#a94a4a',
    indisponivel: '#666666',
    sensorLivre: '#37c7d9',
    sensorAtivo: '#a94a4a',
    tremAguardando: '#ffd23f',
    tremCirculando: '#0078d4',
    tremBloqueado: '#a94a4a',
};

const ESTADO_SEGMENTO = {
    LIVRE: 'livre',
    RESERVADO: 'reservado',
    OCUPADO: 'ocupado',
    INDISPONIVEL: 'indisponivel',
};

const SEGMENTOS_INDISPONIVEIS_INICIAIS = new Set([
    'SEG-L2-B06',
    'SEG-AMV-07',
]);

const TRACK_SEGMENTS = {
    'SEG-L1-B01': 'L1-B01', 'SEG-L1-B02': 'L1-B02', 'SEG-L1-B03': 'L1-B03', 'SEG-L1-B04': 'L1-B04', 'SEG-L1-B05': 'L1-B05',
    'SEG-L1-B06': 'L1-B06', 'SEG-L1-B07': 'L1-B07', 'SEG-L1-B08': 'L1-B08', 'SEG-L1-B09': 'L1-B09',
    'SEG-L2-B01': 'L2-B01', 'SEG-L2-B02': 'L2-B02', 'SEG-L2-B03': 'L2-B03', 'SEG-L2-B04': 'L2-B04', 'SEG-L2-B05': 'L2-B05',
    'SEG-L2-B06': 'L2-B06', 'SEG-L2-B07': 'L2-B07', 'SEG-L2-B08': 'L2-B08', 'SEG-L2-B09': 'L2-B09',
    'SEG-PA1-B01': 'PA1-B01', 'SEG-PA1-B02': 'PA1-B02', 'SEG-PA2-B01': 'PA2-B01', 'SEG-PA2-B02': 'PA2-B02',
    'SEG-PA3-B01': 'PA3-B01', 'SEG-PA3-B02': 'PA3-B02',
    'SEG-PB1-B01': 'PB1-B01', 'SEG-PB2-B01': 'PB2-B01', 'SEG-PB3-B01': 'PB3-B01', 'SEG-PB4-B01': 'PB4-B01',
    'SEG-PERA-B01': 'PERA-B01', 'SEG-PERA-B02': 'PERA-B02', 'SEG-PERA-B03': 'PERA-B03',
    'SEG-AMV-01': 'AMV-01', 'SEG-AMV-02': 'AMV-02', 'SEG-AMV-03': 'AMV-03', 'SEG-AMV-04': 'AMV-04',
    'SEG-AMV-05': 'AMV-05', 'SEG-AMV-06': 'AMV-06', 'SEG-AMV-07': 'AMV-07',
    'SEG-AMV-09': 'AMV-09', 'SEG-AMV-10': 'AMV-10', 'SEG-AMV-11': 'AMV-11', 'SEG-AMV-12': 'AMV-12',
};

const ROUTES = {
    T101_MAIN: { trem: 'T101', nome: 'T101 pela Linha 1', segmentos: ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05','SEG-L1-B06','SEG-L1-B07','SEG-L1-B08','SEG-L1-B09'], sinais: ['S-L1-01','S-L1-02','S-L1-03','S-L1-04','S-L1-05'] },
    T201_MAIN: { trem: 'T201', nome: 'T201 cargueiro pela Linha 2', segmentos: ['SEG-L2-B01','SEG-L2-B02','SEG-L2-B03','SEG-L2-B04','SEG-L2-B05'], sinais: ['S-L2-01','S-L2-02','S-L2-03'] },
    T201_CRUZAMENTO_BLOQUEADOR: { trem: 'T201', nome: 'T201 ocupando zona de conflito L2-B07/L2-B08', segmentos: ['SEG-L2-B07','SEG-L2-B08','SEG-L2-B09'], sinais: ['S-L2-04','S-L2-05'] },
    T301_SAIDA_PATIO_A: { trem: 'T301', nome: 'T301 saida do Patio A para Linha 2', segmentos: ['SEG-PA1-B01','SEG-PA1-B02','SEG-AMV-06','SEG-L2-B06','SEG-L2-B07'], amvs: ['SEG-AMV-06'], sinais: ['S-PA-01','S-PA-02','S-L2-04'] },
    T302_FALHA_AMV: { trem: 'T302', nome: 'T302 tentativa bloqueada por falha de AMV-07', segmentos: ['SEG-PA3-B01','SEG-AMV-07','SEG-L2-B04'], amvs: ['SEG-AMV-07'], sinais: ['S-PA-01'] },
    T501_PERA: { trem: 'T501', nome: 'T501 retorno pela pera operacional', segmentos: ['SEG-PERA-B01','SEG-PERA-B02','SEG-PERA-B03'], amvs: ['SEG-AMV-11','SEG-AMV-12'], sinais: ['S-PR-01','S-PR-02','S-L2-05'] },
};

const ALTERNATIVE_ROUTES = {
    T301_SAIDA_PATIO_A: [
        { nome: 'T301 alternativa: Patio A -> AMV-06 -> L2-B07', segmentos: ['SEG-PA1-B01','SEG-PA1-B02','SEG-AMV-06','SEG-L2-B07'], amvs: ['SEG-AMV-06'], sinais: ['S-PA-01','S-PA-02','S-L2-04'] },
    ],
};

const SCENARIOS = {
    cruzamento: { nome: 'Cenario 1 - Cruzamento com Bloqueio', descricao: 'T201 ocupa L2-B07/L2-B08. T301 tenta sair do Patio A, encontra L2-B06 interditado e a alternativa L2-B07 ocupada.', rotas: ['T201_CRUZAMENTO_BLOQUEADOR', 'T301_SAIDA_PATIO_A'] },
    ultrapassagem: { nome: 'Cenario 2 - Ultrapassagem com Patio', descricao: 'T201 ocupa a Linha 2 enquanto T101 circula pela Linha 1.', rotas: ['T201_MAIN', 'T101_MAIN'] },
    falha_amv: { nome: 'Cenario 4 - Falha de AMV', descricao: 'T302 tenta sair do patio, mas AMV-07 esta indisponivel.', rotas: ['T302_FALHA_AMV'] },
    pera: { nome: 'Cenario 6 - Retorno pela Pera', descricao: 'T501 percorre a pera operacional.', rotas: ['T501_PERA'] },
};

const COMPRIMENTO_BLOCOS_TREM_CARGA = { T101: 1, T201: 1, T301: 1, T302: 1, T501: 1 };
const VELOCIDADE_TRECHO = { linha: 0.070, patio: 0.034, amv: 0.026, pera: 0.040 };
const FATOR_VELOCIDADE_TREM = { T101: 0.90, T201: 0.72, T301: 0.55, T302: 0.55, T501: 0.62 };

const SENSOR_DETECTION_DISTANCE = 18;
const SENSOR_RESET_MS = 1400;
const TRAIN_OFFSET = 0;

const segmentState = {};
const trainState = {};
const sensorState = {};
let activeTimers = [];
let activeAnimationFrames = [];

window.addEventListener('DOMContentLoaded', inicializarCCO);
document.addEventListener('click', ccoCliqueDelegado);

function ccoCliqueDelegado(event) {
    const botaoCenario = event.target.closest('[data-scenario]');
    if (botaoCenario) {
        event.preventDefault();
        event.stopPropagation();
        iniciarCenario(botaoCenario.dataset.scenario);
        return;
    }
    const botaoReset = event.target.closest('[data-action="reset"]');
    if (botaoReset) {
        event.preventDefault();
        event.stopPropagation();
        resetarCenario(true);
    }
}

function inicializarCCO() {
    inicializarSegmentos();
    inicializarTrens();
    inicializarSensores();
    resetarCenario(false);
    registrarEvento('CCO v17 carregado - pintura unica por segmento');
    registrarEvento('Regra: ocupado = vermelho, reservado = amarelo, livre = verde, interditado = cinza');
}

function inicializarSegmentos() {
    Object.keys(TRACK_SEGMENTS).forEach(segmentId => {
        if (!document.getElementById(segmentId)) return;
        segmentState[segmentId] = { estado: ESTADO_SEGMENTO.LIVRE, trem: null };
    });
}

function inicializarTrens() {
    document.querySelectorAll('[id^="TRAIN-"]').forEach(trainEl => {
        const codigo = trainEl.id.replace('TRAIN-', '');
        trainState[codigo] = {
            codigo, elemento: trainEl,
            transformInicial: trainEl.getAttribute('transform') || 'translate(0,0)',
            emMovimento: false, rotaAtual: null,
            segmentosReservados: [], segmentosOcupados: [],
            status: 'aguardando',
        };
    });
    trazerTrensParaFrente();
}

function inicializarSensores() {
    document.querySelectorAll('#sensor-layer circle.sensor').forEach((sensorEl, idx) => {
        const labelEl = sensorEl.nextElementSibling;
        const codigo = labelEl ? labelEl.textContent.trim() : `SN${idx + 1}`;
        sensorState[codigo] = { codigo, x: numeroAttr(sensorEl, 'cx'), y: numeroAttr(sensorEl, 'cy'), element: sensorEl, armado: true };
    });
}

function instalarPainelDeControle() {
    const panel = document.querySelector('.side-panel');
    if (!panel || document.getElementById('realista-controls')) return;

    const controls = document.createElement('div');
    controls.id = 'realista-controls';
    controls.className = 'info-box';
    controls.innerHTML = `
        <strong>Controle de cenarios</strong><br>
        <button class="btn-realista" data-scenario="cruzamento">Cenario 1 - Cruzamento com Bloqueio</button>
        <button class="btn-realista" data-scenario="ultrapassagem">Cenario 2 - Ultrapassagem com Patio</button>
        <button class="btn-realista" data-scenario="falha_amv">Cenario 4 - Falha de AMV</button>
        <button class="btn-realista" data-scenario="pera">Cenario 6 - Retorno pela Pera</button>
        <button class="btn-realista" data-action="reset">Resetar</button>
        <ul id="event-list" style="margin-top:10px; padding-left:17px; max-height:260px; overflow-y:auto;"></ul>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .btn-realista {
            width: 100%; margin: 4px 0; padding: 6px 8px;
            background: #12324a; border: 1px solid #2f8cff; color: #fff;
            font-family: Consolas, monospace; font-size: 11px; border-radius: 4px;
            cursor: pointer; text-align: left;
        }
        .btn-realista:hover { background: #16486d; }
    `;
    document.head.appendChild(style);
    panel.prepend(controls);

    controls.querySelectorAll('[data-scenario]').forEach(btn => {
        btn.addEventListener('click', () => iniciarCenario(btn.dataset.scenario));
    });
    controls.querySelector('[data-action="reset"]').addEventListener('click', () => resetarCenario(true));
}

function instalarCliquesCenariosSvg() {
    const layer = document.getElementById('scenario-layer');
    if (!layer || layer.dataset.clicksInstalados === 'true') return;
    layer.dataset.clicksInstalados = 'true';

    layer.querySelectorAll('.scenario-text').forEach(textEl => {
        textEl.style.cursor = 'pointer';
        textEl.addEventListener('click', evt => {
            evt.stopPropagation();
            const texto = textEl.textContent || '';
            if (texto.includes('Cruzamento')) iniciarCenario('cruzamento');
            else if (texto.includes('Ultrapassagem')) iniciarCenario('ultrapassagem');
            else if (texto.includes('Saida') || texto.includes('Saída')) iniciarCenario('cruzamento');
            else if (texto.includes('Falha')) iniciarCenario('falha_amv');
        });
    });
}

function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;

    resetarCenario(false);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);

    let delay = 0;
    scenario.rotas.forEach(routeName => {
        const timer = setTimeout(() => solicitarRota(routeName), delay);
        activeTimers.push(timer);
        delay += 2200;
    });
}

function solicitarRota(routeName) {
    const rotaPrincipal = ROUTES[routeName];
    if (!rotaPrincipal) return;

    const trem = trainState[rotaPrincipal.trem];
    if (!trem || trem.emMovimento) return;

    let rotaEscolhida = clonarRota(rotaPrincipal);
    let conflitos = verificarConflitos(rotaEscolhida);

    if (conflitos.length > 0) {
        const alternativa = encontrarAlternativaLivre(routeName);
        if (alternativa) {
            registrarEvento(`${rotaPrincipal.trem}: rota principal bloqueada (${conflitos[0]}). Usando alternativa.`);
            rotaEscolhida = alternativa;
            conflitos = [];
        }
    }

    if (conflitos.length > 0) {
        bloquearTrem(rotaPrincipal.trem, rotaPrincipal.sinais, conflitos[0]);
        return;
    }

    reservarRota(rotaEscolhida);
    alinharAMVs(rotaEscolhida);
    setSignals(rotaEscolhida.sinais, 'verde');
    mudarStatusTrem(rotaEscolhida.trem, 'circulando');
    registrarEvento(`${rotaEscolhida.trem}: rota autorizada - ${rotaEscolhida.nome}`);

    moverTremPorRota(rotaEscolhida);
}

function clonarRota(route) {
    return { ...route, segmentos: [...route.segmentos], sinais: route.sinais ? [...route.sinais] : [], amvs: route.amvs ? [...route.amvs] : [] };
}

function encontrarAlternativaLivre(routeName) {
    const alternativas = ALTERNATIVE_ROUTES[routeName] || [];
    for (const alternativa of alternativas) {
        const rota = { ...clonarRota(ROUTES[routeName]), nome: alternativa.nome, segmentos: [...alternativa.segmentos], sinais: alternativa.sinais ? [...alternativa.sinais] : [], amvs: alternativa.amvs ? [...alternativa.amvs] : [] };
        if (verificarConflitos(rota).length === 0) return rota;
    }
    return null;
}

function verificarConflitos(route) {
    const conflitos = [];
    route.segmentos.forEach(segmentId => {
        const state = segmentState[segmentId];
        const nome = TRACK_SEGMENTS[segmentId] || segmentId;
        if (!state) {
            conflitos.push(`${nome} inexistente no sinoptico`);
        } else if (state.estado === ESTADO_SEGMENTO.INDISPONIVEL) {
            conflitos.push(`${nome} interditado`);
        } else if (state.estado !== ESTADO_SEGMENTO.LIVRE && state.trem !== route.trem) {
            conflitos.push(`${nome} ${state.estado} por ${state.trem || 'outro trem'}`);
        }
    });
    return conflitos;
}

function reservarRota(route) {
    const trem = trainState[route.trem];
    trem.rotaAtual = route;
    trem.segmentosReservados = [...route.segmentos];
    trem.segmentosOcupados = [];

    route.segmentos.forEach(segmentId => {
        const state = segmentState[segmentId];
        if (!state || state.estado === ESTADO_SEGMENTO.INDISPONIVEL) return;
        state.estado = ESTADO_SEGMENTO.RESERVADO;
        state.trem = route.trem;
        pintarSegmento(segmentId, ESTADO_SEGMENTO.RESERVADO);
    });

    registrarEvento(`${route.trem}: ${route.segmentos.length} blocos reservados em amarelo`);
}

function alinharAMVs(route) {
    (route.amvs || []).forEach(segmentId => {
        const state = segmentState[segmentId];
        if (!state || state.estado === ESTADO_SEGMENTO.INDISPONIVEL) return;
        pintarSegmento(segmentId, state.estado);
    });
}

function moverTremPorRota(route) {
    const trem = trainState[route.trem];
    if (!trem) return;
    trem.emMovimento = true;
    moverTremNoSegmento(route, 0);
}

function moverTremNoSegmento(route, index) {
    const trem = trainState[route.trem];
    if (!trem) return;

    if (index >= route.segmentos.length) {
        finalizarRota(route);
        return;
    }

    const segmentId = route.segmentos[index];
    const segmentEl = document.getElementById(segmentId);
    if (!segmentEl || typeof segmentEl.getTotalLength !== 'function') {
        registrarEvento(`Erro: segmento ${segmentId} nao suporta movimento por path`);
        finalizarRota(route);
        return;
    }

    ocuparSegmento(route.trem, segmentId);

    const length = segmentEl.getTotalLength();
    const velocidade = velocidadeOperacional(segmentId, route.trem);
    const duration = Math.max(1200, length / velocidade);
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = suavizarMovimento(Math.min((timestamp - startTime) / duration, 1));
        const pos = posicaoComAngulo(segmentEl, length, progress);
        const pt = offsetNormal(pos, TRAIN_OFFSET);
        trem.elemento.setAttribute('transform', `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) rotate(${pos.angle.toFixed(2)})`);
        verificarSensores(route.trem, pos.x, pos.y);
        trazerTrensParaFrente();

        if (progress < 1) {
            const raf = requestAnimationFrame(step);
            activeAnimationFrames.push(raf);
        } else {
            moverTremNoSegmento(route, index + 1);
        }
    }

    const raf = requestAnimationFrame(step);
    activeAnimationFrames.push(raf);
}

function ocuparSegmento(codigoTrem, segmentId) {
    const trem = trainState[codigoTrem];
    const state = segmentState[segmentId];
    if (!trem || !state) return;

    state.estado = ESTADO_SEGMENTO.OCUPADO;
    state.trem = codigoTrem;

    if (!trem.segmentosOcupados.includes(segmentId)) {
        trem.segmentosOcupados.push(segmentId);
    }

    pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
    liberarCaudaSeNecessario(codigoTrem);
    repintarReservasDoTrem(codigoTrem);

    registrarEvento(`${codigoTrem}: bloco ocupado em vermelho - ${TRACK_SEGMENTS[segmentId] || segmentId}`);
}

function liberarCaudaSeNecessario(codigoTrem) {
    const trem = trainState[codigoTrem];
    if (!trem) return;

    const comprimento = COMPRIMENTO_BLOCOS_TREM_CARGA[codigoTrem] || 1;
    while (trem.segmentosOcupados.length > comprimento) {
        const segmentoLiberado = trem.segmentosOcupados.shift();
        liberarSegmento(codigoTrem, segmentoLiberado);
    }
}

function liberarSegmento(codigoTrem, segmentId) {
    const state = segmentState[segmentId];
    if (!state || state.trem !== codigoTrem) return;

    state.estado = ESTADO_SEGMENTO.LIVRE;
    state.trem = null;
    pintarSegmento(segmentId, ESTADO_SEGMENTO.LIVRE);
}

function repintarReservasDoTrem(codigoTrem) {
    const trem = trainState[codigoTrem];
    if (!trem || !trem.segmentosReservados) return;

    trem.segmentosReservados.forEach(segmentId => {
        const state = segmentState[segmentId];
        if (!state || state.trem !== codigoTrem) return;
        if (state.estado === ESTADO_SEGMENTO.RESERVADO) pintarSegmento(segmentId, ESTADO_SEGMENTO.RESERVADO);
        if (state.estado === ESTADO_SEGMENTO.OCUPADO) pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
    });
}

function finalizarRota(route) {
    const trem = trainState[route.trem];
    if (!trem) return;

    const todosSegmentos = new Set([...route.segmentos, ...trem.segmentosReservados, ...trem.segmentosOcupados]);
    todosSegmentos.forEach(segmentId => liberarSegmento(route.trem, segmentId));
    setSignals(route.sinais, 'vermelho');

    trem.emMovimento = false;
    trem.rotaAtual = null;
    trem.segmentosReservados = [];
    trem.segmentosOcupados = [];
    mudarStatusTrem(route.trem, 'aguardando');

    registrarEvento(`${route.trem}: rota concluida`);
}

function resetarCenario(registrar = true) {
    activeTimers.forEach(timer => clearTimeout(timer));
    activeTimers = [];
    activeAnimationFrames.forEach(raf => cancelAnimationFrame(raf));
    activeAnimationFrames = [];

    Object.keys(segmentState).forEach(segmentId => {
        const interditado = SEGMENTOS_INDISPONIVEIS_INICIAIS.has(segmentId);
        segmentState[segmentId].estado = interditado ? ESTADO_SEGMENTO.INDISPONIVEL : ESTADO_SEGMENTO.LIVRE;
        segmentState[segmentId].trem = null;
        pintarSegmento(segmentId, interditado ? ESTADO_SEGMENTO.INDISPONIVEL : ESTADO_SEGMENTO.LIVRE);
    });

    Object.values(trainState).forEach(trem => {
        trem.emMovimento = false;
        trem.rotaAtual = null;
        trem.segmentosReservados = [];
        trem.segmentosOcupados = [];
        trem.elemento.setAttribute('transform', trem.transformInicial);
        mudarStatusTrem(trem.codigo, 'aguardando');
    });
    trazerTrensParaFrente();

    Object.values(sensorState).forEach(sensor => {
        sensor.armado = true;
        sensor.element.classList.remove('active');
        sensor.element.style.setProperty('fill', CCO_CORES.sensorLivre, 'important');
    });

    document.querySelectorAll('.signal-lamp').forEach(lamp => setSignalVisual(lamp.id, 'vermelho'));

    const eventList = document.getElementById('event-list');
    if (eventList) eventList.innerHTML = '';
    if (registrar) registrarEvento('Cenario resetado');
}

function pintarSegmento(segmentId, estado) {
    const el = document.getElementById(segmentId);
    if (!el) return;

    el.classList.remove('reserved', 'occupied', 'unavailable', 'active', 'failed');

    let cor = CCO_CORES.livre;
    let largura = '4.8';
    let filtro = 'url(#glow-green)';
    let opacidade = '1';
    let tracejado = 'none';

    if (estado === ESTADO_SEGMENTO.RESERVADO) {
        cor = CCO_CORES.reservado; largura = '5.8'; filtro = 'none';
        el.classList.add('reserved');
    } else if (estado === ESTADO_SEGMENTO.OCUPADO) {
        cor = CCO_CORES.ocupado; largura = '6.5'; filtro = 'url(#glow-red)';
        el.classList.add('occupied');
    } else if (estado === ESTADO_SEGMENTO.INDISPONIVEL) {
        cor = CCO_CORES.indisponivel; largura = '6'; filtro = 'none'; opacidade = '0.75'; tracejado = '10 6';
        el.classList.add(segmentId.includes('AMV') ? 'failed' : 'unavailable');
    }

    el.style.setProperty('stroke', cor, 'important');
    el.style.setProperty('stroke-width', largura, 'important');
    el.style.setProperty('filter', filtro, 'important');
    el.style.setProperty('opacity', opacidade, 'important');
    el.style.setProperty('stroke-dasharray', tracejado, 'important');
}

function setSignals(sinais = [], estado) {
    sinais.forEach(signalId => setSignalVisual(signalId, estado));
}

function setSignalVisual(signalId, estado) {
    const lamp = document.getElementById(signalId);
    if (!lamp) return;
    lamp.classList.remove('green', 'yellow', 'red');
    if (estado === 'verde') lamp.classList.add('green');
    else if (estado === 'amarelo') lamp.classList.add('yellow');
    else lamp.classList.add('red');
}

function bloquearTrem(codigoTrem, sinais = [], motivo) {
    mudarStatusTrem(codigoTrem, 'bloqueado');
    setSignals(sinais, 'vermelho');
    registrarEvento(`${codigoTrem}: rota negada - ${motivo}`);
}

function mudarStatusTrem(codigoTrem, status) {
    const trem = trainState[codigoTrem];
    if (!trem) return;
    trem.status = status;
    const rect = trem.elemento.querySelector('rect');
    if (!rect) return;

    const cor = status === 'circulando' ? CCO_CORES.tremCirculando
        : status === 'bloqueado' ? CCO_CORES.tremBloqueado
        : CCO_CORES.tremAguardando;
    rect.style.setProperty('fill', cor, 'important');
}

function verificarSensores(codigoTrem, x, y) {
    Object.values(sensorState).forEach(sensor => {
        if (!sensor.armado) return;
        const distancia = Math.hypot(sensor.x - x, sensor.y - y);
        if (distancia > SENSOR_DETECTION_DISTANCE) return;

        sensor.armado = false;
        sensor.element.classList.add('active');
        sensor.element.style.setProperty('fill', CCO_CORES.sensorAtivo, 'important');
        registrarEvento(`Sensor ${sensor.codigo} detectou ${codigoTrem}`);

        setTimeout(() => {
            sensor.armado = true;
            sensor.element.classList.remove('active');
            sensor.element.style.setProperty('fill', CCO_CORES.sensorLivre, 'important');
        }, SENSOR_RESET_MS);
    });
}

function velocidadeOperacional(segmentId, codigoTrem) {
    const tipo = tipoSegmento(segmentId);
    const velocidadeBase = VELOCIDADE_TRECHO[tipo] || VELOCIDADE_TRECHO.linha;
    const fator = FATOR_VELOCIDADE_TREM[codigoTrem] || 1;
    return Math.max(0.018, velocidadeBase * fator);
}

function tipoSegmento(segmentId) {
    if (segmentId.includes('AMV')) return 'amv';
    if (segmentId.includes('PERA')) return 'pera';
    if (segmentId.includes('PA') || segmentId.includes('PB')) return 'patio';
    return 'linha';
}


function posicaoComAngulo(path, length, progress) {
    const d = Math.max(0, Math.min(length, length * progress));
    const pt = path.getPointAtLength(d);
    const ahead = path.getPointAtLength(Math.min(length, d + 2));
    const behind = path.getPointAtLength(Math.max(0, d - 2));
    const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
    return { x: pt.x, y: pt.y, angle };
}

function offsetNormal(pos, offset) {
    const rad = (pos.angle - 90) * Math.PI / 180;
    return { x: pos.x + Math.cos(rad) * offset, y: pos.y + Math.sin(rad) * offset };
}

function suavizarMovimento(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

function trazerTrensParaFrente() {
    const layer = document.getElementById('train-layer');
    if (layer && layer.parentNode) layer.parentNode.appendChild(layer);
}

function numeroAttr(el, attr) {
    const valor = parseFloat(el.getAttribute(attr));
    return Number.isNaN(valor) ? 0 : valor;
}

function registrarEvento(texto) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${texto}`;
    li.style.cssText = 'font-size:10px; margin-bottom:4px; color:#cfcfcf;';
    eventList.prepend(li);
}

window.CCO_DEBUG = { segmentState, trainState, iniciarCenario, resetarCenario, solicitarRota };

/* ===== Ajustes de layout v19: menu superior e eventos no rodape ===== */
function instalarPainelDeControle() { return; }
function instalarCliquesCenariosSvg() { return; }
function marcarCenarioAtivo(nomeCenario) {
    document.querySelectorAll('[data-scenario]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scenario === nomeCenario);
    });
}
function ccoCliqueDelegado(event) {
    const botaoCenario = event.target.closest('[data-scenario]');
    if (botaoCenario) {
        event.preventDefault();
        event.stopPropagation();
        iniciarCenario(botaoCenario.dataset.scenario);
        return;
    }
    const botaoReset = event.target.closest('[data-action="reset"]');
    if (botaoReset) {
        event.preventDefault();
        event.stopPropagation();
        resetarCenario(true);
        marcarCenarioAtivo(null);
    }
}
function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);
    let delay = 0;
    scenario.rotas.forEach(routeName => {
        const timer = setTimeout(() => solicitarRota(routeName), delay);
        activeTimers.push(timer);
        delay += 2200;
    });
}
function registrarEvento(texto) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${texto}`;
    eventList.prepend(li);
}


// ===== Revisao v21 - cenarios adicionais sem reescrever o controlador =====
// Mantem o arquivo legivel e preserva a estrutura original.
COMPRIMENTO_BLOCOS_TREM_CARGA.T401 = 1;

ROUTES.T401_PATIO_B = {
    trem: 'T401',
    nome: 'T401 manobra no Patio B',
    segmentos: ['SEG-PB1-B01', 'SEG-PB2-B01', 'SEG-PB3-B01', 'SEG-PB4-B01'],
    sinais: ['S-PB-01', 'S-PB-02']
};

ROUTES.T101_JANELA_MANUTENCAO = {
    trem: 'T101',
    nome: 'T101 desviado pela Linha 1 durante manutencao',
    segmentos: ['SEG-L1-B01', 'SEG-L1-B02', 'SEG-L1-B03', 'SEG-L1-B04', 'SEG-L1-B05', 'SEG-L1-B06'],
    sinais: ['S-L1-01', 'S-L1-02', 'S-L1-03', 'S-L1-04']
};

SCENARIOS.saida_patio = {
    nome: 'Cenario 3 - Saida de Patio',
    descricao: 'T301 sai do Patio A e solicita entrada na Linha 2.',
    rotas: ['T301_SAIDA_PATIO_A']
};

SCENARIOS.terminal = {
    nome: 'Cenario 5 - Terminal / Patio B',
    descricao: 'T401 executa manobra no Patio B como aproximacao de terminal de carga.',
    rotas: ['T401_PATIO_B']
};

SCENARIOS.manutencao = {
    nome: 'Cenario 7 - Janela de Manutencao',
    descricao: 'T101 opera em desvio controlado enquanto outro trem encontra restricao no patio.',
    rotas: ['T101_JANELA_MANUTENCAO', 'T302_FALHA_AMV']
};

SCENARIOS.comboio_longo = {
    nome: 'Cenario 8 - Comboio Longo',
    descricao: 'T201 simula trem cargueiro longo ocupando mais blocos durante a movimentacao.',
    rotas: ['T201_MAIN']
};

// Ajuste visual para os novos trens SVG: muda a locomotiva sem quebrar o desenho.
function mudarStatusTrem(codigoTrem, status) {
    const trem = trainState[codigoTrem];
    if (!trem) return;

    trem.status = status;
    const alvo = trem.elemento.querySelector('.train-loco') || trem.elemento.querySelector('rect');
    if (!alvo) return;

    const cor = status === 'circulando' ? CCO_CORES.tremCirculando
        : status === 'bloqueado' ? CCO_CORES.tremBloqueado
        : CCO_CORES.tremAguardando;

    alvo.style.setProperty('fill', cor, 'important');
}


// ===== Revisao v24 - cenarios reorganizados e coerentes =====
// Objetivo: cada cenario deve testar uma condicao operacional unica.
// 1. Linha dupla / ultrapassagem: nenhum trecho bloqueado.
// 2. Cruzamento bloqueado: bloqueio por ocupacao, nao por interdicao fixa.
// 3. Saida de patio livre: rota autorizada sem bloqueio herdado.
// 4. Falha AMV: bloqueio proposital no AMV-07.
// 5. Retorno pera: percurso pela pera com AMVs de entrada e saida.
// 6. Manobra Patio B: movimentacao em uma linha coerente do Patio B.
// 7. Janela manutencao: L2-B06 interditado, circulacao desviada pela Linha 1.
// 8. Comboio longo: T201 ocupa mais blocos e percorre rota longa.

const BLOQUEIOS_PADRAO_V24 = [];
const COMPRIMENTO_PADRAO_V24 = {
    T101: 1,
    T201: 1,
    T301: 1,
    T302: 1,
    T401: 1,
    T501: 1,
};

Object.assign(COMPRIMENTO_BLOCOS_TREM_CARGA, COMPRIMENTO_PADRAO_V24);
SEGMENTOS_INDISPONIVEIS_INICIAIS.clear();

ROUTES.T201_LINHA2_LONGA = {
    trem: 'T201',
    nome: 'T201 comboio longo pela Linha 2 completa',
    segmentos: ['SEG-L2-B01','SEG-L2-B02','SEG-L2-B03','SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08','SEG-L2-B09'],
    sinais: ['S-L2-01','S-L2-02','S-L2-03','S-L2-04','S-L2-05']
};

ROUTES.T301_SAIDA_PATIO_LIVRE = {
    trem: 'T301',
    nome: 'T301 saida autorizada do Patio A para Linha 2',
    segmentos: ['SEG-PA1-B01','SEG-PA1-B02','SEG-AMV-06','SEG-L2-B06','SEG-L2-B07'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-01','S-PA-02','S-L2-04']
};

ROUTES.T501_PERA_COMPLETA = {
    trem: 'T501',
    nome: 'T501 retorno completo pela pera operacional',
    segmentos: ['SEG-AMV-11','SEG-PERA-B01','SEG-PERA-B02','SEG-PERA-B03','SEG-AMV-12'],
    amvs: ['SEG-AMV-11','SEG-AMV-12'],
    sinais: ['S-PR-01','S-PR-02','S-L2-05']
};

ROUTES.T401_PATIO_B_LINHA1 = {
    trem: 'T401',
    nome: 'T401 manobra em linha unica do Patio B',
    segmentos: ['SEG-AMV-09','SEG-PB1-B01'],
    amvs: ['SEG-AMV-09'],
    sinais: ['S-PB-01']
};

ROUTES.T101_DESVIO_MANUTENCAO = {
    trem: 'T101',
    nome: 'T101 desvio pela Linha 1 durante manutencao da Linha 2',
    segmentos: ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05','SEG-L1-B06','SEG-L1-B07'],
    sinais: ['S-L1-01','S-L1-02','S-L1-03','S-L1-04']
};

Object.assign(SCENARIOS, {
    cruzamento: {
        nome: 'Cenario 1 - Cruzamento bloqueado por ocupacao',
        descricao: 'T201 ocupa L2-B07/L2-B08/L2-B09. T301 solicita saida do Patio A e deve ser bloqueado por ocupacao em L2-B07.',
        rotas: ['T201_CRUZAMENTO_BLOQUEADOR', 'T301_SAIDA_PATIO_LIVRE'],
        bloqueios: []
    },
    ultrapassagem: {
        nome: 'Cenario 2 - Linha dupla / ultrapassagem operacional',
        descricao: 'T201 circula pela Linha 2 ate L2-B05 enquanto T101 passa pela Linha 1. Nao ha uso de trecho interditado.',
        rotas: ['T201_MAIN', 'T101_MAIN'],
        bloqueios: []
    },
    saida_patio: {
        nome: 'Cenario 3 - Saida de patio autorizada',
        descricao: 'T301 sai do Patio A para a Linha 2 com L2-B06 liberado. Este cenario deve concluir rota, nao negar por interdicao.',
        rotas: ['T301_SAIDA_PATIO_LIVRE'],
        bloqueios: []
    },
    falha_amv: {
        nome: 'Cenario 4 - Falha de AMV na saida do patio',
        descricao: 'T302 tenta usar AMV-07 indisponivel. A rota deve ser negada por falha de AMV.',
        rotas: ['T302_FALHA_AMV'],
        bloqueios: ['SEG-AMV-07']
    },
    pera: {
        nome: 'Cenario 5 - Retorno pela pera operacional',
        descricao: 'T501 percorre entrada, curva de pera e saida operacional pela pera.',
        rotas: ['T501_PERA_COMPLETA'],
        bloqueios: []
    },
    terminal: {
        nome: 'Cenario 6 - Manobra coerente no Patio B',
        descricao: 'T401 acessa uma linha do Patio B por AMV-09 e permanece em uma linha de patio, sem pular entre vias paralelas.',
        rotas: ['T401_PATIO_B_LINHA1'],
        bloqueios: []
    },
    manutencao: {
        nome: 'Cenario 7 - Janela de manutencao na Linha 2',
        descricao: 'L2-B06 fica interditado por manutencao. T101 circula pela Linha 1 como desvio operacional.',
        rotas: ['T101_DESVIO_MANUTENCAO'],
        bloqueios: ['SEG-L2-B06']
    },
    comboio_longo: {
        nome: 'Cenario 8 - Comboio longo na Linha 2',
        descricao: 'T201 percorre a Linha 2 completa com comprimento operacional de 3 blocos.',
        rotas: ['T201_LINHA2_LONGA'],
        bloqueios: [],
        comprimentos: { T201: 3 }
    }
});

function aplicarConfiguracaoDoCenario(scenario) {
    SEGMENTOS_INDISPONIVEIS_INICIAIS.clear();
    (scenario.bloqueios || BLOQUEIOS_PADRAO_V24).forEach(segmentId => SEGMENTOS_INDISPONIVEIS_INICIAIS.add(segmentId));
    Object.assign(COMPRIMENTO_BLOCOS_TREM_CARGA, COMPRIMENTO_PADRAO_V24, scenario.comprimentos || {});
}

function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;

    aplicarConfiguracaoDoCenario(scenario);
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);

    let delay = 0;
    scenario.rotas.forEach(routeName => {
        const timer = setTimeout(() => solicitarRota(routeName), delay);
        activeTimers.push(timer);
        delay += 2200;
    });
}

function resetarCenario(registrar = true) {
    activeTimers.forEach(timer => clearTimeout(timer));
    activeTimers = [];
    activeAnimationFrames.forEach(raf => cancelAnimationFrame(raf));
    activeAnimationFrames = [];

    Object.keys(segmentState).forEach(segmentId => {
        const interditado = SEGMENTOS_INDISPONIVEIS_INICIAIS.has(segmentId);
        segmentState[segmentId].estado = interditado ? ESTADO_SEGMENTO.INDISPONIVEL : ESTADO_SEGMENTO.LIVRE;
        segmentState[segmentId].trem = null;
        pintarSegmento(segmentId, interditado ? ESTADO_SEGMENTO.INDISPONIVEL : ESTADO_SEGMENTO.LIVRE);
    });

    Object.values(trainState).forEach(trem => {
        trem.emMovimento = false;
        trem.rotaAtual = null;
        trem.segmentosReservados = [];
        trem.segmentosOcupados = [];
        trem.elemento.setAttribute('transform', trem.transformInicial);
        mudarStatusTrem(trem.codigo, 'aguardando');
    });

    trazerTrensParaFrente();

    Object.values(sensorState).forEach(sensor => {
        sensor.armado = true;
        sensor.element.classList.remove('active');
        sensor.element.style.setProperty('fill', CCO_CORES.sensorLivre, 'important');
    });

    document.querySelectorAll('.signal-lamp').forEach(lamp => setSignalVisual(lamp.id, 'vermelho'));

    const eventList = document.getElementById('event-list');
    if (eventList) eventList.innerHTML = '';
    if (registrar) registrarEvento('Cenario resetado');
}


// ===== Revisao v25 - cruzamento realista no Patio A =====
// Este ajuste corrige o antigo "Cruzamento bloqueado".
// Agora o cenario representa uma situacao ferroviaria mais plausivel:
// - T301 esta parado na via de cruzamento do Patio A.
// - T201 solicita entrada no Patio A para cruzar/aguardar.
// - A entrada e negada porque a via de cruzamento PA1 ja esta ocupada.
// - T101 pode circular pela Linha 1 enquanto o Patio A permanece ocupado.

ROUTES.T201_ENTRADA_PATIO_A_CRUZAMENTO = {
    trem: 'T201',
    nome: 'T201 solicitando entrada no Patio A para cruzamento',
    segmentos: ['SEG-L2-B06', 'SEG-AMV-06', 'SEG-PA1-B02', 'SEG-PA1-B01'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-L2-04', 'S-PA-02', 'S-PA-01']
};

ROUTES.T301_PARADO_PATIO_A = {
    trem: 'T301',
    nome: 'T301 parado na via de cruzamento do Patio A',
    segmentos: ['SEG-PA1-B01', 'SEG-PA1-B02'],
    sinais: ['S-PA-01', 'S-PA-02']
};

SCENARIOS.cruzamento = {
    nome: 'Cenario 1 - Cruzamento bloqueado no Patio A',
    descricao: 'T301 esta parado ocupando PA1-B01/PA1-B02. T201 solicita entrada no Patio A para cruzamento e a rota deve ser negada porque a via de cruzamento esta ocupada.',
    rotas: ['T201_ENTRADA_PATIO_A_CRUZAMENTO', 'T101_MAIN'],
    bloqueios: [],
    ocupacoesIniciais: [
        { trem: 'T301', segmentos: ['SEG-PA1-B01', 'SEG-PA1-B02'], status: 'aguardando' }
    ]
};

function aplicarOcupacoesIniciaisDoCenario(scenario) {
    (scenario.ocupacoesIniciais || []).forEach(ocupacao => {
        const trem = trainState[ocupacao.trem];
        if (trem) {
            trem.segmentosReservados = [];
            trem.segmentosOcupados = [...ocupacao.segmentos];
            trem.status = ocupacao.status || 'aguardando';
            mudarStatusTrem(ocupacao.trem, trem.status);
        }

        ocupacao.segmentos.forEach(segmentId => {
            const state = segmentState[segmentId];
            if (!state) return;
            state.estado = ESTADO_SEGMENTO.OCUPADO;
            state.trem = ocupacao.trem;
            pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
        });

        registrarEvento(`${ocupacao.trem}: ocupando via de cruzamento do Patio A`);
    });
}

function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;

    aplicarConfiguracaoDoCenario(scenario);
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);
    aplicarOcupacoesIniciaisDoCenario(scenario);

    let delay = 0;
    scenario.rotas.forEach(routeName => {
        const timer = setTimeout(() => solicitarRota(routeName), delay);
        activeTimers.push(timer);
        delay += 2200;
    });
}


// ===== Revisao v26 - cruzamento operacional realista =====
// Corrige o antigo cenario de cruzamento: agora nao e "bloqueio" sem cruzamento.
// A logica fica mais parecida com uma operacao real de patio de cruzamento:
// 1) T301 esta aguardando no Patio A, ocupando PA1-B01/PA1-B02.
// 2) T201 passa pela Linha 2, no trecho adjacente ao Patio A.
// 3) Depois da passagem de T201, T301 recebe rota de saida do Patio A para a Linha 2.
// Assim, o cruzamento e operacional: um trem aguarda no patio enquanto outro passa pela linha principal.

ROUTES.T201_PASSAGEM_CRUZAMENTO_PATIO_A = {
    trem: 'T201',
    nome: 'T201 passagem pela Linha 2 junto ao Patio A',
    segmentos: ['SEG-L2-B05', 'SEG-L2-B06', 'SEG-L2-B07', 'SEG-L2-B08', 'SEG-L2-B09'],
    sinais: ['S-L2-03', 'S-L2-04', 'S-L2-05']
};

ROUTES.T301_SAIDA_APOS_CRUZAMENTO = {
    trem: 'T301',
    nome: 'T301 saida do Patio A apos cruzamento',
    segmentos: ['SEG-PA1-B01', 'SEG-PA1-B02', 'SEG-AMV-06', 'SEG-L2-B06', 'SEG-L2-B07'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-01', 'S-PA-02', 'S-L2-04']
};

SCENARIOS.cruzamento = {
    nome: 'Cenario 1 - Cruzamento operacional no Patio A',
    descricao: 'T301 aguarda no Patio A enquanto T201 passa pela Linha 2. Apos a passagem, T301 sai do patio para a Linha 2. Este cenario representa um cruzamento operacional realista, nao um bloqueio artificial.',
    bloqueios: [],
    ocupacoesIniciais: [
        { trem: 'T301', segmentos: ['SEG-PA1-B01', 'SEG-PA1-B02'], status: 'aguardando' }
    ],
    rotas: [
        { rota: 'T201_PASSAGEM_CRUZAMENTO_PATIO_A', delay: 0 },
        { rota: 'T301_SAIDA_APOS_CRUZAMENTO', delay: 18000 }
    ]
};

function aplicarOcupacoesIniciaisDoCenario(scenario) {
    (scenario.ocupacoesIniciais || []).forEach(ocupacao => {
        const trem = trainState[ocupacao.trem];
        if (trem) {
            trem.segmentosReservados = [];
            trem.segmentosOcupados = [...ocupacao.segmentos];
            trem.status = ocupacao.status || 'aguardando';
            mudarStatusTrem(ocupacao.trem, trem.status);
        }

        ocupacao.segmentos.forEach(segmentId => {
            const state = segmentState[segmentId];
            if (!state) return;
            state.estado = ESTADO_SEGMENTO.OCUPADO;
            state.trem = ocupacao.trem;
            pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
        });

        registrarEvento(`${ocupacao.trem}: aguardando no Patio A para cruzamento`);
    });
}

function normalizarItemRotaDoCenario(item, delayPadrao) {
    if (typeof item === 'string') {
        return { routeName: item, delay: delayPadrao };
    }

    return {
        routeName: item.rota || item.routeName || item.route || item.nome,
        delay: Number.isFinite(item.delay) ? item.delay : delayPadrao,
    };
}

function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;

    aplicarConfiguracaoDoCenario(scenario);
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);
    aplicarOcupacoesIniciaisDoCenario(scenario);

    let delayPadrao = 0;
    scenario.rotas.forEach(item => {
        const itemNormalizado = normalizarItemRotaDoCenario(item, delayPadrao);
        if (!itemNormalizado.routeName) return;

        const timer = setTimeout(() => solicitarRota(itemNormalizado.routeName), itemNormalizado.delay);
        activeTimers.push(timer);
        delayPadrao += 2200;
    });
}


// ===== Revisao v28 - cruzamento real como encontro em patio =====
// Cenario redesenhado com criterio operacional:
// - Cruzamento ferroviario real em linha singela/patio de cruzamento significa encontro de trens em sentidos opostos.
// - Um trem fica/avanca pela via desviada do patio, enquanto outro passa pela principal em sentido contrario.
// - Apos a passagem do trem da principal, o trem do patio e liberado para sair em uma unica direcao coerente.
// - Nao ha mais movimento artificial L2-B06 para esquerda e depois para direita.

Object.assign(TRACK_SEGMENTS, {
    'SEG-L2-B04-R': 'L2-B04 sentido oeste',
    'SEG-L2-B05-R': 'L2-B05 sentido oeste',
    'SEG-L2-B06-R': 'L2-B06 sentido oeste',
    'SEG-L2-B07-R': 'L2-B07 sentido oeste',
    'SEG-L2-B08-R': 'L2-B08 sentido oeste',
    'SEG-L2-B09-R': 'L2-B09 sentido oeste',
});

ROUTES.T101_PRINCIPAL_OESTE_CRUZAMENTO = {
    trem: 'T101',
    nome: 'T101 principal sentido oeste pelo Patio A',
    segmentos: ['SEG-L2-B09-R', 'SEG-L2-B08-R', 'SEG-L2-B07-R', 'SEG-L2-B06-R', 'SEG-L2-B05-R', 'SEG-L2-B04-R'],
    sinais: ['S-L2-05', 'S-L2-04', 'S-L2-03']
};

ROUTES.T301_DESVIADA_PATIO_A_CRUZAMENTO = {
    trem: 'T301',
    nome: 'T301 desviada do Patio A aguardando cruzamento',
    segmentos: ['SEG-PA1-B02'],
    sinais: ['S-PA-01', 'S-PA-02']
};

ROUTES.T301_SAIDA_PATIO_A_LESTE_POS_CRUZAMENTO = {
    trem: 'T301',
    nome: 'T301 saida leste do Patio A apos cruzamento',
    segmentos: ['SEG-AMV-06', 'SEG-L2-B07', 'SEG-L2-B08', 'SEG-L2-B09'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-02', 'S-L2-04', 'S-L2-05']
};

SCENARIOS.cruzamento = {
    nome: 'Cenario 1 - Cruzamento real no Patio A',
    descricao: 'T301 ocupa a via desviada PA1 do Patio A e avanca lentamente pela desviada. T101 passa em sentido contrario pela Linha 2. Depois que T101 libera a principal, T301 sai pela ponta leste do patio para L2-B07/L2-B08/L2-B09.',
    bloqueios: [],
    posicoesIniciais: {
        T101: 'translate(1660,230)',
        T301: 'translate(820,330)'
    },
    rotas: [
        { rota: 'T301_DESVIADA_PATIO_A_CRUZAMENTO', delay: 0 },
        { rota: 'T101_PRINCIPAL_OESTE_CRUZAMENTO', delay: 900 },
        { rota: 'T301_SAIDA_PATIO_A_LESTE_POS_CRUZAMENTO', delay: 21500 }
    ]
};

function aplicarPosicoesIniciaisDoCenario(scenario) {
    Object.entries(scenario.posicoesIniciais || {}).forEach(([codigoTrem, transform]) => {
        const trem = trainState[codigoTrem];
        if (!trem) return;
        trem.elemento.setAttribute('transform', transform);
    });
}

function aplicarOcupacoesIniciaisDoCenario(scenario) {
    (scenario.ocupacoesIniciais || []).forEach(ocupacao => {
        const trem = trainState[ocupacao.trem];
        if (trem) {
            trem.segmentosReservados = [];
            trem.segmentosOcupados = [...ocupacao.segmentos];
            trem.status = ocupacao.status || 'aguardando';
            mudarStatusTrem(ocupacao.trem, trem.status);
        }

        ocupacao.segmentos.forEach(segmentId => {
            const state = segmentState[segmentId];
            if (!state) return;
            state.estado = ESTADO_SEGMENTO.OCUPADO;
            state.trem = ocupacao.trem;
            pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
        });
    });
}

function normalizarItemRotaDoCenario(item, delayPadrao) {
    if (typeof item === 'string') {
        return { routeName: item, delay: delayPadrao };
    }

    return {
        routeName: item.rota || item.routeName || item.route || item.nome,
        delay: Number.isFinite(item.delay) ? item.delay : delayPadrao,
    };
}

function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;

    aplicarConfiguracaoDoCenario(scenario);
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    aplicarPosicoesIniciaisDoCenario(scenario);
    aplicarOcupacoesIniciaisDoCenario(scenario);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);

    let delayPadrao = 0;
    scenario.rotas.forEach(item => {
        const itemNormalizado = normalizarItemRotaDoCenario(item, delayPadrao);
        if (!itemNormalizado.routeName) return;

        const timer = setTimeout(() => solicitarRota(itemNormalizado.routeName), itemNormalizado.delay);
        activeTimers.push(timer);
        delayPadrao += 2200;
    });
}


// ===== Revisao v29 - encontro de trens com logica de CCO =====
// Cenario ferroviario corrigido:
// - O nome passa a ser "Encontro de trens", que e mais preciso que "cruzamento real".
// - T301 entra/avanca pela desviada PA1-B02 do Patio A. Primeiro a rota fica RESERVADA em amarelo, depois OCUPADA em vermelho.
// - T301 permanece parado ocupando a desviada enquanto T101 passa pela Linha 2 em sentido contrario.
// - Depois que T101 libera a principal, T301 sai pela ponta leste sem voltar para L2-B06.
// - A saida de T301 tambem reserva a rota em amarelo antes de ocupar em vermelho.

Object.assign(TRACK_SEGMENTS, {
    'SEG-L2-B04-R': 'L2-B04 sentido oeste',
    'SEG-L2-B05-R': 'L2-B05 sentido oeste',
    'SEG-L2-B06-R': 'L2-B06 sentido oeste',
    'SEG-L2-B07-R': 'L2-B07 sentido oeste',
    'SEG-L2-B08-R': 'L2-B08 sentido oeste',
    'SEG-L2-B09-R': 'L2-B09 sentido oeste',
});

const CONFLITOS_FISICOS_V29 = {
    'SEG-L2-B04-R': ['SEG-L2-B04'],
    'SEG-L2-B05-R': ['SEG-L2-B05'],
    'SEG-L2-B06-R': ['SEG-L2-B06'],
    'SEG-L2-B07-R': ['SEG-L2-B07'],
    'SEG-L2-B08-R': ['SEG-L2-B08'],
    'SEG-L2-B09-R': ['SEG-L2-B09'],
    'SEG-L2-B04': ['SEG-L2-B04-R'],
    'SEG-L2-B05': ['SEG-L2-B05-R'],
    'SEG-L2-B06': ['SEG-L2-B06-R'],
    'SEG-L2-B07': ['SEG-L2-B07-R'],
    'SEG-L2-B08': ['SEG-L2-B08-R'],
    'SEG-L2-B09': ['SEG-L2-B09-R'],
};

ROUTES.T301_ENTRA_DESVIADA_PATIO_A = {
    trem: 'T301',
    nome: 'T301 entrando na desviada PA1 para aguardar encontro',
    segmentos: ['SEG-PA1-B02'],
    sinais: ['S-PA-01', 'S-PA-02'],
    manterOcupadoAoFinal: true
};

ROUTES.T101_PASSAGEM_OESTE_LINHA2 = {
    trem: 'T101',
    nome: 'T101 passagem sentido oeste pela Linha 2 principal',
    segmentos: ['SEG-L2-B09-R', 'SEG-L2-B08-R', 'SEG-L2-B07-R', 'SEG-L2-B06-R', 'SEG-L2-B05-R', 'SEG-L2-B04-R'],
    sinais: ['S-L2-05', 'S-L2-04', 'S-L2-03']
};

ROUTES.T301_SAIDA_LESTE_APOS_ENCONTRO = {
    trem: 'T301',
    nome: 'T301 saida leste da desviada apos encontro',
    segmentos: ['SEG-AMV-06', 'SEG-L2-B07', 'SEG-L2-B08', 'SEG-L2-B09'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-02', 'S-L2-04', 'S-L2-05'],
    liberarAoAutorizar: ['SEG-PA1-B02']
};

SCENARIOS.cruzamento = {
    nome: 'Cenario 1 - Encontro de trens no Patio A',
    descricao: 'T301 entra na desviada PA1 e fica aguardando. T101 passa pela Linha 2 principal em sentido contrario. Depois que a principal fica livre, T301 sai pela ponta leste do patio. Todos os movimentos reservam amarelo antes de ocupar vermelho.',
    bloqueios: [],
    posicoesIniciais: {
        T101: 'translate(1660,230)',
        T301: 'translate(820,330)'
    },
    rotas: [
        { rota: 'T301_ENTRA_DESVIADA_PATIO_A', delay: 0 },
        { rota: 'T101_PASSAGEM_OESTE_LINHA2', delay: 900 },
        { rota: 'T301_SAIDA_LESTE_APOS_ENCONTRO', delay: 21500 }
    ]
};

function aplicarPosicoesIniciaisDoCenario(scenario) {
    Object.entries(scenario.posicoesIniciais || {}).forEach(([codigoTrem, transform]) => {
        const trem = trainState[codigoTrem];
        if (!trem) return;
        trem.elemento.setAttribute('transform', transform);
    });
}

function normalizarItemRotaDoCenario(item, delayPadrao) {
    if (typeof item === 'string') return { routeName: item, delay: delayPadrao };
    return {
        routeName: item.rota || item.routeName || item.route || item.nome,
        delay: Number.isFinite(item.delay) ? item.delay : delayPadrao,
    };
}

function verificarConflitos(route) {
    const conflitos = [];

    route.segmentos.forEach(segmentId => {
        const idsFisicos = [segmentId, ...(CONFLITOS_FISICOS_V29[segmentId] || [])];

        idsFisicos.forEach(idFisico => {
            const state = segmentState[idFisico];
            const nome = TRACK_SEGMENTS[idFisico] || idFisico;

            if (!state) {
                if (idFisico === segmentId) conflitos.push(`${nome} inexistente no sinoptico`);
                return;
            }

            if (state.estado === ESTADO_SEGMENTO.INDISPONIVEL) {
                conflitos.push(`${nome} interditado`);
                return;
            }

            if (state.estado !== ESTADO_SEGMENTO.LIVRE && state.trem !== route.trem) {
                conflitos.push(`${nome} ${state.estado} por ${state.trem || 'outro trem'}`);
            }
        });
    });

    return [...new Set(conflitos)];
}

function reservarRota(route) {
    const trem = trainState[route.trem];
    if (!trem) return;

    trem.rotaAtual = route;
    trem.segmentosReservados = [...route.segmentos];
    trem.segmentosOcupados = trem.segmentosOcupados || [];

    route.segmentos.forEach(segmentId => {
        const state = segmentState[segmentId];
        if (!state || state.estado === ESTADO_SEGMENTO.INDISPONIVEL) return;

        // Ferrovia: bloco ja ocupado pelo proprio trem nao volta para amarelo.
        if (state.estado === ESTADO_SEGMENTO.OCUPADO && state.trem === route.trem) {
            pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
            return;
        }

        state.estado = ESTADO_SEGMENTO.RESERVADO;
        state.trem = route.trem;
        pintarSegmento(segmentId, ESTADO_SEGMENTO.RESERVADO);
    });

    registrarEvento(`${route.trem}: rota reservada em amarelo - ${route.nome}`);
}

function solicitarRota(routeName) {
    const rotaPrincipal = ROUTES[routeName];
    if (!rotaPrincipal) return;

    const trem = trainState[rotaPrincipal.trem];
    if (!trem || trem.emMovimento) return;

    let rotaEscolhida = clonarRota(rotaPrincipal);
    let conflitos = verificarConflitos(rotaEscolhida);

    if (conflitos.length > 0) {
        const alternativa = encontrarAlternativaLivre(routeName);
        if (alternativa) {
            registrarEvento(`${rotaPrincipal.trem}: rota principal bloqueada (${conflitos[0]}). Usando alternativa.`);
            rotaEscolhida = alternativa;
            conflitos = [];
        }
    }

    if (conflitos.length > 0) {
        bloquearTrem(rotaPrincipal.trem, rotaPrincipal.sinais, conflitos[0]);
        return;
    }

    (rotaEscolhida.liberarAoAutorizar || []).forEach(segmentId => liberarSegmento(rotaEscolhida.trem, segmentId));
    reservarRota(rotaEscolhida);
    alinharAMVs(rotaEscolhida);
    setSignals(rotaEscolhida.sinais, 'verde');
    mudarStatusTrem(rotaEscolhida.trem, 'circulando');
    registrarEvento(`${rotaEscolhida.trem}: rota autorizada - ${rotaEscolhida.nome}`);
    moverTremPorRota(rotaEscolhida);
}

function finalizarRota(route) {
    const trem = trainState[route.trem];
    if (!trem) return;

    setSignals(route.sinais, 'vermelho');
    trem.emMovimento = false;
    trem.rotaAtual = null;

    if (route.manterOcupadoAoFinal) {
        // Mantem o ultimo bloco ocupado pelo trem, simulando trem parado aguardando cruzamento.
        const manter = trem.segmentosOcupados.slice(-1);
        const todos = new Set([...route.segmentos, ...trem.segmentosReservados, ...trem.segmentosOcupados]);

        todos.forEach(segmentId => {
            if (manter.includes(segmentId)) {
                const state = segmentState[segmentId];
                if (state) {
                    state.estado = ESTADO_SEGMENTO.OCUPADO;
                    state.trem = route.trem;
                    pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
                }
            } else {
                liberarSegmento(route.trem, segmentId);
            }
        });

        trem.segmentosReservados = [];
        trem.segmentosOcupados = manter;
        mudarStatusTrem(route.trem, 'aguardando');
        registrarEvento(`${route.trem}: parado aguardando encontro em ${TRACK_SEGMENTS[manter[0]] || manter[0]}`);
        return;
    }

    const todosSegmentos = new Set([...route.segmentos, ...trem.segmentosReservados, ...trem.segmentosOcupados]);
    todosSegmentos.forEach(segmentId => liberarSegmento(route.trem, segmentId));
    trem.segmentosReservados = [];
    trem.segmentosOcupados = [];
    mudarStatusTrem(route.trem, 'aguardando');
    registrarEvento(`${route.trem}: rota concluida`);
}

function iniciarCenario(nomeCenario) {
    const scenario = SCENARIOS[nomeCenario];
    if (!scenario) return;

    aplicarConfiguracaoDoCenario(scenario);
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    aplicarPosicoesIniciaisDoCenario(scenario);
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento(scenario.descricao);

    let delayPadrao = 0;
    scenario.rotas.forEach(item => {
        const itemNormalizado = normalizarItemRotaDoCenario(item, delayPadrao);
        if (!itemNormalizado.routeName) return;

        const timer = setTimeout(() => solicitarRota(itemNormalizado.routeName), itemNormalizado.delay);
        activeTimers.push(timer);
        delayPadrao += 2200;
    });
}

// ===== Revisao v30 - painel visual de estados =====
// Atualiza os cards de estados da malha no painel lateral esquerdo.
function atualizarPainelEstados(){
    const contadores={livre:0,reservado:0,ocupado:0,indisponivel:0};
    Object.values(segmentState).forEach(state=>{
        if(!state||!state.estado)return;
        if(state.estado===ESTADO_SEGMENTO.LIVRE)contadores.livre+=1;
        else if(state.estado===ESTADO_SEGMENTO.RESERVADO)contadores.reservado+=1;
        else if(state.estado===ESTADO_SEGMENTO.OCUPADO)contadores.ocupado+=1;
        else if(state.estado===ESTADO_SEGMENTO.INDISPONIVEL)contadores.indisponivel+=1;
    });
    const livreEl=document.getElementById('state-count-free');
    const reservadoEl=document.getElementById('state-count-reserved');
    const ocupadoEl=document.getElementById('state-count-busy');
    const interditadoEl=document.getElementById('state-count-off');
    if(livreEl)livreEl.textContent=contadores.livre;
    if(reservadoEl)reservadoEl.textContent=contadores.reservado;
    if(ocupadoEl)ocupadoEl.textContent=contadores.ocupado;
    if(interditadoEl)interditadoEl.textContent=contadores.indisponivel;
}
const pintarSegmentoOriginalV30=pintarSegmento;
pintarSegmento=function(segmentId,estado){pintarSegmentoOriginalV30(segmentId,estado);atualizarPainelEstados();};
const resetarCenarioOriginalV30=resetarCenario;
resetarCenario=function(registrar=true){resetarCenarioOriginalV30(registrar);atualizarPainelEstados();};
const reservarRotaOriginalV30=reservarRota;
reservarRota=function(route){reservarRotaOriginalV30(route);atualizarPainelEstados();};
const ocuparSegmentoOriginalV30=ocuparSegmento;
ocuparSegmento=function(codigoTrem,segmentId){ocuparSegmentoOriginalV30(codigoTrem,segmentId);atualizarPainelEstados();};
const liberarSegmentoOriginalV30=liberarSegmento;
liberarSegmento=function(codigoTrem,segmentId){liberarSegmentoOriginalV30(codigoTrem,segmentId);atualizarPainelEstados();};
window.addEventListener('DOMContentLoaded',()=>{setTimeout(atualizarPainelEstados,0);});


// ===== Revisao v43 - pintar o proprio segmento e seu par fisico =====
// Sem monitor, sem overlay e sem varrer posicao. O estado vem da logica ferroviaria:
// rota reservada = amarelo, trecho ocupado por trem = vermelho.
function aplicarVisualSegmentoV43(segmentId, estado) {
    const el = document.getElementById(segmentId);
    if (!el) return;

    el.classList.remove('reserved', 'occupied', 'unavailable', 'active', 'failed');

    let cor = CCO_CORES.livre;
    let largura = '4.8';
    let filtro = 'url(#glow-green)';
    let opacidade = '1';
    let tracejado = 'none';

    if (estado === ESTADO_SEGMENTO.RESERVADO) {
        cor = CCO_CORES.reservado;
        largura = '6.3';
        filtro = 'none';
        el.classList.add('reserved');
    } else if (estado === ESTADO_SEGMENTO.OCUPADO) {
        cor = CCO_CORES.ocupado;
        largura = '7.5';
        filtro = 'url(#glow-red)';
        el.classList.add('occupied');
    } else if (estado === ESTADO_SEGMENTO.INDISPONIVEL) {
        cor = CCO_CORES.indisponivel;
        largura = '6';
        filtro = 'none';
        opacidade = '0.75';
        tracejado = '10 6';
        el.classList.add(segmentId.includes('AMV') ? 'failed' : 'unavailable');
    }

    el.style.setProperty('stroke', cor, 'important');
    el.style.setProperty('stroke-width', largura, 'important');
    el.style.setProperty('filter', filtro, 'important');
    el.style.setProperty('opacity', opacidade, 'important');
    el.style.setProperty('stroke-opacity', opacidade, 'important');
    el.style.setProperty('stroke-dasharray', tracejado, 'important');
    el.style.setProperty('stroke-linecap', 'round', 'important');
    el.style.setProperty('stroke-linejoin', 'round', 'important');
}

function idsFisicosV43(segmentId) {
    if (typeof CONFLITOS_FISICOS_V29 === 'undefined') return [segmentId];
    return [segmentId, ...(CONFLITOS_FISICOS_V29[segmentId] || [])];
}

function prioridadeEstadoV43(estado) {
    if (estado === ESTADO_SEGMENTO.OCUPADO) return 4;
    if (estado === ESTADO_SEGMENTO.RESERVADO) return 3;
    if (estado === ESTADO_SEGMENTO.INDISPONIVEL) return 2;
    return 1;
}

function estadoDominanteV43(segmentId, estadoPadrao) {
    let dominante = estadoPadrao || ESTADO_SEGMENTO.LIVRE;
    idsFisicosV43(segmentId).forEach(id => {
        const st = segmentState[id];
        if (!st || !st.estado) return;
        if (prioridadeEstadoV43(st.estado) > prioridadeEstadoV43(dominante)) dominante = st.estado;
    });
    return dominante;
}

const pintarSegmentoOriginalV43 = pintarSegmento;
pintarSegmento = function(segmentId, estado) {
    pintarSegmentoOriginalV43(segmentId, estado);
    const estadoVisual = estadoDominanteV43(segmentId, estado);
    idsFisicosV43(segmentId).forEach(id => aplicarVisualSegmentoV43(id, estadoVisual));
};

const reservarRotaOriginalV43 = reservarRota;
reservarRota = function(route) {
    reservarRotaOriginalV43(route);
    (route.segmentos || []).forEach(segmentId => pintarSegmento(segmentId, segmentState[segmentId] ? segmentState[segmentId].estado : ESTADO_SEGMENTO.RESERVADO));
};

const ocuparSegmentoOriginalV43 = ocuparSegmento;
ocuparSegmento = function(codigoTrem, segmentId) {
    ocuparSegmentoOriginalV43(codigoTrem, segmentId);
    const st = segmentState[segmentId];
    if (st) {
        st.estado = ESTADO_SEGMENTO.OCUPADO;
        st.trem = codigoTrem;
    }
    pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
};

const resetarCenarioOriginalV43 = resetarCenario;
resetarCenario = function(registrar = true) {
    resetarCenarioOriginalV43(registrar);
    Object.keys(segmentState).forEach(segmentId => pintarSegmento(segmentId, segmentState[segmentId].estado));
};

// ===== Revisao v44 - cancela movimento antigo e bloqueia rota ate decisao =====
// Corrige o caso em que uma animacao RAF ou timer de cenario antigo continua rodando
// depois que a Missao 1 abre a janela de decisao.
let tokenMovimentoV44 = 0;
window.CCO_MISSAO_AGUARDANDO_DECISAO = false;

function abortarMovimentosV44() {
    tokenMovimentoV44 += 1;
    activeTimers.forEach(timer => clearTimeout(timer));
    activeTimers = [];
    activeAnimationFrames.forEach(raf => cancelAnimationFrame(raf));
    activeAnimationFrames = [];
    Object.values(trainState).forEach(trem => {
        trem.emMovimento = false;
        trem.rotaAtual = null;
    });
}

const resetarCenarioOriginalV44 = resetarCenario;
resetarCenario = function(registrar = true) {
    abortarMovimentosV44();
    resetarCenarioOriginalV44(registrar);
    abortarMovimentosV44();
};

const solicitarRotaOriginalV44 = solicitarRota;
solicitarRota = function(routeName) {
    if (window.CCO_MISSAO_AGUARDANDO_DECISAO) {
        registrarEvento(`Rota ${routeName} bloqueada: aguardando decisao do despachante.`);
        return;
    }
    return solicitarRotaOriginalV44(routeName);
};

function moverTremPorRota(route) {
    const trem = trainState[route.trem];
    if (!trem) return;
    trem.emMovimento = true;
    const tokenDaRota = tokenMovimentoV44;
    moverTremNoSegmento(route, 0, tokenDaRota);
}

function moverTremNoSegmento(route, index, tokenDaRota = tokenMovimentoV44) {
    if (tokenDaRota !== tokenMovimentoV44) return;
    const trem = trainState[route.trem];
    if (!trem) return;

    if (index >= route.segmentos.length) {
        finalizarRota(route);
        return;
    }

    const segmentId = route.segmentos[index];
    const segmentEl = document.getElementById(segmentId);
    if (!segmentEl || typeof segmentEl.getTotalLength !== 'function') {
        registrarEvento(`Erro: segmento ${segmentId} nao suporta movimento por path`);
        finalizarRota(route);
        return;
    }

    ocuparSegmento(route.trem, segmentId);
    const length = segmentEl.getTotalLength();
    const velocidade = velocidadeOperacional(segmentId, route.trem);
    const duration = Math.max(1200, length / velocidade);
    let startTime = null;

    function step(timestamp) {
        if (tokenDaRota !== tokenMovimentoV44) return;
        if (!startTime) startTime = timestamp;
        const progress = suavizarMovimento(Math.min((timestamp - startTime) / duration, 1));
        const pos = posicaoComAngulo(segmentEl, length, progress);
        const pt = offsetNormal(pos, TRAIN_OFFSET);

        trem.elemento.setAttribute('transform', `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) rotate(${pos.angle.toFixed(2)})`);
        verificarSensores(route.trem, pos.x, pos.y);
        pintarSegmento(segmentId, ESTADO_SEGMENTO.OCUPADO);
        trazerTrensParaFrente();

        if (progress < 1) {
            const raf = requestAnimationFrame(step);
            activeAnimationFrames.push(raf);
        } else {
            moverTremNoSegmento(route, index + 1, tokenDaRota);
        }
    }

    const raf = requestAnimationFrame(step);
    activeAnimationFrames.push(raf);
}



// ===== Revisao v48 - cenarios operacionais adicionais =====
ROUTES.T201_APROXIMACAO_TERMINAL = {
    trem: 'T201',
    nome: 'T201 aproximacao controlada ao terminal pela Linha 2',
    segmentos: ['SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08'],
    sinais: ['S-L2-03','S-L2-04','S-L2-05']
};
ROUTES.T401_RECOLHIMENTO_PATIO_B = {
    trem: 'T401',
    nome: 'T401 recolhimento de composicao no Patio B',
    segmentos: ['SEG-AMV-09','SEG-PB1-B01'],
    amvs: ['SEG-AMV-09'],
    sinais: ['S-PB-01']
};
ROUTES.T101_EXPRESSO_LINHA1 = {
    trem: 'T101',
    nome: 'T101 intermodal expresso pela Linha 1',
    segmentos: ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05','SEG-L1-B06','SEG-L1-B07','SEG-L1-B08','SEG-L1-B09'],
    sinais: ['S-L1-01','S-L1-02','S-L1-03','S-L1-04','S-L1-05']
};
ROUTES.T201_CARGA_LINHA2 = {
    trem: 'T201',
    nome: 'T201 carga pesada pela Linha 2',
    segmentos: ['SEG-L2-B01','SEG-L2-B02','SEG-L2-B03','SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08','SEG-L2-B09'],
    sinais: ['S-L2-01','S-L2-02','S-L2-03','S-L2-04','S-L2-05']
};

Object.assign(SCENARIOS, {
    fila_terminal: {
        nome: 'Cenario 9 - Fila de recebimento no terminal',
        descricao: 'T401 executa recolhimento no Patio B enquanto T201 se aproxima pela Linha 2. O cenario representa regulacao de chegada e ocupacao temporaria da area de terminal.',
        bloqueios: [],
        rotas: [
            { rota: 'T401_RECOLHIMENTO_PATIO_B', delay: 0 },
            { rota: 'T201_APROXIMACAO_TERMINAL', delay: 1800 }
        ]
    },
    cruzamento_patio_b: {
        nome: 'Cenario 10 - Cruzamento e manobra no Patio B',
        descricao: 'T401 realiza manobra protegida no Patio B enquanto T101 circula pela Linha 1, mantendo independencia entre linha principal e patio.',
        bloqueios: [],
        rotas: [
            { rota: 'T401_RECOLHIMENTO_PATIO_B', delay: 0 },
            { rota: 'T101_EXPRESSO_LINHA1', delay: 900 }
        ]
    },
    circulacao_paralela: {
        nome: 'Cenario 11 - Circulacao paralela de cargas',
        descricao: 'T101 e T201 circulam simultaneamente em linhas independentes, simulando aproveitamento de capacidade da linha dupla.',
        bloqueios: [],
        rotas: [
            { rota: 'T101_EXPRESSO_LINHA1', delay: 0 },
            { rota: 'T201_CARGA_LINHA2', delay: 700 }
        ]
    },
    regulacao_pera: {
        nome: 'Cenario 12 - Regulacao pela pera operacional',
        descricao: 'T501 percorre a pera para recomposicao operacional enquanto T201 aguarda e depois avanca pela Linha 2.',
        bloqueios: [],
        rotas: [
            { rota: 'T501_PERA_COMPLETA', delay: 0 },
            { rota: 'T201_CARGA_LINHA2', delay: 7800 }
        ]
    }
});

// ===== Revisao v46 - navegacao por modos e Operacao Personalizada =====
const ROTAS_PERSONALIZADAS_V46 = {
    T101: [
        ['T101_MAIN','Linha 1 completa'],
        ['T101_INTERMODAL_LINHA1_JANELA','Linha 1 ate janela comercial'],
        ['T101_PASSAGEM_OESTE_LINHA2','Linha 2 sentido oeste'],
    ],
    T201: [
        ['T201_MAIN','Linha 2 ate B05'],
        ['T201_PASSAGEM_PATIO_A_GRAOS','Linha 2 junto ao Patio A'],
        ['T201_LINHA2_LONGA','Linha 2 completa'],
        ['T201_APROXIMACAO_TERMINAL','Aproximacao ao terminal'],
    ],
    T301: [
        ['T301_SAIDA_LESTE_APOS_ENCONTRO','Patio A para leste'],
        ['T301_SAIDA_PATIO_LIVRE','Saida livre do Patio A'],
    ],
    T302: [['T302_FALHA_AMV','Patio A via AMV-07']],
    T401: [['T401_PATIO_B_LINHA1','Manobra Patio B'],['T401_RECOLHIMENTO_PATIO_B','Recolhimento no Patio B']],
    T501: [['T501_PERA_COMPLETA','Pera operacional completa']],
};

function ativarModoV46(modo){
    document.querySelectorAll('[data-mode-tab]').forEach(tab=>{
        const ativo=tab.dataset.modeTab===modo;
        tab.classList.toggle('active',ativo);
        tab.setAttribute('aria-selected',String(ativo));
    });
    document.querySelectorAll('[data-mode-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.modePanel===modo));
}

function preencherRotasV46(indice){
    const nome=(document.getElementById(`custom-train-${indice}-name`)?.value||'').trim().toUpperCase();
    const select=document.getElementById(`custom-train-${indice}-route`);
    if(!select)return;
    const rotas=ROTAS_PERSONALIZADAS_V46[nome]||[];
    select.innerHTML=rotas.length?rotas.map(([id,label])=>`<option value="${id}">${label}</option>`).join(''):'<option value="">Trem sem rota compativel</option>';
}

function prepararRotaPersonalizadaV46(indice){
    const nome=(document.getElementById(`custom-train-${indice}-name`)?.value||'').trim().toUpperCase();
    const rotaId=document.getElementById(`custom-train-${indice}-route`)?.value;
    const fator=Number(document.getElementById(`custom-train-${indice}-speed`)?.value||1);
    const route=ROUTES[rotaId];
    if(!nome||!route)return {erro:`Trem ${indice}: informe um trem e uma rota valida.`};
    if(!trainState[nome])return {erro:`Trem ${indice}: ${nome} nao existe no sinoptico.`};
    if(route.trem!==nome)return {erro:`Trem ${indice}: a rota escolhida pertence ao ${route.trem}.`};
    return {nome,rotaId,fator};
}

function iniciarOperacaoPersonalizadaV46(){
    const mensagem=document.getElementById('custom-operation-message');
    const t1=prepararRotaPersonalizadaV46(1),t2=prepararRotaPersonalizadaV46(2);
    const erros=[t1.erro,t2.erro].filter(Boolean);
    if(erros.length){if(mensagem)mensagem.textContent=erros.join(' ');return;}
    if(t1.nome===t2.nome){if(mensagem)mensagem.textContent='Escolha dois trens diferentes.';return;}
    resetarCenario(false);
    window.CCO_MISSAO_AGUARDANDO_DECISAO=false;
    FATOR_VELOCIDADE_TREM[t1.nome]=t1.fator;
    FATOR_VELOCIDADE_TREM[t2.nome]=t2.fator;
    if(mensagem)mensagem.textContent='Operacao iniciada.';
    solicitarRota(t1.rotaId);
    const timer=setTimeout(()=>solicitarRota(t2.rotaId),600);
    activeTimers.push(timer);
}

function inicializarVisaoV46(){
    document.querySelectorAll('[data-mode-tab]').forEach(tab=>tab.addEventListener('click',()=>ativarModoV46(tab.dataset.modeTab)));
    document.getElementById('run-scenario')?.addEventListener('click',()=>{const id=document.getElementById('scenario-select')?.value;if(id)iniciarCenario(id);});
    document.getElementById('run-mission')?.addEventListener('click',()=>{const id=document.getElementById('mission-select')?.value;if(id&&typeof executarMissao==='function')executarMissao(id);});
    document.getElementById('reset-custom-operation')?.addEventListener('click',()=>{resetarCenario(true);const m=document.getElementById('custom-operation-message');if(m)m.textContent='';});
    document.getElementById('run-custom-operation')?.addEventListener('click',iniciarOperacaoPersonalizadaV46);
    [1,2].forEach(i=>{const input=document.getElementById(`custom-train-${i}-name`);input?.addEventListener('input',()=>preencherRotasV46(i));preencherRotasV46(i);});
}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',inicializarVisaoV46);else inicializarVisaoV46();


// ===== Revisao v53 - cenario de falha de AMV com contingencia =====
ROUTES.T302_SAIDA_APOS_REPARO_AMV07 = {
    trem: 'T302',
    nome: 'T302 saida do Patio A apos normalizacao do AMV-07',
    segmentos: ['SEG-AMV-07', 'SEG-L2-B04', 'SEG-L2-B05'],
    amvs: ['SEG-AMV-07'],
    sinais: ['S-PA-01', 'S-L2-03']
};

SCENARIOS.falha_amv = {
    nome: 'Cenario 4 - Falha de AMV e contingencia operacional',
    descricao: 'T302 aguarda no Patio A porque o AMV-07 perdeu confirmacao. A Linha 1 permanece disponivel para o T101. Depois da verificacao e normalizacao do aparelho, o T302 recebe autorizacao para sair do patio.',
    bloqueios: ['SEG-AMV-07'],
    posicoesIniciais: {
        T302: 'translate(680,370)',
        T101: 'translate(135,130)'
    },
    rotas: []
};

const iniciarCenarioBaseV53 = iniciarCenario;
iniciarCenario = function(nomeCenario) {
    if (nomeCenario !== 'falha_amv') return iniciarCenarioBaseV53(nomeCenario);

    const scenario = SCENARIOS.falha_amv;
    aplicarConfiguracaoDoCenario(scenario);
    resetarCenario(false);
    marcarCenarioAtivo(nomeCenario);
    aplicarPosicoesIniciaisDoCenario(scenario);

    mudarStatusTrem('T302', 'bloqueado');
    registrarEvento(`Iniciando ${scenario.nome}`);
    registrarEvento('AMV-07 sem confirmacao de posicao. Rota do T302 temporariamente bloqueada.');
    registrarEvento('T302 mantido no Patio A em condicao de espera segura.');

    const liberarLinha1 = setTimeout(() => {
        registrarEvento('Linha 1 verificada livre. T101 autorizado a circular durante a contingencia.');
        solicitarRota('T101_EXPRESSO_LINHA1');
    }, 900);
    activeTimers.push(liberarLinha1);

    const iniciarInspecao = setTimeout(() => {
        registrarEvento('Equipe de manutencao iniciou verificacao do AMV-07.');
    }, 3000);
    activeTimers.push(iniciarInspecao);

    const normalizarAmv = setTimeout(() => {
        SEGMENTOS_INDISPONIVEIS_INICIAIS.delete('SEG-AMV-07');
        const state = segmentState['SEG-AMV-07'];
        if (state) {
            state.estado = ESTADO_SEGMENTO.LIVRE;
            state.trem = null;
        }
        pintarSegmento('SEG-AMV-07', ESTADO_SEGMENTO.LIVRE);
        mudarStatusTrem('T302', 'aguardando');
        registrarEvento('AMV-07 normalizado e confirmado para circulacao.');
        registrarEvento('T302 autorizado a sair do Patio A pela Linha 2.');
        solicitarRota('T302_SAIDA_APOS_REPARO_AMV07');
    }, 7200);
    activeTimers.push(normalizarAmv);
};
