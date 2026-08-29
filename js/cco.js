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
    INDISPONIVEL: 'indisponível',
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
    T301_SAIDA_PATIO_A: { trem: 'T301', nome: 'T301 saída do Pátio A para Linha 2', segmentos: ['SEG-PA1-B01','SEG-PA1-B02','SEG-AMV-06','SEG-L2-B06','SEG-L2-B07'], amvs: ['SEG-AMV-06'], sinais: ['S-PA-01','S-PA-02','S-L2-04'] },
    T302_FALHA_AMV: { trem: 'T302', nome: 'T302 tentativa bloqueada por falha de AMV-07', segmentos: ['SEG-PA3-B01','SEG-AMV-07','SEG-L2-B04'], amvs: ['SEG-AMV-07'], sinais: ['S-PA-01'] },
    T501_PERA: { trem: 'T501', nome: 'T501 retorno pela pera operacional', segmentos: ['SEG-PERA-B01','SEG-PERA-B02','SEG-PERA-B03'], amvs: ['SEG-AMV-11','SEG-AMV-12'], sinais: ['S-PR-01','S-PR-02','S-L2-05'] },
};

const ALTERNATIVE_ROUTES = {
    T301_SAIDA_PATIO_A: [
        { nome: 'T301 alternativa: Pátio A -> AMV-06 -> L2-B07', segmentos: ['SEG-PA1-B01','SEG-PA1-B02','SEG-AMV-06','SEG-L2-B07'], amvs: ['SEG-AMV-06'], sinais: ['S-PA-01','S-PA-02','S-L2-04'] },
    ],
};

const SCENARIOS = {
    cruzamento: { nome: 'Cenário 1 - Cruzamento com Bloqueio', descricao: 'T201 ocupa L2-B07/L2-B08. T301 tenta sair do Pátio A, encontra L2-B06 interditado e a alternativa L2-B07 ocupada.', rotas: ['T201_CRUZAMENTO_BLOQUEADOR', 'T301_SAIDA_PATIO_A'] },
    ultrapassagem: { nome: 'Cenário 2 - Ultrapassagem com Pátio', descricao: 'T201 ocupa a Linha 2 enquanto T101 circula pela Linha 1.', rotas: ['T201_MAIN', 'T101_MAIN'] },
    falha_amv: { nome: 'Cenário 4 - Falha de AMV', descricao: 'T302 tenta sair do pátio, mas AMV-07 está indisponível.', rotas: ['T302_FALHA_AMV'] },
    pera: { nome: 'Cenário 6 - Retorno pela Pera', descricao: 'T501 percorre a pera operacional.', rotas: ['T501_PERA'] },
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
    registrarEvento('Simulador carregado - laboratorio de sinalizacao disponível');
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
        <strong>Controle de cenários</strong><br>
        <button class="btn-realista" data-scenario="cruzamento">Cenário 1 - Cruzamento com Bloqueio</button>
        <button class="btn-realista" data-scenario="ultrapassagem">Cenário 2 - Ultrapassagem com Pátio</button>
        <button class="btn-realista" data-scenario="falha_amv">Cenário 4 - Falha de AMV</button>
        <button class="btn-realista" data-scenario="pera">Cenário 6 - Retorno pela Pera</button>
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
            else if (texto.includes('Saída') || texto.includes('Saída')) iniciarCenario('cruzamento');
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
        registrarEvento(`Erro: segmento ${segmentId} não suporta movimento por path`);
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

    registrarEvento(`${route.trem}: rota concluída`);
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
    if (registrar) registrarEvento('Cenário resetado');
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
    if (segmentId.includes('PA') || segmentId.includes('PB')) return 'pátio';
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
    nome: 'T401 manobra no Pátio B',
    segmentos: ['SEG-PB1-B01', 'SEG-PB2-B01', 'SEG-PB3-B01', 'SEG-PB4-B01'],
    sinais: ['S-PB-01', 'S-PB-02']
};

ROUTES.T101_JANELA_MANUTENCAO = {
    trem: 'T101',
    nome: 'T101 desviado pela Linha 1 durante manutenção',
    segmentos: ['SEG-L1-B01', 'SEG-L1-B02', 'SEG-L1-B03', 'SEG-L1-B04', 'SEG-L1-B05', 'SEG-L1-B06'],
    sinais: ['S-L1-01', 'S-L1-02', 'S-L1-03', 'S-L1-04']
};

SCENARIOS.saida_patio = {
    nome: 'Cenário 3 - Saída de Pátio',
    descricao: 'T301 sai do Pátio A e solicita entrada na Linha 2.',
    rotas: ['T301_SAIDA_PATIO_A']
};

SCENARIOS.terminal = {
    nome: 'Cenário 5 - Terminal / Pátio B',
    descricao: 'T401 executa manobra no Pátio B como aproximação de terminal de carga.',
    rotas: ['T401_PATIO_B']
};

SCENARIOS.manutencao = {
    nome: 'Cenário 7 - Janela de Manutenção',
    descricao: 'T101 opera em desvio controlado enquanto outro trem encontra restrição no pátio.',
    rotas: ['T101_JANELA_MANUTENCAO', 'T302_FALHA_AMV']
};

SCENARIOS.comboio_longo = {
    nome: 'Cenário 8 - Comboio Longo',
    descricao: 'T201 simula trem cargueiro longo ocupando mais blocos durante a movimentação.',
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
    nome: 'T301 saída autorizada do Pátio A para Linha 2',
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
    nome: 'T401 manobra em linha única do Pátio B',
    segmentos: ['SEG-AMV-09','SEG-PB1-B01'],
    amvs: ['SEG-AMV-09'],
    sinais: ['S-PB-01']
};

ROUTES.T101_DESVIO_MANUTENCAO = {
    trem: 'T101',
    nome: 'T101 desvio pela Linha 1 durante manutenção da Linha 2',
    segmentos: ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05','SEG-L1-B06','SEG-L1-B07'],
    sinais: ['S-L1-01','S-L1-02','S-L1-03','S-L1-04']
};

Object.assign(SCENARIOS, {
    cruzamento: {
        nome: 'Cenário 1 - Cruzamento bloqueado por ocupacao',
        descricao: 'T201 ocupa L2-B07/L2-B08/L2-B09. T301 solicita saída do Pátio A e deve ser bloqueado por ocupacao em L2-B07.',
        rotas: ['T201_CRUZAMENTO_BLOQUEADOR', 'T301_SAIDA_PATIO_LIVRE'],
        bloqueios: []
    },
    ultrapassagem: {
        nome: 'Cenário 2 - Linha dupla / ultrapassagem operacional',
        descricao: 'T201 circula pela Linha 2 até L2-B05 enquanto T101 passa pela Linha 1. Não ha uso de trecho interditado.',
        rotas: ['T201_MAIN', 'T101_MAIN'],
        bloqueios: []
    },
    saida_patio: {
        nome: 'Cenário 3 - Saída de pátio autorizada',
        descricao: 'T301 sai do Pátio A para a Linha 2 com L2-B06 liberado. Este cenário deve concluir rota, não negar por interdição.',
        rotas: ['T301_SAIDA_PATIO_LIVRE'],
        bloqueios: []
    },
    falha_amv: {
        nome: 'Cenário 4 - Falha de AMV na saída do pátio',
        descricao: 'T302 tenta usar AMV-07 indisponível. A rota deve ser negada por falha de AMV.',
        rotas: ['T302_FALHA_AMV'],
        bloqueios: ['SEG-AMV-07']
    },
    pera: {
        nome: 'Cenário 5 - Retorno pela pera operacional',
        descricao: 'T501 percorre entrada, curva de pera e saída operacional pela pera.',
        rotas: ['T501_PERA_COMPLETA'],
        bloqueios: []
    },
    terminal: {
        nome: 'Cenário 6 - Manobra coerente no Pátio B',
        descricao: 'T401 acessa uma linha do Pátio B por AMV-09 e permanece em uma linha de pátio, sem pular entre vias paralelas.',
        rotas: ['T401_PATIO_B_LINHA1'],
        bloqueios: []
    },
    manutencao: {
        nome: 'Cenário 7 - Janela de manutenção na Linha 2',
        descricao: 'L2-B06 fica interditado por manutenção. T101 circula pela Linha 1 como desvio operacional.',
        rotas: ['T101_DESVIO_MANUTENCAO'],
        bloqueios: ['SEG-L2-B06']
    },
    comboio_longo: {
        nome: 'Cenário 8 - Comboio longo na Linha 2',
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
    if (registrar) registrarEvento('Cenário resetado');
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
    nome: 'T201 solicitando entrada no Pátio A para cruzamento',
    segmentos: ['SEG-L2-B06', 'SEG-AMV-06', 'SEG-PA1-B02', 'SEG-PA1-B01'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-L2-04', 'S-PA-02', 'S-PA-01']
};

ROUTES.T301_PARADO_PATIO_A = {
    trem: 'T301',
    nome: 'T301 parado na via de cruzamento do Pátio A',
    segmentos: ['SEG-PA1-B01', 'SEG-PA1-B02'],
    sinais: ['S-PA-01', 'S-PA-02']
};

SCENARIOS.cruzamento = {
    nome: 'Cenário 1 - Cruzamento bloqueado no Pátio A',
    descricao: 'T301 está parado ocupando PA1-B01/PA1-B02. T201 solicita entrada no Pátio A para cruzamento e a rota deve ser negada porque a via de cruzamento está ocupada.',
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

        registrarEvento(`${ocupacao.trem}: ocupando via de cruzamento do Pátio A`);
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
    nome: 'T201 passagem pela Linha 2 junto ao Pátio A',
    segmentos: ['SEG-L2-B05', 'SEG-L2-B06', 'SEG-L2-B07', 'SEG-L2-B08', 'SEG-L2-B09'],
    sinais: ['S-L2-03', 'S-L2-04', 'S-L2-05']
};

ROUTES.T301_SAIDA_APOS_CRUZAMENTO = {
    trem: 'T301',
    nome: 'T301 saída do Pátio A após cruzamento',
    segmentos: ['SEG-PA1-B01', 'SEG-PA1-B02', 'SEG-AMV-06', 'SEG-L2-B06', 'SEG-L2-B07'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-01', 'S-PA-02', 'S-L2-04']
};

SCENARIOS.cruzamento = {
    nome: 'Cenário 1 - Cruzamento operacional no Pátio A',
    descricao: 'T301 aguarda no Pátio A enquanto T201 passa pela Linha 2. Após a passagem, T301 sai do pátio para a Linha 2. Este cenário representa um cruzamento operacional realista, não um bloqueio artificial.',
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

        registrarEvento(`${ocupacao.trem}: aguardando no Pátio A para cruzamento`);
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
    nome: 'T101 principal sentido oeste pelo Pátio A',
    segmentos: ['SEG-L2-B09-R', 'SEG-L2-B08-R', 'SEG-L2-B07-R', 'SEG-L2-B06-R', 'SEG-L2-B05-R', 'SEG-L2-B04-R'],
    sinais: ['S-L2-05', 'S-L2-04', 'S-L2-03']
};

ROUTES.T301_DESVIADA_PATIO_A_CRUZAMENTO = {
    trem: 'T301',
    nome: 'T301 desviada do Pátio A aguardando cruzamento',
    segmentos: ['SEG-PA1-B02'],
    sinais: ['S-PA-01', 'S-PA-02']
};

ROUTES.T301_SAIDA_PATIO_A_LESTE_POS_CRUZAMENTO = {
    trem: 'T301',
    nome: 'T301 saída leste do Pátio A após cruzamento',
    segmentos: ['SEG-AMV-06', 'SEG-L2-B07', 'SEG-L2-B08', 'SEG-L2-B09'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-02', 'S-L2-04', 'S-L2-05']
};

SCENARIOS.cruzamento = {
    nome: 'Cenário 1 - Cruzamento real no Pátio A',
    descricao: 'T301 ocupa a via desviada PA1 do Pátio A e avanca lentamente pela desviada. T101 passa em sentido contrário pela Linha 2. Depois que T101 libera a principal, T301 sai pela ponta leste do pátio para L2-B07/L2-B08/L2-B09.',
    bloqueios: [],
    posicoesIniciais: {
        T101: 'translate(1660,300)',
        T301: 'translate(800,390)'
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
    nome: 'T301 saída leste da desviada após encontro',
    segmentos: ['SEG-AMV-06', 'SEG-L2-B07', 'SEG-L2-B08', 'SEG-L2-B09'],
    amvs: ['SEG-AMV-06'],
    sinais: ['S-PA-02', 'S-L2-04', 'S-L2-05'],
    liberarAoAutorizar: ['SEG-PA1-B02']
};

SCENARIOS.cruzamento = {
    nome: 'Cenário 1 - Encontro de trens no Pátio A',
    descricao: 'T301 entra na desviada PA1 e fica aguardando. T101 passa pela Linha 2 principal em sentido contrário. Depois que a principal fica livre, T301 sai pela ponta leste do pátio. Todos os movimentos reservam amarelo antes de ocupar vermelho.',
    bloqueios: [],
    posicoesIniciais: {
        T101: 'translate(1660,300)',
        T301: 'translate(800,390)'
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
    registrarEvento(`${route.trem}: rota concluída`);
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
        registrarEvento(`Rota ${routeName} bloqueada: aguardando decisão do despachante.`);
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
        registrarEvento(`Erro: segmento ${segmentId} não suporta movimento por path`);
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
    nome: 'T201 aproximação controlada ao terminal pela Linha 2',
    segmentos: ['SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08'],
    sinais: ['S-L2-03','S-L2-04','S-L2-05']
};
ROUTES.T401_RECOLHIMENTO_PATIO_B = {
    trem: 'T401',
    nome: 'T401 recolhimento de composição no Pátio B',
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
        nome: 'Cenário 9 - Fila de recebimento no terminal',
        descricao: 'T401 executa recolhimento no Pátio B enquanto T201 se aproxima pela Linha 2. O cenário representa regulação de chegada e ocupacao temporaria da área de terminal.',
        bloqueios: [],
        rotas: [
            { rota: 'T401_RECOLHIMENTO_PATIO_B', delay: 0 },
            { rota: 'T201_APROXIMACAO_TERMINAL', delay: 1800 }
        ]
    },
    cruzamento_patio_b: {
        nome: 'Cenário 10 - Cruzamento e manobra no Pátio B',
        descricao: 'T401 realiza manobra protegida no Pátio B enquanto T101 circula pela Linha 1, mantendo independência entre linha principal e pátio.',
        bloqueios: [],
        rotas: [
            { rota: 'T401_RECOLHIMENTO_PATIO_B', delay: 0 },
            { rota: 'T101_EXPRESSO_LINHA1', delay: 900 }
        ]
    },
    circulacao_paralela: {
        nome: 'Cenário 11 - Circulação paralela de cargas',
        descricao: 'T101 e T201 circulam simultaneamente em linhas independentes, simulando aproveitamento de capacidade da linha dupla.',
        bloqueios: [],
        rotas: [
            { rota: 'T101_EXPRESSO_LINHA1', delay: 0 },
            { rota: 'T201_CARGA_LINHA2', delay: 700 }
        ]
    },
    regulacao_pera: {
        nome: 'Cenário 12 - Regulação pela pera operacional',
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
        ['T101_INTERMODAL_LINHA1_JANELA','Linha 1 até janela comercial'],
        ['T101_PASSAGEM_OESTE_LINHA2','Linha 2 sentido oeste'],
    ],
    T201: [
        ['T201_MAIN','Linha 2 até B05'],
        ['T201_PASSAGEM_PATIO_A_GRAOS','Linha 2 junto ao Pátio A'],
        ['T201_LINHA2_LONGA','Linha 2 completa'],
        ['T201_APROXIMACAO_TERMINAL','Aproximação ao terminal'],
    ],
    T301: [
        ['T301_SAIDA_LESTE_APOS_ENCONTRO','Pátio A para leste'],
        ['T301_SAIDA_PATIO_LIVRE','Saída livre do Pátio A'],
    ],
    T302: [['T302_FALHA_AMV','Pátio A via AMV-07']],
    T401: [['T401_PATIO_B_LINHA1','Manobra Pátio B'],['T401_RECOLHIMENTO_PATIO_B','Recolhimento no Pátio B']],
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
    if(!nome||!route)return {erro:`Trem ${indice}: informe um trem e uma rota válida.`};
    if(!trainState[nome])return {erro:`Trem ${indice}: ${nome} não existe no sinoptico.`};
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
    if(mensagem)mensagem.textContent='Operação iniciada.';
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
    nome: 'T302 saída do Pátio A após normalizacao do AMV-07',
    segmentos: ['SEG-AMV-07', 'SEG-L2-B04', 'SEG-L2-B05'],
    amvs: ['SEG-AMV-07'],
    sinais: ['S-PA-01', 'S-L2-03']
};

SCENARIOS.falha_amv = {
    nome: 'Cenário 4 - Falha de AMV e contingência operacional',
    descricao: 'T302 aguarda no Pátio A porque o AMV-07 perdeu confirmação. A Linha 1 permanece disponível para o T101. Depois da verificacao e normalizacao do aparelho, o T302 recebe autorização para sair do pátio.',
    bloqueios: ['SEG-AMV-07'],
    posicoesIniciais: {
        T302: 'translate(750,490)',
        T101: 'translate(135,180)'
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
    registrarEvento('AMV-07 sem confirmação de posição. Rota do T302 temporariamente bloqueada.');
    registrarEvento('T302 mantido no Pátio A em condicao de espera segura.');

    const liberarLinha1 = setTimeout(() => {
        registrarEvento('Linha 1 verificada livre. T101 autorizado a circular durante a contingência.');
        solicitarRota('T101_EXPRESSO_LINHA1');
    }, 900);
    activeTimers.push(liberarLinha1);

    const iniciarInspecao = setTimeout(() => {
        registrarEvento('Equipe de manutenção iniciou verificacao do AMV-07.');
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
        registrarEvento('AMV-07 normalizado e confirmado para circulação.');
        registrarEvento('T302 autorizado a sair do Pátio A pela Linha 2.');
        solicitarRota('T302_SAIDA_APOS_REPARO_AMV07');
    }, 7200);
    activeTimers.push(normalizarAmv);
};


// ===== Revisao v57 - cenarios adicionais de estudo =====
ROUTES.T201_LINHA2_OPERACIONAL = {
    trem: 'T201',
    nome: 'T201 circulação integral pela Linha 2',
    segmentos: ['SEG-L2-B01','SEG-L2-B02','SEG-L2-B03','SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08','SEG-L2-B09'],
    sinais: ['S-L2-01','S-L2-02','S-L2-03','S-L2-04','S-L2-05']
};

ROUTES.T101_LINHA1_OPERACIONAL = {
    trem: 'T101',
    nome: 'T101 circulação integral pela Linha 1',
    segmentos: ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05','SEG-L1-B06','SEG-L1-B07','SEG-L1-B08','SEG-L1-B09'],
    sinais: ['S-L1-01','S-L1-02','S-L1-03','S-L1-04','S-L1-05']
};

ROUTES.T301_ESTACIONAMENTO_PATIO_A = {
    trem: 'T301',
    nome: 'T301 posicionamento na via desviada do Pátio A',
    segmentos: ['SEG-PA1-B01','SEG-PA1-B02'],
    sinais: ['S-PA-01','S-PA-02'],
    manterOcupadoAoFinal: true
};

Object.assign(SCENARIOS, {
    linha1_interditada: {
        nome: 'Cenário 13 - Linha 1 interditada e circulação pela Linha 2',
        descricao: 'Uma inspeção programada interdita L1-B05. A Linha 1 permanece protegida enquanto T201 utiliza a Linha 2, que continua disponível para a circulação.',
        bloqueios: ['SEG-L1-B05'],
        posicoesIniciais: { T201: 'translate(135,300)' },
        rotas: [{ rota: 'T201_LINHA2_OPERACIONAL', delay: 900 }]
    },
    linha2_interditada: {
        nome: 'Cenário 14 - Linha 2 interditada e circulação pela Linha 1',
        descricao: 'Uma restrição em L2-B06 impede a utilizacao da Linha 2. T101 segue pela Linha 1 sem compartilhar o trecho indisponível.',
        bloqueios: ['SEG-L2-B06'],
        posicoesIniciais: { T101: 'translate(135,180)' },
        rotas: [{ rota: 'T101_LINHA1_OPERACIONAL', delay: 900 }]
    },
    estacionamento_patio_a: {
        nome: 'Cenário 15 - Estacionamento técnico no Pátio A',
        descricao: 'T301 e posicionado na via desviada PA1 e permanece ocupando o último bloco ao final do movimento, representando uma composição estacionada e protegida no pátio.',
        bloqueios: [],
        posicoesIniciais: { T301: 'translate(535,390)' },
        rotas: [{ rota: 'T301_ESTACIONAMENTO_PATIO_A', delay: 700 }]
    },
    prioridade_principal: {
        nome: 'Cenário 16 - Prioridade da linha principal no Pátio A',
        descricao: 'T301 aguarda na via desviada do Pátio A enquanto T201 passa pela Linha 2. Depois da liberação da principal, T301 recebe autorização para sair pela ponta leste.',
        bloqueios: [],
        posicoesIniciais: { T301: 'translate(800,390)', T201: 'translate(810,300)' },
        ocupacoesIniciais: [{ trem: 'T301', segmentos: ['SEG-PA1-B02'], status: 'aguardando' }],
        rotas: [
            { rota: 'T201_PASSAGEM_CRUZAMENTO_PATIO_A', delay: 800 },
            { rota: 'T301_SAIDA_LESTE_APOS_ENCONTRO', delay: 19000 }
        ]
    },
    manobra_com_passagem: {
        nome: 'Cenário 17 - Manobra no Pátio B com passagem na principal',
        descricao: 'T401 realiza uma movimentação curta na primeira via do Pátio B enquanto T101 circula pela Linha 1. O cenário mostra movimentos independentes em áreas distintas da malha.',
        bloqueios: [],
        posicoesIniciais: { T401: 'translate(1400,390)', T101: 'translate(135,180)' },
        rotas: [
            { rota: 'T401_PATIO_B_LINHA1', delay: 500 },
            { rota: 'T101_LINHA1_OPERACIONAL', delay: 1200 }
        ]
    }
});


// ===== Revisao v59 - laboratorio conceitual de sinalizacao =====
// As demonstracoes abaixo sao simplificadas e servem apenas para estudo visual.
Object.assign(SCENARIOS, {
    conflito_rotas: {
        nome: 'Cenário 18 - Conflito entre rotas',
        descricao: 'Duas solicitacoes compartilham a mesma zona da Linha 2. A primeira rota e protegida e a segunda deve permanecer sem autorização.',
        bloqueios: [], rotas: []
    },
    bloco_ocupado: {
        nome: 'Cenário 19 - Bloco ocupado impede autorização',
        descricao: 'Um bloco da Linha 2 e apresentado como ocupado. A tentativa de estabelecer uma rota que utiliza esse bloco deve ser negada.',
        bloqueios: [], rotas: []
    },
    travamento_aproximacao: {
        nome: 'Cenário 20 - Travamento de aproximação',
        descricao: 'Depois da autorização e com o trem em aproximação, uma tentativa de cancelar imediatamente a rota e recusada na demonstracao.',
        bloqueios: [], rotas: []
    },
    liberacao_sequencial: {
        nome: 'Cenário 21 - Liberação sequencial da rota',
        descricao: 'A rota e reservada em amarelo. Conforme o trem avanca, o bloco atual fica vermelho e os blocos anteriores retornam ao estado livre.',
        bloqueios: [], rotas: []
    },
    falha_deteccao_via: {
        nome: 'Cenário 22 - Falha na detecção de via',
        descricao: 'Uma falha de detecção leva o trecho a uma condicao restritiva. O sinal permanece fechado e a rota que depende do trecho não e autorizada.',
        bloqueios: [], rotas: []
    },
    perda_deteccao_amv: {
        nome: 'Cenário 23 - Perda de detecção do AMV',
        descricao: 'O AMV-09 perde confirmação de posição. A manobra do T401 permanece bloqueada até a indicacao ser restabelecida.',
        bloqueios: [], rotas: []
    },
    protecao_sobreposicao: {
        nome: 'Cenário 24 - Proteção além do sinal',
        descricao: 'A demonstracao destaca uma secao adicional de proteção além do ponto de parada, mantendo uma rota conflitante sem autorização.',
        bloqueios: [], rotas: []
    }
});

function definirEstadoDidaticoV59(segmentId, estado, trem = null) {
    const state = segmentState[segmentId];
    if (!state) return;
    state.estado = estado;
    state.trem = trem;
    pintarSegmento(segmentId, estado);
}

function prepararDemonstracaoV59(nome, descricao) {
    aplicarConfiguracaoDoCenario({ bloqueios: [] });
    resetarCenario(false);
    marcarCenarioAtivo(nome);
    registrarEvento(`Iniciando ${descricao}`);
    registrarEvento('Demonstracao conceitual: comportamento simplificado para estudo, sem representar procedimento operacional oficial.');
}

const iniciarCenarioBaseV59 = iniciarCenario;
iniciarCenario = function(nomeCenario) {
    const especiais = new Set([
        'conflito_rotas','bloco_ocupado','travamento_aproximacao',
        'liberacao_sequencial','falha_deteccao_via','perda_deteccao_amv',
        'protecao_sobreposicao'
    ]);
    if (!especiais.has(nomeCenario)) return iniciarCenarioBaseV59(nomeCenario);

    const scenario = SCENARIOS[nomeCenario];
    prepararDemonstracaoV59(nomeCenario, scenario.nome);
    registrarEvento(scenario.descricao);

    if (nomeCenario === 'conflito_rotas') {
        aplicarPosicoesIniciaisDoCenario({ T201:'translate(810,300)', T301:'translate(800,390)' });
        definirEstadoDidaticoV59('SEG-PA1-B02', ESTADO_SEGMENTO.OCUPADO, 'T301');
        trainState.T301.segmentosOcupados = ['SEG-PA1-B02'];
        registrarEvento('Rota de T201 estabelecida pela Linha 2 na zona do Pátio A.');
        solicitarRota('T201_PASSAGEM_CRUZAMENTO_PATIO_A');
        const t=setTimeout(()=>{
            registrarEvento('T301 solicita a saída pela mesma zona protegida.');
            solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
        },1200); activeTimers.push(t);
        return;
    }

    if (nomeCenario === 'bloco_ocupado') {
        aplicarPosicoesIniciaisDoCenario({ T201:'translate(630,300)', T301:'translate(1080,300)' });
        definirEstadoDidaticoV59('SEG-L2-B06', ESTADO_SEGMENTO.OCUPADO, 'T301');
        registrarEvento('Detecção informa L2-B06 ocupado. S-L2-04 permanece fechado.');
        setSignalVisual('S-L2-04','vermelho');
        const t=setTimeout(()=>solicitarRota('T201_LINHA2_OPERACIONAL'),1000); activeTimers.push(t);
        return;
    }

    if (nomeCenario === 'travamento_aproximacao') {
        aplicarPosicoesIniciaisDoCenario({ T101:'translate(135,180)' });
        solicitarRota('T101_LINHA1_OPERACIONAL');
        const t=setTimeout(()=>{
            registrarEvento('Solicitado cancelamento imediato com T101 em aproximação.');
            registrarEvento('Cancelamento recusado nesta demonstracao: rota continua protegida até a passagem e liberação.');
        },1800); activeTimers.push(t);
        return;
    }

    if (nomeCenario === 'liberacao_sequencial') {
        aplicarPosicoesIniciaisDoCenario({ T201:'translate(135,300)' });
        registrarEvento('Observe a sequência amarelo, vermelho e verde em cada bloco.');
        solicitarRota('T201_LINHA2_OPERACIONAL');
        return;
    }

    if (nomeCenario === 'falha_deteccao_via') {
        definirEstadoDidaticoV59('SEG-L1-B05', ESTADO_SEGMENTO.INDISPONIVEL, null);
        setSignalVisual('S-L1-03','vermelho');
        aplicarPosicoesIniciaisDoCenario({ T101:'translate(135,180)' });
        registrarEvento('L1-B05 sem confirmação confiavel de via livre. Estado restritivo aplicado.');
        const t=setTimeout(()=>solicitarRota('T101_LINHA1_OPERACIONAL'),1000); activeTimers.push(t);
        return;
    }

    if (nomeCenario === 'perda_deteccao_amv') {
        definirEstadoDidaticoV59('SEG-AMV-09', ESTADO_SEGMENTO.INDISPONIVEL, null);
        setSignalVisual('S-PB-01','vermelho');
        aplicarPosicoesIniciaisDoCenario({ T401:'translate(1400,390)' });
        registrarEvento('AMV-09 sem confirmação de posição. S-PB-01 permanece fechado.');
        const t1=setTimeout(()=>solicitarRota('T401_PATIO_B_LINHA1'),1000); activeTimers.push(t1);
        const t2=setTimeout(()=>{
            definirEstadoDidaticoV59('SEG-AMV-09', ESTADO_SEGMENTO.LIVRE, null);
            registrarEvento('Indicacao do AMV-09 restabelecida. Nova solicitacao de rota permitida.');
            solicitarRota('T401_PATIO_B_LINHA1');
        },6500); activeTimers.push(t2);
        return;
    }

    if (nomeCenario === 'protecao_sobreposicao') {
        aplicarPosicoesIniciaisDoCenario({ T201:'translate(990,300)', T301:'translate(800,390)' });
        ['SEG-L2-B06','SEG-L2-B07'].forEach(id=>definirEstadoDidaticoV59(id,ESTADO_SEGMENTO.RESERVADO,'T201'));
        setSignalVisual('S-L2-04','verde');
        registrarEvento('L2-B06 reservado para o movimento; L2-B07 destacado como secao adicional de proteção.');
        registrarEvento('T301 solicita uma rota que utiliza a área protegida.');
        const t=setTimeout(()=>solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO'),1200); activeTimers.push(t);
    }
};


// ===== Revisão v64 - zoom e navegação do mapa =====
function inicializarZoomMapaV64() {
    const svg = document.getElementById('cco-realista-svg');
    const viewport = document.getElementById('synoptic-viewport');
    if (!svg || !viewport || svg.dataset.zoomInstalado === 'true') return;
    svg.dataset.zoomInstalado = 'true';

    const original = { x: 0, y: 0, width: 1800, height: 820 };
    const estado = { ...original, minimo: 0.35, maximo: 4, arrastando: false, ultimoX: 0, ultimoY: 0 };
    const nivel = document.getElementById('map-zoom-level');

    function escalaAtual() {
        return original.width / estado.width;
    }

    function limitarViewBox() {
        estado.width = Math.max(original.width / estado.maximo, Math.min(original.width / estado.minimo, estado.width));
        estado.height = estado.width * original.height / original.width;
        const margemX = original.width * 0.25;
        const margemY = original.height * 0.25;
        estado.x = Math.max(-margemX, Math.min(original.width + margemX - estado.width, estado.x));
        estado.y = Math.max(-margemY, Math.min(original.height + margemY - estado.height, estado.y));
    }

    function aplicarViewBox() {
        limitarViewBox();
        svg.setAttribute('viewBox', `${estado.x} ${estado.y} ${estado.width} ${estado.height}`);
        if (nivel) nivel.textContent = `${Math.round(escalaAtual() * 100)}%`;
    }

    function zoom(fator, centroTelaX = viewport.clientWidth / 2, centroTelaY = viewport.clientHeight / 2) {
        const rect = viewport.getBoundingClientRect();
        const px = Math.max(0, Math.min(rect.width, centroTelaX));
        const py = Math.max(0, Math.min(rect.height, centroTelaY));
        const pontoX = estado.x + (px / rect.width) * estado.width;
        const pontoY = estado.y + (py / rect.height) * estado.height;
        const novaLargura = estado.width / fator;
        const novaAltura = estado.height / fator;
        estado.x = pontoX - (px / rect.width) * novaLargura;
        estado.y = pontoY - (py / rect.height) * novaAltura;
        estado.width = novaLargura;
        estado.height = novaAltura;
        aplicarViewBox();
    }

    function resetarZoom() {
        Object.assign(estado, original);
        aplicarViewBox();
    }

    document.getElementById('map-zoom-in')?.addEventListener('click', () => zoom(1.25));
    document.getElementById('map-zoom-out')?.addEventListener('click', () => zoom(0.8));
    document.getElementById('map-zoom-reset')?.addEventListener('click', resetarZoom);
    document.getElementById('map-fullscreen')?.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement) await viewport.requestFullscreen();
            else await document.exitFullscreen();
        } catch (erro) {
            registrarEvento('Não foi possível abrir o mapa em tela cheia neste navegador.');
        }
    });

    viewport.addEventListener('wheel', event => {
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        zoom(event.deltaY < 0 ? 1.15 : 0.87, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });

    viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        estado.arrastando = true;
        estado.ultimoX = event.clientX;
        estado.ultimoY = event.clientY;
        viewport.classList.add('is-panning');
        viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener('pointermove', event => {
        if (!estado.arrastando) return;
        const dx = event.clientX - estado.ultimoX;
        const dy = event.clientY - estado.ultimoY;
        estado.ultimoX = event.clientX;
        estado.ultimoY = event.clientY;
        estado.x -= dx * estado.width / viewport.clientWidth;
        estado.y -= dy * estado.height / viewport.clientHeight;
        aplicarViewBox();
    });

    function encerrarArraste(event) {
        estado.arrastando = false;
        viewport.classList.remove('is-panning');
        if (event?.pointerId !== undefined && viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    }
    viewport.addEventListener('pointerup', encerrarArraste);
    viewport.addEventListener('pointercancel', encerrarArraste);
    viewport.addEventListener('dblclick', event => {
        const rect = viewport.getBoundingClientRect();
        zoom(1.4, event.clientX - rect.left, event.clientY - rect.top);
    });

    aplicarViewBox();
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', inicializarZoomMapaV64);
else inicializarZoomMapaV64();
