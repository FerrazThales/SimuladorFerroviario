
// Modo Decisão - CCO Ferroviario de Carga - v48
// Este arquivo nao dispara rota antes da escolha do usuario.
'use strict';

ROUTES.T201_PASSAGEM_PATIO_A_GRAOS = {
    trem: 'T201',
    nome: 'T201 comboio de grãos pela principal junto ao Pátio A',
    segmentos: ['SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08','SEG-L2-B09'],
    sinais: ['S-L2-03','S-L2-04','S-L2-05'],
};

ROUTES.T101_INTERMODAL_LINHA1_JANELA = {
    trem: 'T101',
    nome: 'T101 intermodal em janela comercial pela Linha 1',
    segmentos: ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05','SEG-L1-B06','SEG-L1-B07'],
    sinais: ['S-L1-01','S-L1-02','S-L1-03','S-L1-04'],
};

const MISSOES = {
    cruzamento_decisao: {
        nome: 'Missão 1 - Encontro operacional no Pátio A',
        descricao: 'T301 está parado na desviada PA1. T201 aguarda autorização para seguir pela Linha 2 principal. Nenhum trem sera movimentado antes da sua decisão.',
        posicoesIniciais: {
            T201: 'translate(720,300)',
            T301: 'translate(635,350)',
            T101: 'translate(135,180)',
            T401: 'translate(1280,520)',
        },
        ocupacoesIniciais: [
            { trem: 'T301', segmentos: ['SEG-PA1-B01','SEG-PA1-B02'], status: 'aguardando' },
            { trem: 'T201', segmentos: ['SEG-L2-B04'], status: 'aguardando' },
        ],
        passos: [
            {
                tipo: 'decisao',
                titulo: 'Cruzamento de comboio carregado com manobra vazia',
                contexto: 'T301 ocupa a desviada PA1 no Pátio A. T201 está parado aguardando autorização para seguir pela Linha 2 principal. Qual sequência operacional você autoriza?',
                opcoes: [
                    {
                        id: 'seguro',
                        titulo: 'Manter T301 retido e liberar T201 pela principal',
                        descricao: 'Autoriza o comboio carregado pela principal e só depois libera a composição vazia.',
                        risco: 'seguro',
                        efeito: async () => {
                            registrarEvento('CCO: decisão tomada. Autorizando T201 pela Linha 2 principal.');
                            solicitarRota('T201_PASSAGEM_PATIO_A_GRAOS');
                            await esperarTremPararV45('T201');
                            registrarEvento('CCO: T201 liberou a principal. Autorizando saída de T301.');
                            solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
                            await esperarTremPararV45('T301');
                        },
                    },
                    {
                        id: 'moderado',
                        titulo: 'Liberar T201 e adiantar T101 na Linha 1',
                        descricao: 'Usa a Linha 1 em paralelo para preservar janela comercial, mantendo T301 retido até a principal ficar livre.',
                        risco: 'moderado',
                        efeito: async () => {
                            registrarEvento('CCO: autorizando T201 pela Linha 2 e T101 pela Linha 1.');
                            solicitarRota('T201_PASSAGEM_PATIO_A_GRAOS');
                            await esperar(1400);
                            solicitarRota('T101_INTERMODAL_LINHA1_JANELA');
                            await esperarTremPararV45('T201');
                            await esperarTremPararV45('T101');
                            registrarEvento('CCO: principal conferida livre. Autorizando T301.');
                            solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
                            await esperarTremPararV45('T301');
                        },
                    },
                    {
                        id: 'arriscado',
                        titulo: 'Antecipar saída de T301 antes do comboio carregado',
                        descricao: 'Tenta ganhar tempo, mas pode conflitar com a passagem do comboio prioritario.',
                        risco: 'arriscado',
                        efeito: async () => {
                            registrarEvento('ALERTA: tentativa de antecipar T301 antes de T201.');
                            solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
                            await esperarTremPararV45('T301');
                            solicitarRota('T201_PASSAGEM_PATIO_A_GRAOS');
                            await esperarTremPararV45('T201');
                        },
                    },
                ],
            },
            { tipo: 'espera', ms: 1200 },
            {
                tipo: 'decisao',
                titulo: 'Alerta operacional no comboio pesado',
                contexto: 'Durante a circulação planejada, aparece um alerta de sensor. Como você conduz a operação?',
                opcoes: [
                    { id: 'seguro', titulo: 'Reduzir velocidade e programar inspeção', descricao: 'Prioriza segurança e rastreabilidade.', risco: 'seguro', efeito: () => registrarEvento('CCO: velocidade restrita e inspeção programada.') },
                    { id: 'moderado', titulo: 'Seguir com monitoramento reforcado', descricao: 'Mantem fluidez com acompanhamento do CCO.', risco: 'moderado', efeito: () => registrarEvento('CCO: monitoramento reforcado mantido.') },
                    { id: 'arriscado', titulo: 'Ignorar alerta para cumprir janela', descricao: 'Prioriza janela, mas eleva risco operacional.', risco: 'arriscado', efeito: () => registrarEvento('ALERTA: alerta técnico ignorado.') },
                ],
            },
        ],
    },
    prioridade_exportacao: {
        nome: 'Missão 2 - Prioridade de exportação',
        descricao: 'Dois trens solicitam faixa simultânea. O despachante deve equilibrar janela comercial, peso do comboio e capacidade da linha dupla.',
        posicoesIniciais: { T101:'translate(135,180)', T201:'translate(135,300)' },
        ocupacoesIniciais: [],
        passos: [{
            tipo:'decisao',
            titulo:'Definição de prioridade no corredor',
            contexto:'T201 transporta carga de exportação com janela de terminal. T101 e intermodal e também possui compromisso comercial. As linhas 1 e 2 estao livres. Qual plano deve ser autorizado?',
            opcoes:[
                { id:'seguro', titulo:'Liberar os dois em linhas independentes', descricao:'Usa a capacidade da linha dupla e acompanha ambos os movimentos.', risco:'seguro', efeito:async()=>{ solicitarRota('T201_CARGA_LINHA2'); await esperar(800); solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T201'); await esperarTremPararV45('T101'); } },
                { id:'moderado', titulo:'Priorizar T201 e reter T101', descricao:'Garante a janela de exportação, mas reduz o aproveitamento da linha dupla.', risco:'moderado', efeito:async()=>{ solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T101'); } },
                { id:'arriscado', titulo:'Liberar T101 e atrasar o comboio carregado', descricao:'Preserva o intermodal, mas arrisca a janela do terminal.', risco:'arriscado', efeito:async()=>{ solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T101'); solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); } }
            ]
        }]
    },
    falha_amv_decisao: {
        nome:'Missão 3 - Falha de AMV e contingência',
        descricao:'Uma falha de AMV exige proteção da área, replanejamento e escolha de rota segura.',
        posicoesIniciais:{ T302:'translate(750,490)', T101:'translate(135,180)' },
        ocupacoesIniciais:[],
        passos:[{
            tipo:'decisao', titulo:'AMV-07 sem confirmação de posição',
            contexto:'T302 solicita saída do pátio, mas o AMV-07 perdeu confirmação. T101 pode circular pela Linha 1. Qual acao deve ser tomada?',
            opcoes:[
                { id:'seguro', titulo:'Bloquear T302 e liberar T101 pela Linha 1', descricao:'Mantem a área da falha protegida e preserva circulação independente.', risco:'seguro', efeito:async()=>{ SEGMENTOS_INDISPONIVEIS_INICIAIS.add('SEG-AMV-07'); pintarSegmento('SEG-AMV-07',ESTADO_SEGMENTO.INDISPONIVEL); solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T101'); } },
                { id:'moderado', titulo:'Aguardar verificacao local antes de qualquer movimento', descricao:'Suspende a operação até confirmação de campo.', risco:'moderado', efeito:async()=>{ registrarEvento('CCO: equipe local acionada para verificar AMV-07.'); await esperar(2200); } },
                { id:'arriscado', titulo:'Tentar autorizar T302 mesmo sem confirmação', descricao:'A rota deve ser negada pela indisponibilidade do aparelho.', risco:'arriscado', efeito:async()=>{ SEGMENTOS_INDISPONIVEIS_INICIAIS.add('SEG-AMV-07'); const st=segmentState['SEG-AMV-07']; if(st){st.estado=ESTADO_SEGMENTO.INDISPONIVEL;st.trem=null;} pintarSegmento('SEG-AMV-07',ESTADO_SEGMENTO.INDISPONIVEL); solicitarRota('T302_FALHA_AMV'); await esperar(1200); } }
            ]
        }]
    },
    janela_manutencao_decisao: {
        nome:'Missão 4 - Janela de manutenção',
        descricao:'A manutenção precisa interditar um bloco sem interromper toda a producao do corredor.',
        posicoesIniciais:{ T101:'translate(135,180)', T201:'translate(135,300)' },
        ocupacoesIniciais:[],
        passos:[{
            tipo:'decisao', titulo:'Interdição programada em L2-B06',
            contexto:'A manutenção solicita bloqueio de L2-B06. T101 está pronto para circular e T201 deve ser regulado. Como organizar a janela?',
            opcoes:[
                { id:'seguro', titulo:'Interditar L2-B06 e desviar fluxo pela Linha 1', descricao:'Protege a equipe e mantem uma faixa operacional.', risco:'seguro', efeito:async()=>{ SEGMENTOS_INDISPONIVEIS_INICIAIS.add('SEG-L2-B06'); const st=segmentState['SEG-L2-B06']; if(st){st.estado=ESTADO_SEGMENTO.INDISPONIVEL;st.trem=null;} pintarSegmento('SEG-L2-B06',ESTADO_SEGMENTO.INDISPONIVEL); solicitarRota('T101_DESVIO_MANUTENCAO'); await esperarTremPararV45('T101'); } },
                { id:'moderado', titulo:'Adiar manutenção até T201 liberar o trecho', descricao:'Preserva a circulação atual, mas reduz a janela da equipe.', risco:'moderado', efeito:async()=>{ solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); registrarEvento('CCO: trecho entregue a manutenção após passagem do T201.'); } },
                { id:'arriscado', titulo:'Liberar T201 durante a preparacao da manutenção', descricao:'Cria risco de conflito com a área em processo de bloqueio.', risco:'arriscado', efeito:async()=>{ registrarEvento('ALERTA: tentativa de circular durante preparacao de bloqueio.'); solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); } }
            ]
        }]
    },
    fila_terminal_decisao: {
        nome:'Missão 5 - Fila no terminal',
        descricao:'O terminal reduz a capacidade de recebimento e o CCO precisa regular chegadas.',
        posicoesIniciais:{ T201:'translate(720,300)', T401:'translate(1500,390)', T501:'translate(760,690)' },
        ocupacoesIniciais:[],
        passos:[{
            tipo:'decisao', titulo:'Terminal com recebimento restrito',
            contexto:'T401 ocupa a área de manobra, T201 se aproxima carregado e T501 pode usar a pera. Qual plano evita saturacao?',
            opcoes:[
                { id:'seguro', titulo:'Concluir manobra de T401 e depois aproximar T201', descricao:'Evita sobreposicao na área de terminal.', risco:'seguro', efeito:async()=>{ solicitarRota('T401_RECOLHIMENTO_PATIO_B'); await esperarTremPararV45('T401'); solicitarRota('T201_APROXIMACAO_TERMINAL'); await esperarTremPararV45('T201'); } },
                { id:'moderado', titulo:'Regular T501 na pera e aproximar T201', descricao:'Usa a pera como recurso de regulação e mantem o pátio monitorado.', risco:'moderado', efeito:async()=>{ solicitarRota('T501_PERA_COMPLETA'); await esperar(1000); solicitarRota('T201_APROXIMACAO_TERMINAL'); await esperarTremPararV45('T501'); await esperarTremPararV45('T201'); } },
                { id:'arriscado', titulo:'Enviar T201 e T401 simultaneamente ao terminal', descricao:'Aumenta a ocupacao da regiao e pode gerar conflito operacional.', risco:'arriscado', efeito:async()=>{ solicitarRota('T201_APROXIMACAO_TERMINAL'); await esperar(400); solicitarRota('T401_RECOLHIMENTO_PATIO_B'); await esperarTremPararV45('T201'); await esperarTremPararV45('T401'); } }
            ]
        }]
    }

};

let relatorioMissaoAtual = null;
let execucaoAtualId = 0;

function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function tremEstaEmMovimentoV45(codigoTrem) {
    const trem = trainState[codigoTrem];
    return Boolean(trem && trem.emMovimento);
}

function existeTremEmMovimentoV45() {
    return Object.values(trainState).some(trem => trem && trem.emMovimento);
}

function esperarTremPararV45(codigoTrem, timeoutMs = 90000) {
    return new Promise(resolve => {
        const inicio = Date.now();
        const verificar = () => {
            if (!tremEstaEmMovimentoV45(codigoTrem)) return resolve();
            if (Date.now() - inicio > timeoutMs) return resolve();
            setTimeout(verificar, 250);
        };
        verificar();
    });
}

function esperarMalhaPararV45(timeoutMs = 90000) {
    return new Promise(resolve => {
        const inicio = Date.now();
        const verificar = () => {
            if (!existeTremEmMovimentoV45()) return resolve();
            if (Date.now() - inicio > timeoutMs) return resolve();
            setTimeout(verificar, 250);
        };
        verificar();
    });
}

function resetarRelatorioMissao(nomeMissao) { relatorioMissaoAtual = { nome: nomeMissao, escolhas: [] }; }
function registrarEscolhaRelatorio(decisaoTitulo, opcao) {
    if (!relatorioMissaoAtual) return;
    relatorioMissaoAtual.escolhas.push({ decisao: decisaoTitulo, opcao: opcao.titulo, risco: opcao.risco || 'neutro' });
}

function aplicarOcupacoesIniciaisMissao(missao) {
    (missao.ocupacoesIniciais || []).forEach(ocupacao => {
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
        registrarEvento(`${ocupacao.trem}: posicionado e ocupando ${ocupacao.segmentos.join(', ')}`);
    });
}

async function executarMissao(missaoId) {
    if (typeof abortarMovimentosV44 === 'function') abortarMovimentosV44();
    window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
    const missao = MISSOES[missaoId];
    if (!missao) return;

    execucaoAtualId += 1;
    const meuId = execucaoAtualId;

    resetarCenario(false);
    if (typeof abortarMovimentosV44 === 'function') abortarMovimentosV44();
    aplicarPosicoesIniciaisDoCenario(missao);
    aplicarOcupacoesIniciaisMissao(missao);
    marcarMissaoAtiva(missaoId);
    resetarRelatorioMissao(missao.nome);
    registrarEvento(`Iniciando ${missao.nome}`);
    registrarEvento(missao.descricao);

    for (const passo of missao.passos) {
        if (meuId !== execucaoAtualId) return;
        if (passo.tipo === 'espera') {
            await esperar(passo.ms || 0);
        } else if (passo.tipo === 'evento') {
            registrarEvento(passo.texto);
            if (passo.ms) await esperar(passo.ms);
        } else if (passo.tipo === 'decisao') {
            await esperarMalhaPararV45();
            window.CCO_MISSAO_AGUARDANDO_DECISAO = true;
            const opcaoEscolhida = await perguntarDecisao(passo);
            window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
            if (meuId !== execucaoAtualId) return;
            registrarEvento(`Decisão registrada: ${opcaoEscolhida.titulo}`);
            registrarEscolhaRelatorio(passo.titulo, opcaoEscolhida);
            await executarConsequenciaVisualV68(missaoId, passo, opcaoEscolhida);
            if (opcaoEscolhida.efeito) await opcaoEscolhida.efeito();
            await esperarMalhaPararV45(18000);
        }
    }

    if (meuId !== execucaoAtualId) return;
    registrarEvento(`Missão concluída: ${missao.nome}`);
    exibirRelatorioFinal();
}

function resetarMissao() {
    execucaoAtualId += 1;
    window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
    if (typeof abortarMovimentosV44 === 'function') abortarMovimentosV44();
    resetarCenario(true);
    document.querySelectorAll('.btn-missao').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.decisao-overlay, .relatorio-overlay').forEach(el => el.remove());
}

function perguntarDecisao(decisao) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'decisao-overlay';
        overlay.innerHTML = `
            <div class="decisao-modal">
                <span class="decisao-modal-tag">DECISÃO OPERACIONAL</span>
                <h3 class="decisao-modal-titulo">${decisao.titulo}</h3>
                <p class="decisao-modal-contexto">${decisao.contexto}</p>
                <div class="decisao-modal-opcoes"></div>
            </div>
        `;
        const opcoesEl = overlay.querySelector('.decisao-modal-opcoes');
        decisao.opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.className = `decisao-opcao decisao-opcao--${opcao.risco || 'neutro'}`;
            btn.innerHTML = `<strong>${opcao.titulo}</strong><span>${opcao.descricao}</span>`;
            btn.addEventListener('click', () => { overlay.remove(); resolve(opcao); });
            opcoesEl.appendChild(btn);
        });
        document.body.appendChild(overlay);
    });
}

function exibirRelatorioFinal() {
    if (!relatorioMissaoAtual) return;
    const linhas = relatorioMissaoAtual.escolhas.map(e => `<li><strong>${e.decisao}:</strong> ${e.opcao} <span class="tag-risco tag-risco--${e.risco}">${e.risco}</span></li>`).join('');
    const overlay = document.createElement('div');
    overlay.className = 'relatorio-overlay';
    overlay.innerHTML = `
        <div class="relatorio-modal">
            <span class="decisao-modal-tag">RELATÓRIO DA MISSÃO</span>
            <h3 class="decisao-modal-titulo">${relatorioMissaoAtual.nome}</h3>
            <ul class="relatorio-lista">${linhas}</ul>
            <button class="relatorio-fechar">Fechar</button>
        </div>
    `;
    overlay.querySelector('.relatorio-fechar').addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

function marcarMissaoAtiva(missaoId) {
    document.querySelectorAll('.btn-missao').forEach(btn => btn.classList.toggle('active', btn.dataset.missao === missaoId));
}

function instalarEstilosDecisao() {
    if (document.getElementById('decisão-styles')) return;
    const style = document.createElement('style');
    style.id = 'decisão-styles';
    style.textContent = `
        .decisão-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 20px;background:rgba(26,16,6,.92);border-bottom:1px solid rgba(217,184,74,.35)}
        .tab-label--decisão{color:#e2c26b;font-size:11px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;margin-right:4px}
        .btn-missão{height:32px;border:1px solid rgba(217,184,74,.45);border-radius:9px;background:linear-gradient(180deg,#2a1d0c 0%,#1c1305 100%);color:#f5e6bc;cursor:pointer;font-size:11px;font-weight:650;padding:0 12px}
        .btn-missão:hover{border-color:#e2c26b;transform:translateY(-1px)}.btn-missão.active{border-color:#36d979;color:#d8ffe7}.btn-missão--reset{color:#fecaca;border-color:rgba(201,75,75,.45);margin-left:auto}
        .decisao-overlay,.relatorio-overlay{position:fixed;inset:0;background:rgba(3,4,6,.72);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
        .decisao-modal,.relatorio-modal{width:min(560px,100%);background:#0e1116;border:1px solid rgba(217,184,74,.5);border-radius:14px;padding:22px 24px;box-shadow:0 24px 70px rgba(0,0,0,.55)}
        .decisao-modal-tag{color:#e2c26b;font-size:10.5px;font-weight:700;letter-spacing:1.2px}.decisao-modal-titulo{color:#fff;font-size:17px;margin:8px 0 10px}.decisao-modal-contexto{color:#c7cdd3;font-size:12.5px;line-height:1.5;margin-bottom:16px}.decisao-modal-opcoes{display:flex;flex-direction:column;gap:9px}
        .decisao-opcao{text-align:left;border-radius:10px;padding:10px 12px;cursor:pointer;background:#141821;color:#fff;display:flex;flex-direction:column;gap:3px;border:1px solid #2a323d;transition:transform .12s ease,border-color .12s ease}.decisao-opcao strong{font-size:12.5px}.decisao-opcao span{font-size:11px;color:#a7b0b8}.decisao-opcao:hover{transform:translateY(-1px)}.decisao-opcao--seguro:hover{border-color:#36d979}.decisao-opcao--moderado:hover{border-color:#d9b84a}.decisao-opcao--arriscado:hover{border-color:#c94b4b}
        .relatorio-lista{list-style:none;display:grid;gap:7px;margin:6px 0 14px;padding:0}.relatorio-lista li{font-size:12px;color:#dfe4e8}.tag-risco{font-size:9.5px;text-transform:uppercase;padding:2px 6px;border-radius:999px;margin-left:6px}.tag-risco--seguro{background:rgba(54,217,121,.18);color:#8ff0b8}.tag-risco--moderado{background:rgba(217,184,74,.18);color:#f0e0a0}.tag-risco--arriscado{background:rgba(201,75,75,.18);color:#f5b6b6}.relatorio-fechar{width:100%;padding:9px;border-radius:9px;border:1px solid rgba(217,184,74,.5);background:#1c1305;color:#f5e6bc;cursor:pointer;font-size:12px;font-weight:650}
    `;
    document.head.appendChild(style);
}

function conectarBotoesModoDecisao(nav) {
    if (!nav || nav.dataset.eventosInstalados === 'true') return;
    nav.dataset.eventosInstalados = 'true';
    nav.querySelectorAll('[data-missão]').forEach(btn => btn.addEventListener('click', () => executarMissao(btn.dataset.missao)));
    const resetBtn = nav.querySelector('[data-action="reset-missão"]');
    if (resetBtn) resetBtn.addEventListener('click', resetarMissao);
}

function instalarBarraDeMissoes() {
    instalarEstilosDecisao();
    const nav = document.querySelector('.decisão-tabs');
    if (nav) { conectarBotoesModoDecisao(nav); return; }
    const tabsCenarios = document.querySelector('.scenario-tabs');
    if (!tabsCenarios) return;
    const novo = document.createElement('nav');
    novo.className = 'decisão-tabs';
    novo.setAttribute('aria-label', 'Modo Decisão');
    novo.innerHTML = `<span class="tab-label tab-label--decisão">Modo Decisão</span>${Object.entries(MISSOES).map(([id,m]) => `<button type="button" class="btn-missão" data-missao="${id}">${m.nome}</button>`).join('')}<button type="button" class="btn-missão btn-missão--reset" data-action="reset-missão">Resetar missão</button>`;
    tabsCenarios.insertAdjacentElement('afterend', novo);
    conectarBotoesModoDecisao(novo);
}


// ===== Revisão v62 - Modo Decisão gamificado =====
const GAME_DECISAO = {
    pontos: 100,
    seguranca: 100,
    vidas: 3,
    sequencia: 0,
    iniciado: false,
    encerrado: false,
    historico: [],
};

const IMPACTO_RISCO = {
    seguro: { pontos: 20, seguranca: 5, vidas: 0, rotulo: 'Decisão segura' },
    moderado: { pontos: 8, seguranca: -8, vidas: 0, rotulo: 'Decisão com impacto controlado' },
    arriscado: { pontos: -35, seguranca: -25, vidas: -1, rotulo: 'Falha operacional' },
    neutro: { pontos: 0, seguranca: 0, vidas: 0, rotulo: 'Decisão neutra' },
};

function limitarV62(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
}

function atualizarHudV62() {
    const score = document.getElementById('game-score');
    const safety = document.getElementById('game-safety');
    const lives = document.getElementById('game-lives');
    const streak = document.getElementById('game-streak');
    if (score) score.textContent = GAME_DECISAO.pontos;
    if (safety) safety.textContent = `${GAME_DECISAO.seguranca}%`;
    if (lives) lives.textContent = GAME_DECISAO.vidas;
    if (streak) streak.textContent = GAME_DECISAO.sequencia;
}

function reiniciarJogoDecisaoV62() {
    Object.assign(GAME_DECISAO, {
        pontos: 100, seguranca: 100, vidas: 3, sequencia: 0,
        iniciado: true, encerrado: false, historico: [],
    });
    atualizarHudV62();
}

function avaliarEscolhaV62(decisao, opcao) {
    const impacto = IMPACTO_RISCO[opcao.risco || 'neutro'] || IMPACTO_RISCO.neutro;
    GAME_DECISAO.pontos = Math.max(0, GAME_DECISAO.pontos + impacto.pontos);
    GAME_DECISAO.seguranca = limitarV62(GAME_DECISAO.seguranca + impacto.seguranca, 0, 100);
    GAME_DECISAO.vidas = Math.max(0, GAME_DECISAO.vidas + impacto.vidas);
    GAME_DECISAO.sequencia = opcao.risco === 'seguro' ? GAME_DECISAO.sequencia + 1 : 0;
    GAME_DECISAO.historico.push({ decisao: decisao.titulo, opcao: opcao.titulo, risco: opcao.risco, impacto });
    atualizarHudV62();
    return impacto;
}

function exibirResultadoEscolhaV62(decisao, opcao, impacto) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'decisao-overlay resultado-escolha-overlay';
        const perdeuVida = impacto.vidas < 0;
        const classe = opcao.risco || 'neutro';
        overlay.innerHTML = `
          <div class="decisao-modal resultado-escolha resultado-escolha--${classe}">
            <span class="decisao-modal-tag">RESULTADO APÓS A ANIMAÇÃO</span>
            <h3 class="decisao-modal-titulo">${impacto.rotulo}</h3>
            <p class="decisao-modal-contexto"><strong>${opcao.titulo}</strong><br>${opcao.descricao}</p>
            <div class="impact-grid">
              <span><small>Pontos</small><strong>${impacto.pontos >= 0 ? '+' : ''}${impacto.pontos}</strong></span>
              <span><small>Segurança</small><strong>${impacto.seguranca >= 0 ? '+' : ''}${impacto.seguranca}%</strong></span>
              <span><small>Vidas</small><strong>${impacto.vidas}</strong></span>
            </div>
            <p class="resultado-feedback">${perdeuVida ? 'A decisão gerou uma ocorrência crítica simulada. Uma vida foi perdida.' : 'A missão continuará com os impactos registrados.'}</p>
            <button class="relatorio-fechar">Continuar</button>
          </div>`;
        overlay.querySelector('button').addEventListener('click', () => { overlay.remove(); resolve(); });
        document.body.appendChild(overlay);
    });
}

function verificarDerrotaV62() {
    return GAME_DECISAO.vidas <= 0 || GAME_DECISAO.seguranca <= 20 || GAME_DECISAO.pontos <= 0;
}

function exibirFimDeJogoV62(motivo) {
    GAME_DECISAO.encerrado = true;
    const overlay = document.createElement('div');
    overlay.className = 'relatorio-overlay game-over-overlay';
    overlay.innerHTML = `
      <div class="relatorio-modal game-over-modal">
        <span class="decisao-modal-tag">MISSÃO ENCERRADA</span>
        <h3 class="decisao-modal-titulo">Operação não concluída</h3>
        <p class="decisao-modal-contexto">${motivo}</p>
        <div class="impact-grid impact-grid--final">
          <span><small>Pontuação</small><strong>${GAME_DECISAO.pontos}</strong></span>
          <span><small>Segurança</small><strong>${GAME_DECISAO.seguranca}%</strong></span>
          <span><small>Vidas</small><strong>${GAME_DECISAO.vidas}</strong></span>
        </div>
        <button class="relatorio-fechar">Tentar novamente</button>
      </div>`;
    overlay.querySelector('button').addEventListener('click', () => {
        overlay.remove();
        reiniciarJogoDecisaoV62();
        resetarMissao();
    });
    document.body.appendChild(overlay);
}

// Substitui somente o fluxo principal da missão, preservando as missões e seus efeitos.
executarMissao = async function(missaoId) {
    if (typeof abortarMovimentosV44 === 'function') abortarMovimentosV44();
    window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
    const missao = MISSOES[missaoId];
    if (!missao) return;
    reiniciarJogoDecisaoV62();
    execucaoAtualId += 1;
    const meuId = execucaoAtualId;
    resetarCenario(false);
    if (typeof abortarMovimentosV44 === 'function') abortarMovimentosV44();
    aplicarPosicoesIniciaisDoCenario(missao);
    aplicarOcupacoesIniciaisMissao(missao);
    marcarMissaoAtiva(missaoId);
    resetarRelatorioMissao(missao.nome);
    registrarEvento(`Iniciando ${missao.nome}`);
    registrarEvento(missao.descricao);

    for (const passo of missao.passos) {
        if (meuId !== execucaoAtualId || GAME_DECISAO.encerrado) return;
        if (passo.tipo === 'espera') await esperar(passo.ms || 0);
        else if (passo.tipo === 'evento') {
            registrarEvento(passo.texto);
            if (passo.ms) await esperar(passo.ms);
        } else if (passo.tipo === 'decisao') {
            await esperarMalhaPararV45();
            window.CCO_MISSAO_AGUARDANDO_DECISAO = true;
            const opcaoEscolhida = await perguntarDecisao(passo);
            window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
            if (meuId !== execucaoAtualId) return;
            const impacto = avaliarEscolhaV62(passo, opcaoEscolhida);
            registrarEvento(`Decisão registrada: ${opcaoEscolhida.titulo} | ${impacto.pontos >= 0 ? '+' : ''}${impacto.pontos} pontos`);
            registrarEscolhaRelatorio(passo.titulo, opcaoEscolhida);
            await executarConsequenciaVisualV68(missaoId, passo, opcaoEscolhida);
            if (meuId !== execucaoAtualId) return;
            await exibirResultadoEscolhaV62(passo, opcaoEscolhida, impacto);
            if (meuId !== execucaoAtualId) return;
            if (verificarDerrotaV62()) {
                const motivo = GAME_DECISAO.vidas <= 0
                    ? 'As três oportunidades foram consumidas por decisões críticas.'
                    : GAME_DECISAO.seguranca <= 20
                        ? 'O indicador de segurança atingiu um nível crítico.'
                        : 'A pontuação operacional chegou a zero.';
                exibirFimDeJogoV62(motivo);
                return;
            }
            if (opcaoEscolhida.efeito) await opcaoEscolhida.efeito();
            await esperarMalhaPararV45(18000);
        }
    }
    if (meuId !== execucaoAtualId) return;
    if (!relatorioMissaoAtual || relatorioMissaoAtual.escolhas.length === 0) {
        registrarEvento('A missão não apresentou decisões. O fluxo foi interrompido para evitar um encerramento incorreto.');
        return;
    }
    GAME_DECISAO.encerrado = true;
    registrarEvento(`Missão concluída: ${missao.nome}`);
    exibirRelatorioFinal();
};

// Relatório final com resultado gamificado.
exibirRelatorioFinal = function() {
    if (!relatorioMissaoAtual) return;
    const linhas = relatorioMissaoAtual.escolhas.map(e => `<li><strong>${e.decisao}:</strong> ${e.opcao} <span class="tag-risco tag-risco--${e.risco}">${e.risco}</span></li>`).join('');
    const classificacao = GAME_DECISAO.seguranca >= 90 && GAME_DECISAO.vidas === 3 ? 'Excelente' : GAME_DECISAO.seguranca >= 70 ? 'Boa' : 'Atenção necessária';
    const overlay = document.createElement('div');
    overlay.className = 'relatorio-overlay';
    overlay.innerHTML = `
      <div class="relatorio-modal">
        <span class="decisao-modal-tag">RELATÓRIO DA MISSÃO</span>
        <h3 class="decisao-modal-titulo">${relatorioMissaoAtual.nome}</h3>
        <div class="impact-grid impact-grid--final">
          <span><small>Pontuação</small><strong>${GAME_DECISAO.pontos}</strong></span>
          <span><small>Segurança</small><strong>${GAME_DECISAO.seguranca}%</strong></span>
          <span><small>Classificação</small><strong>${classificacao}</strong></span>
        </div>
        <ul class="relatorio-lista">${linhas}</ul>
        <p class="resultado-feedback">Resultado simplificado para estudo pessoal. Não representa avaliação ou procedimento oficial.</p>
        <button class="relatorio-fechar">Fechar</button>
      </div>`;
    overlay.querySelector('.relatorio-fechar').addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
};

window.addEventListener('DOMContentLoaded', atualizarHudV62);

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', instalarBarraDeMissoes);
else instalarBarraDeMissoes();


// ===== Revisão v65 - missões com múltiplas fases e conteúdo instrutivo =====
function opcaoV65(id, titulo, descricao, risco, fundamento, evento) {
    return {
        id, titulo, descricao, risco, fundamento,
        efeito: async () => {
            registrarEvento(evento || titulo);
            await esperar(550);
        },
    };
}

Object.assign(MISSOES.cruzamento_decisao, {
    nome: 'Missão 1 - Encontro de trens no Pátio A',
    descricao: 'Uma composição vazia aguarda na via desviada enquanto um trem carregado se aproxima pela linha principal. A missão percorre planejamento, autorização, acompanhamento e liberação da área.',
    passos: [
        {
            tipo: 'decisao', titulo: 'Fase 1 de 4 - Preparação do encontro',
            contexto: 'T301 está na via desviada PA1. T201, carregado, aproxima-se pela Linha 2. Antes de autorizar qualquer movimento, qual verificação deve orientar a decisão?',
            opcoes: [
                opcaoV65('seguro','Confirmar ocupação, posição dos AMVs e extensão útil da via','Verifica se o T301 está integralmente protegido na desviada e se a rota principal está livre.','seguro','Antes de uma autorização, a condição dos trechos, dos aparelhos de via e da rota deve ser conhecida de forma coerente.','Condições da via desviada e da linha principal verificadas.'),
                opcaoV65('moderado','Conferir apenas a linha principal','Mantém foco no trem carregado, mas deixa de revisar toda a via de cruzamento.','moderado','Uma verificação parcial pode não identificar restrições na via em que o outro trem está aguardando.','Linha principal conferida; verificação do pátio ficou incompleta.'),
                opcaoV65('arriscado','Autorizar imediatamente pela previsão de horário','Usa apenas a programação como referência, sem confirmar o estado atual da malha.','arriscado','A programação não substitui a confirmação das condições reais apresentadas pelo sistema.','Autorização tentada sem confirmação completa da malha.')
            ]
        },
        {
            tipo: 'decisao', titulo: 'Fase 2 de 4 - Definição da prioridade',
            contexto: 'As duas rotas estão disponíveis, mas o T201 carregado possui maior restrição de retomada de velocidade. Qual sequência é mais adequada para o cenário?',
            opcoes: [
                opcaoV65('seguro','Manter T301 protegido e liberar T201 pela principal','Preserva a passagem do trem carregado sem movimentar a composição da desviada.','seguro','A decisão reduz movimentos simultâneos na mesma região e mantém a composição aguardando em via protegida.','T301 mantido na desviada; T201 priorizado na principal.'),
                opcaoV65('moderado','Reter os dois até uma nova janela','Evita conflito, porém ocupa capacidade e aumenta o tempo de espera.','moderado','Reter todos os movimentos pode ser seguro, mas reduz a fluidez e deve ter justificativa operacional.','Movimentos retidos para nova avaliação.'),
                opcaoV65('arriscado','Liberar T301 para sair durante a aproximação de T201','Cria solicitações concorrentes na mesma zona de rota.','arriscado','Rotas incompatíveis não devem ser conduzidas como movimentos simultâneos.','Solicitação conflitante criada na zona do Pátio A.')
            ]
        },
        { tipo:'evento', texto:'T201 percorre a região do Pátio A e libera progressivamente os blocos.', ms:700 },
        {
            tipo: 'decisao', titulo: 'Fase 3 de 4 - Acompanhamento da circulação',
            contexto: 'Durante a passagem, um sensor apresenta indicação intermitente, embora os blocos seguintes permaneçam coerentes. Qual resposta é mais apropriada?',
            opcoes: [
                opcaoV65('seguro','Aplicar acompanhamento reforçado e registrar a anomalia','Mantém a proteção, acompanha as indicações relacionadas e aciona avaliação técnica.','seguro','Uma indicação anômala deve ser tratada com rastreabilidade e comparação com outras informações disponíveis.','Anomalia registrada e acompanhamento reforçado ativado.'),
                opcaoV65('moderado','Aguardar nova ocorrência antes de registrar','Evita ação imediata, mas perde informação importante para a análise da falha.','moderado','Eventos intermitentes também precisam ser registrados para permitir análise de tendência.','Indicação mantida em observação sem registro imediato.'),
                opcaoV65('arriscado','Desconsiderar o alerta porque o trem continua em movimento','Remove da análise uma possível falha de detecção.','arriscado','A continuidade do movimento não comprova que a indicação está correta.','Alerta de sensor ignorado durante a passagem.')
            ]
        },
        {
            tipo: 'decisao', titulo: 'Fase 4 de 4 - Liberação da composição aguardando',
            contexto: 'T201 já liberou a zona de conflito. O que deve anteceder a saída do T301?',
            opcoes: [
                opcaoV65('seguro','Confirmar liberação dos blocos e estabelecer uma nova rota','Trata a saída do T301 como um novo movimento, com nova verificação.','seguro','A passagem do primeiro trem não autoriza automaticamente o segundo. A nova rota precisa ser verificada e estabelecida.','Blocos liberados; nova rota preparada para T301.'),
                opcaoV65('moderado','Liberar T301 assim que o último sensor atuar','Usa uma única indicação como referência para a decisão.','moderado','Uma indicação isolada pode não representar todas as condições necessárias para a nova rota.','Saída condicionada somente ao último sensor.'),
                opcaoV65('arriscado','Movimentar T301 antes da liberação completa','Antecipação que invade uma área ainda protegida para o movimento anterior.','arriscado','A rota anterior precisa estar liberada de acordo com a lógica prevista antes de um movimento incompatível.','T301 movimentado antes da liberação completa da zona.')
            ]
        }
    ]
});

Object.assign(MISSOES.prioridade_exportacao, {
    nome: 'Missão 2 - Regulação de trens de carga',
    descricao: 'Dois trens com compromissos diferentes disputam capacidade no corredor. A missão aborda prioridade, uso da linha dupla, restrição de velocidade e chegada ao terminal.',
    passos: [
        {
            tipo:'decisao', titulo:'Fase 1 de 4 - Leitura do cenário',
            contexto:'T201 transporta carga de exportação e possui janela de recebimento. T101 é intermodal e apresenta melhor desempenho. As duas linhas estão disponíveis. Qual é o primeiro passo?',
            opcoes:[
                opcaoV65('seguro','Comparar janela, rota, velocidade e conflitos previstos','Avalia o compromisso de cada trem e a capacidade disponível antes de definir a sequência.','seguro','Prioridade operacional depende do contexto completo, não apenas do tipo de carga.','Restrições e compromissos dos dois trens comparados.'),
                opcaoV65('moderado','Priorizar automaticamente a carga de exportação','Pode atender à janela, mas ignora a possibilidade de circulação paralela.','moderado','Uma prioridade pré-definida pode desperdiçar capacidade quando existem rotas independentes.','T201 recebeu prioridade sem avaliação completa da linha dupla.'),
                opcaoV65('arriscado','Liberar o trem mais rápido sem avaliar o terminal','Favorece desempenho momentâneo e pode comprometer a sequência de recebimento.','arriscado','Velocidade não deve ser o único critério quando existem restrições adiante.','T101 priorizado sem considerar a janela do terminal.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 2 de 4 - Uso da linha dupla',
            contexto:'Não existe conflito físico entre as rotas propostas. Como aproveitar a infraestrutura?',
            opcoes:[
                opcaoV65('seguro','Liberar os dois trens em linhas independentes','Utiliza a capacidade do corredor e mantém acompanhamento separado de cada rota.','seguro','Linhas independentes podem permitir circulação paralela quando todas as condições de rota estão atendidas.','T101 e T201 autorizados em linhas independentes.'),
                opcaoV65('moderado','Liberar apenas T201 e manter T101 retido','Protege a janela de exportação, porém reduz o uso da capacidade disponível.','moderado','A retenção pode ser válida, mas precisa ser comparada com o uso possível da outra linha.','T201 liberado; T101 permanece aguardando.'),
                opcaoV65('arriscado','Colocar os dois na mesma linha para facilitar o acompanhamento','Cria dependência desnecessária entre movimentos que poderiam ser separados.','arriscado','Concentrar movimentos pode aumentar conflitos e reduzir margens de regulação.','Dois movimentos direcionados para a mesma linha sem necessidade.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 3 de 4 - Restrição temporária',
            contexto:'Surge uma restrição temporária de velocidade na Linha 2 à frente do T201. O terminal mantém a janela. Como regular o corredor?',
            opcoes:[
                opcaoV65('seguro','Recalcular a previsão, comunicar o impacto e manter separação','Atualiza a estratégia com base na nova velocidade e evita decisões reativas.','seguro','Mudanças de desempenho devem ser incorporadas à previsão e comunicadas às áreas envolvidas.','Previsão do T201 recalculada com a restrição temporária.'),
                opcaoV65('moderado','Manter o plano e verificar o atraso próximo ao terminal','Reduz alterações imediatas, mas deixa pouca margem para reação.','moderado','A postergação da análise reduz opções disponíveis para regulação.','Plano mantido sem atualização imediata da previsão.'),
                opcaoV65('arriscado','Compensar aumentando a velocidade após a restrição','Tenta recuperar tempo sem considerar limites e condições do trecho.','arriscado','O cumprimento de uma janela não justifica ultrapassar limites operacionais.','Tentativa de compensação inadequada registrada.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 4 de 4 - Aproximação do terminal',
            contexto:'O terminal informa redução momentânea da capacidade de recebimento. T201 está mais próximo e T101 mantém circulação regular. Qual ação organiza melhor a chegada?',
            opcoes:[
                opcaoV65('seguro','Regular T201 em ponto protegido e confirmar a liberação do terminal','Evita saturar a área de chegada e mantém comunicação com o terminal.','seguro','A aproximação precisa considerar a capacidade real de recebimento e locais adequados para espera.','T201 regulado em ponto protegido até confirmação do terminal.'),
                opcaoV65('moderado','Reduzir a marcha e continuar aproximando','Ganha tempo, mas diminui o espaço disponível para nova regulação.','moderado','A aproximação controlada pode ser válida, porém exige margem e confirmação contínua.','T201 continua aproximando em velocidade reduzida.'),
                opcaoV65('arriscado','Enviar T201 para a área de terminal sem confirmação','Pode bloquear acessos e aumentar a ocupação de uma região restrita.','arriscado','A entrada deve considerar a disponibilidade efetiva do destino.','T201 enviado para uma área sem capacidade confirmada.')
            ]
        }
    ]
});

Object.assign(MISSOES.falha_amv_decisao, {
    nome:'Missão 3 - Falha de AMV e operação degradada',
    descricao:'O AMV-07 perde confirmação de posição durante uma solicitação de saída do pátio. A missão aborda proteção, diagnóstico, circulação independente e retorno à condição normal.',
    passos:[
        {
            tipo:'decisao', titulo:'Fase 1 de 4 - Resposta inicial à falha',
            contexto:'T302 solicita saída, mas o AMV-07 não apresenta confirmação conclusiva. Qual é a resposta inicial?',
            opcoes:[
                opcaoV65('seguro','Manter o sinal fechado e bloquear a rota afetada','Protege o movimento até que a condição do aparelho seja conhecida.','seguro','Sem confirmação coerente do aparelho de via, a rota dependente deve permanecer restrita.','Rota do T302 bloqueada e sinal mantido fechado.'),
                opcaoV65('moderado','Repetir o comando uma vez e observar a indicação','Pode ajudar no diagnóstico, mas não autoriza circulação enquanto a confirmação não existir.','moderado','Uma nova tentativa de comando não substitui a comprovação da posição e do travamento.','Comando repetido; rota continua sem autorização.'),
                opcaoV65('arriscado','Autorizar T302 com base na última posição conhecida','Considera um estado anterior como se fosse a condição atual.','arriscado','A última indicação conhecida não garante que o aparelho continua na posição necessária.','Autorização indevida tentada com indicação ausente.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 2 de 4 - Continuidade da operação',
            contexto:'A falha afeta apenas a saída do Pátio A. A Linha 1 está independente e disponível para T101. Como proceder?',
            opcoes:[
                opcaoV65('seguro','Manter a área da falha protegida e liberar T101 pela Linha 1','Preserva a circulação que não depende do AMV-07.','seguro','Uma falha localizada não precisa paralisar movimentos comprovadamente independentes.','T101 liberado pela Linha 1; área do AMV-07 permanece protegida.'),
                opcaoV65('moderado','Suspender todos os movimentos até o reparo','É conservador, mas amplia o impacto da falha para uma linha independente.','moderado','A suspensão total pode ser desnecessária quando a independência das rotas está comprovada.','Toda a malha foi retida durante a verificação.'),
                opcaoV65('arriscado','Usar uma rota próxima sem verificar incompatibilidades','Tenta contornar a falha sem validar as condições da alternativa.','arriscado','Toda rota alternativa também precisa satisfazer as condições de segurança e compatibilidade.','Alternativa solicitada sem análise de conflitos.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 3 de 4 - Informação de campo',
            contexto:'A equipe informa que o aparelho está na posição esperada, mas a indicação elétrica ainda não retornou. O que fazer?',
            opcoes:[
                opcaoV65('seguro','Manter a restrição até restabelecer a condição prevista para o sistema','A observação local é registrada, mas a rota continua bloqueada.','seguro','A liberação depende dos critérios previstos para a operação degradada e não apenas de uma observação isolada.','Informação de campo registrada; rota permanece bloqueada.'),
                opcaoV65('moderado','Preparar o plano de retomada sem liberar o trem','Organiza a sequência futura enquanto aguarda a confirmação.','moderado','Planejar a retomada é útil, desde que nenhuma autorização seja antecipada.','Plano de retomada preparado sem movimentação.'),
                opcaoV65('arriscado','Liberar o trem somente com a informação verbal','Substitui a confirmação do sistema por uma única fonte.','arriscado','Uma informação de campo precisa ser tratada dentro dos procedimentos aplicáveis, não como liberação automática.','Trem liberado sem restabelecimento da indicação.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 4 de 4 - Retorno à condição normal',
            contexto:'A indicação do AMV-07 foi restabelecida. Qual sequência conclui a contingência?',
            opcoes:[
                opcaoV65('seguro','Confirmar estado, restabelecer a rota e registrar a normalização','Realiza nova verificação antes de autorizar T302.','seguro','O retorno da indicação deve ser seguido por verificação coerente e registro da normalização.','AMV-07 confirmado; rota do T302 restabelecida.'),
                opcaoV65('moderado','Liberar T302 e registrar a normalização depois','Resolve o movimento, mas reduz a rastreabilidade imediata.','moderado','O registro deve acompanhar a mudança de condição para preservar o histórico da operação.','T302 liberado antes da conclusão do registro.'),
                opcaoV65('arriscado','Retomar todas as rotas sem nova conferência','Trata o retorno de um único sinal como confirmação completa da área.','arriscado','A normalização de um elemento não substitui a revisão das demais condições da rota.','Operação retomada sem conferência completa da área.')
            ]
        }
    ]
});

Object.assign(MISSOES.janela_manutencao_decisao, {
    nome:'Missão 4 - Janela de manutenção na Linha 2',
    descricao:'Uma equipe solicita uma janela em L2-B06. A missão percorre preparação do bloqueio, entrega da área, circulação na linha adjacente e devolução do trecho.',
    passos:[
        {
            tipo:'decisao', titulo:'Fase 1 de 4 - Preparação da janela',
            contexto:'A manutenção solicita acesso a L2-B06. T201 ainda está previsto no corredor. Qual é a primeira ação?',
            opcoes:[
                opcaoV65('seguro','Verificar trens, rotas ativas e limites exatos da área','Confirma que nenhum movimento permanece comprometido com o trecho.','seguro','A proteção começa pela definição clara da área e pela confirmação de que os movimentos incompatíveis foram controlados.','Movimentos e limites da janela verificados.'),
                opcaoV65('moderado','Aguardar o horário programado e então bloquear','Segue a programação, porém reduz a antecedência para tratar alterações.','moderado','O horário planejado não elimina a necessidade de conferir a situação real da malha.','Bloqueio condicionado apenas ao horário programado.'),
                opcaoV65('arriscado','Autorizar o acesso porque o trecho aparenta estar livre','Usa apenas a aparência momentânea do painel.','arriscado','A ausência visual de trem não comprova que não existam rotas estabelecidas ou movimentos comprometidos.','Acesso tentado sem verificação das rotas existentes.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 2 de 4 - Entrega da área',
            contexto:'L2-B06 está livre e sem rota ativa. Como representar corretamente a entrega do trecho?',
            opcoes:[
                opcaoV65('seguro','Aplicar a interdição, manter sinais restritivos e registrar a entrega','Torna a indisponibilidade visível e impede autorização incompatível.','seguro','A área entregue precisa permanecer protegida contra movimentos não autorizados.','L2-B06 interditado e entregue à manutenção.'),
                opcaoV65('moderado','Registrar a manutenção sem alterar o estado do bloco','Mantém o histórico, mas deixa a indisponibilidade pouco evidente no painel.','moderado','O estado apresentado deve refletir a indisponibilidade real do trecho.','Manutenção registrada sem indicação visual completa.'),
                opcaoV65('arriscado','Manter o bloco disponível para ganhar flexibilidade','Permite que uma rota incompatível seja solicitada durante a intervenção.','arriscado','Um trecho sob intervenção não deve permanecer disponível para rotas normais.','Trecho em manutenção mantido disponível no sistema.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 3 de 4 - Circulação na linha adjacente',
            contexto:'A Linha 1 permanece disponível. T101 solicita passagem enquanto a equipe trabalha na Linha 2. Qual decisão é mais adequada?',
            opcoes:[
                opcaoV65('seguro','Confirmar independência e liberar T101 pela Linha 1','Mantém a produção sem utilizar a área interditada.','seguro','A circulação adjacente pode ser mantida quando as condições de independência e proteção estão atendidas.','T101 liberado pela Linha 1 durante a janela.'),
                opcaoV65('moderado','Reter T101 até metade da janela','Adiciona margem, mas amplia o impacto operacional.','moderado','A retenção precisa ser proporcional ao risco e às condições reais da intervenção.','T101 retido temporariamente sem necessidade confirmada.'),
                opcaoV65('arriscado','Desviar T101 pela Linha 2 para evitar atraso','Direciona o trem para o trecho entregue à manutenção.','arriscado','A rota não pode utilizar a área protegida para a intervenção.','Rota solicitada pelo trecho interditado.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 4 de 4 - Devolução do trecho',
            contexto:'A equipe informa conclusão do serviço. O que deve ocorrer antes de retirar a interdição?',
            opcoes:[
                opcaoV65('seguro','Confirmar liberação da área, condição dos equipamentos e registro da devolução','Só depois restabelece o bloco para novas rotas.','seguro','A devolução deve confirmar que pessoas, ferramentas e restrições foram retiradas conforme o processo aplicável.','Área devolvida e L2-B06 restabelecido após conferência.'),
                opcaoV65('moderado','Retirar a interdição e concluir o registro em seguida','Acelera a retomada, mas cria um intervalo sem documentação completa.','moderado','A alteração do estado deve ser acompanhada por comunicação e registro coerentes.','Interdição retirada antes do encerramento documental.'),
                opcaoV65('arriscado','Liberar uma rota assim que a equipe anunciar o término','Não realiza a conferência final da condição do trecho.','arriscado','O anúncio de término não substitui a confirmação necessária para a devolução.','Rota liberada sem conferência final da área.')
            ]
        }
    ]
});

Object.assign(MISSOES.fila_terminal_decisao, {
    nome:'Missão 5 - Regulação de chegada ao terminal',
    descricao:'A capacidade de recebimento é reduzida enquanto três movimentos disputam a região. A missão aborda fila, pátio, pera de retorno e comunicação com o terminal.',
    passos:[
        {
            tipo:'decisao', titulo:'Fase 1 de 4 - Diagnóstico da fila',
            contexto:'T401 ocupa a área de manobra, T201 aproxima-se carregado e T501 pode utilizar a pera. Qual informação é prioritária?',
            opcoes:[
                opcaoV65('seguro','Confirmar capacidade do terminal e tempo de liberação do Pátio B','Permite definir pontos de espera e sequência de chegada.','seguro','A regulação depende da capacidade real do destino e da previsão de liberação da área.','Terminal e Pátio B forneceram previsão atualizada.'),
                opcaoV65('moderado','Usar somente a ordem de chegada dos trens','É simples, mas ignora restrições de manobra e capacidade.','moderado','A ordem de chegada é apenas um dos critérios de regulação.','Fila organizada apenas pela ordem estimada de chegada.'),
                opcaoV65('arriscado','Aproximar todos para reduzir o tempo de espera','Concentra trens em uma região com capacidade reduzida.','arriscado','A aproximação excessiva diminui as opções de regulação e pode saturar a área.','Trens aproximados simultaneamente da área restrita.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 2 de 4 - Organização dos movimentos',
            contexto:'T401 precisa concluir uma manobra curta. T201 possui carga para recebimento e T501 está disponível para reposicionamento. Qual sequência reduz a saturação?',
            opcoes:[
                opcaoV65('seguro','Concluir T401, manter T201 regulado e usar a pera somente se necessário','Libera primeiro o recurso crítico e evita movimentos adicionais sem finalidade.','seguro','Movimentos devem ser organizados para liberar a restrição principal antes de aumentar a ocupação local.','T401 priorizado para liberar o Pátio B; T201 permanece regulado.'),
                opcaoV65('moderado','Enviar T501 para a pera enquanto T401 conclui a manobra','Pode aproveitar tempo, porém adiciona outro movimento à região.','moderado','Movimentos paralelos exigem avaliação de independência e benefício real.','T501 iniciou reposicionamento enquanto T401 manobra.'),
                opcaoV65('arriscado','Enviar T201 e T401 simultaneamente ao terminal','Eleva a ocupação e cria solicitações concorrentes.','arriscado','A capacidade reduzida do destino deve limitar a quantidade de movimentos direcionados à área.','T201 e T401 direcionados simultaneamente ao terminal.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 3 de 4 - Mudança na previsão',
            contexto:'O terminal amplia em quinze minutos a previsão de recebimento. T201 já está regulado em ponto seguro. Como reagir?',
            opcoes:[
                opcaoV65('seguro','Manter T201 protegido e atualizar as áreas envolvidas','Preserva a posição de espera e evita aproximação prematura.','seguro','Uma nova previsão deve ser incorporada ao plano e comunicada aos participantes da operação.','Previsão atualizada e T201 mantido em ponto de regulação.'),
                opcaoV65('moderado','Aproximar T201 um bloco para ganhar tempo','Pode reduzir o tempo futuro, mas diminui a margem de regulação.','moderado','A aproximação precisa considerar espaço, sinais e possibilidade de nova alteração.','T201 aproximado um bloco em condição controlada.'),
                opcaoV65('arriscado','Enviar T201 até o limite do terminal','Ocupa a região e reduz alternativas caso a previsão mude novamente.','arriscado','A chegada antecipada a uma área sem capacidade pode transferir o congestionamento para a linha.','T201 enviado ao limite do terminal sem vaga confirmada.')
            ]
        },
        {
            tipo:'decisao', titulo:'Fase 4 de 4 - Recebimento liberado',
            contexto:'O terminal confirma capacidade e a área de manobra está livre. Qual sequência conclui o cenário?',
            opcoes:[
                opcaoV65('seguro','Estabelecer a rota de T201, acompanhar a ocupação e confirmar a chegada','Executa o movimento com a capacidade de destino confirmada.','seguro','A confirmação do destino permite estabelecer a rota e acompanhar a liberação dos trechos usados.','Rota de T201 estabelecida e recebimento acompanhado.'),
                opcaoV65('moderado','Liberar T201 e iniciar imediatamente outro movimento na região','Aumenta o aproveitamento, mas reduz margem durante a chegada.','moderado','Movimentos adicionais devem respeitar as condições de independência e a ocupação real da área.','Segundo movimento preparado durante o recebimento de T201.'),
                opcaoV65('arriscado','Liberar todos os trens após a confirmação do terminal','Interpreta uma única vaga como capacidade irrestrita.','arriscado','A confirmação de um recebimento não libera automaticamente todos os demais movimentos.','Todos os trens liberados com base em uma única vaga.')
            ]
        }
    ]
});

// Exibe o fundamento didático de cada alternativa escolhida.
exibirResultadoEscolhaV62 = function(decisao, opcao, impacto) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'decisao-overlay resultado-escolha-overlay';
        const perdeuVida = impacto.vidas < 0;
        const classe = opcao.risco || 'neutro';
        overlay.innerHTML = `
          <div class="decisao-modal resultado-escolha resultado-escolha--${classe}">
            <span class="decisao-modal-tag">RESULTADO APÓS A ANIMAÇÃO</span>
            <h3 class="decisao-modal-titulo">${impacto.rotulo}</h3>
            <p class="decisao-modal-contexto"><strong>${opcao.titulo}</strong><br>${opcao.descricao}</p>
            <div class="impact-grid">
              <span><small>Pontos</small><strong>${impacto.pontos >= 0 ? '+' : ''}${impacto.pontos}</strong></span>
              <span><small>Segurança</small><strong>${impacto.seguranca >= 0 ? '+' : ''}${impacto.seguranca}%</strong></span>
              <span><small>Vidas</small><strong>${impacto.vidas}</strong></span>
            </div>
            <div class="learning-box"><strong>Por que isso importa?</strong><p>${opcao.fundamento || 'A decisão deve ser comparada com as condições atuais da malha e com as regras aplicáveis.'}</p></div>
            <p class="resultado-feedback">${perdeuVida ? 'A decisão gerou uma ocorrência crítica simulada. Uma vida foi perdida.' : 'A missão continuará com os impactos registrados.'}</p>
            <button class="relatorio-fechar">Continuar</button>
          </div>`;
        overlay.querySelector('button').addEventListener('click', () => { overlay.remove(); resolve(); });
        document.body.appendChild(overlay);
    });
};


// ===== Revisão v67 - consequências visuais para cada decisão =====
function esperarMovimentoV67(codigoTrem, limiteMs = 18000) {
    return new Promise(resolve => {
        const inicio = Date.now();
        const verificar = () => {
            const trem = trainState[codigoTrem];
            if (!trem || !trem.emMovimento || Date.now() - inicio >= limiteMs) return resolve();
            setTimeout(verificar, 250);
        };
        verificar();
    });
}

function piscarElementoV67(id, estado, vezes = 3) {
    const state = segmentState[id];
    if (!state) return Promise.resolve();
    const anterior = state.estado;
    const tremAnterior = state.trem;
    return new Promise(resolve => {
        let contador = 0;
        const alternar = () => {
            if (contador >= vezes * 2) {
                state.estado = anterior;
                state.trem = tremAnterior;
                pintarSegmento(id, anterior);
                resolve();
                return;
            }
            pintarSegmento(id, contador % 2 === 0 ? estado : anterior);
            contador += 1;
            setTimeout(alternar, 280);
        };
        alternar();
    });
}

function ativarSensorV67(codigo, duracao = 1600) {
    const sensor = sensorState[codigo];
    if (!sensor) return Promise.resolve();
    sensor.element.classList.add('active');
    sensor.element.style.setProperty('fill', CCO_CORES.sensorAtivo, 'important');
    return new Promise(resolve => setTimeout(() => {
        sensor.element.classList.remove('active');
        sensor.element.style.setProperty('fill', CCO_CORES.sensorLivre, 'important');
        resolve();
    }, duracao));
}

async function executarRotaVisualV67(nomeRota, codigoTrem, posicaoInicial = null, limiteMs = 18000) {
    const trem = trainState[codigoTrem];
    if (!ROUTES[nomeRota] || !trem || trem.emMovimento) return false;
    if (posicaoInicial) trem.elemento.setAttribute('transform', posicaoInicial);
    registrarEvento(`Animação da decisão: solicitando ${ROUTES[nomeRota].nome}.`);
    solicitarRota(nomeRota);
    await esperarMovimentoV67(codigoTrem, limiteMs);
    return true;
}

async function executarConsequenciaVisualV67(missaoId, passo, opcao) {
    const fase = Number((passo.titulo.match(/Fase\s+(\d+)/i) || [0, 0])[1]);
    const risco = opcao.risco || 'neutro';
    registrarEvento(`Aplicando consequência visual da Fase ${fase}.`);

    if (missaoId === 'cruzamento_decisao') {
        if (fase === 1) {
            await piscarElementoV67('SEG-AMV-06', risco === 'arriscado' ? ESTADO_SEGMENTO.OCUPADO : ESTADO_SEGMENTO.RESERVADO, 3);
            setSignalVisual('S-L2-04', risco === 'seguro' ? 'verde' : risco === 'moderado' ? 'amarelo' : 'vermelho');
            await ativarSensorV67('SPA2');
        } else if (fase === 2) {
            if (risco === 'seguro') await executarRotaVisualV67('T201_PASSAGEM_PATIO_A_GRAOS', 'T201', 'translate(720,300)');
            else if (risco === 'moderado') await executarRotaVisualV67('T101_INTERMODAL_LINHA1_JANELA', 'T101', 'translate(135,180)');
            else {
                registrarEvento('Tentativa de saída conflitante do T301. O intertravamento deve negar a rota.');
                solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
                await piscarElementoV67('SEG-L2-B07', ESTADO_SEGMENTO.OCUPADO, 3);
            }
        } else if (fase === 3) {
            await ativarSensorV67('S207', 2200);
            await piscarElementoV67('SEG-L2-B07', risco === 'arriscado' ? ESTADO_SEGMENTO.INDISPONIVEL : ESTADO_SEGMENTO.RESERVADO, 3);
        } else if (fase === 4) {
            if (risco === 'seguro') await executarRotaVisualV67('T301_SAIDA_LESTE_APOS_ENCONTRO', 'T301', 'translate(1080,390)');
            else if (risco === 'moderado') await ativarSensorV67('SPA2', 2200);
            else {
                solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
                await piscarElementoV67('SEG-AMV-06', ESTADO_SEGMENTO.OCUPADO, 4);
            }
        }
        return;
    }

    if (missaoId === 'prioridade_exportacao') {
        if (fase === 1) {
            setSignalVisual('S-L1-01', risco === 'seguro' ? 'verde' : 'amarelo');
            setSignalVisual('S-L2-01', risco === 'arriscado' ? 'vermelho' : 'verde');
            await Promise.all([piscarElementoV67('SEG-L1-B01', ESTADO_SEGMENTO.RESERVADO, 2), piscarElementoV67('SEG-L2-B01', ESTADO_SEGMENTO.RESERVADO, 2)]);
        } else if (fase === 2) {
            if (risco === 'seguro') {
                await Promise.all([
                    executarRotaVisualV67('T101_INTERMODAL_LINHA1_JANELA','T101','translate(135,180)',16000),
                    executarRotaVisualV67('T201_PASSAGEM_PATIO_A_GRAOS','T201','translate(630,300)',16000)
                ]);
            } else if (risco === 'moderado') await executarRotaVisualV67('T201_PASSAGEM_PATIO_A_GRAOS','T201','translate(630,300)');
            else await executarRotaVisualV67('T101_INTERMODAL_LINHA1_JANELA','T101','translate(135,180)');
        } else if (fase === 3) {
            await piscarElementoV67('SEG-L2-B06', risco === 'arriscado' ? ESTADO_SEGMENTO.OCUPADO : ESTADO_SEGMENTO.INDISPONIVEL, 4);
            setSignalVisual('S-L2-04', risco === 'seguro' ? 'amarelo' : 'vermelho');
        } else if (fase === 4) {
            if (risco === 'seguro') await executarRotaVisualV67('T201_APROXIMACAO_TERMINAL','T201','translate(630,300)');
            else await piscarElementoV67('SEG-L2-B08', risco === 'arriscado' ? ESTADO_SEGMENTO.OCUPADO : ESTADO_SEGMENTO.RESERVADO, 4);
        }
        return;
    }

    if (missaoId === 'falha_amv_decisao') {
        if (fase === 1) {
            const st = segmentState['SEG-AMV-07'];
            if (st) { st.estado = ESTADO_SEGMENTO.INDISPONIVEL; st.trem = null; }
            pintarSegmento('SEG-AMV-07', ESTADO_SEGMENTO.INDISPONIVEL);
            setSignalVisual('S-PA-01','vermelho');
            await piscarElementoV67('SEG-AMV-07', ESTADO_SEGMENTO.OCUPADO, 4);
        } else if (fase === 2) {
            if (risco === 'seguro') await executarRotaVisualV67('T101_INTERMODAL_LINHA1_JANELA','T101','translate(135,180)');
            else if (risco === 'moderado') await piscarElementoV67('SEG-L1-B04', ESTADO_SEGMENTO.RESERVADO, 3);
            else solicitarRota('T302_FALHA_AMV');
        } else if (fase === 3) {
            await ativarSensorV67('SPA5', 2200);
            await piscarElementoV67('SEG-AMV-07', ESTADO_SEGMENTO.INDISPONIVEL, 4);
        } else if (fase === 4) {
            if (risco !== 'arriscado') {
                const st = segmentState['SEG-AMV-07'];
                if (st) { st.estado = ESTADO_SEGMENTO.LIVRE; st.trem = null; }
                pintarSegmento('SEG-AMV-07', ESTADO_SEGMENTO.LIVRE);
                setSignalVisual('S-PA-01','verde');
                await executarRotaVisualV67('T302_SAIDA_APOS_REPARO_AMV07','T302','translate(850,490)');
            } else await piscarElementoV67('SEG-AMV-07', ESTADO_SEGMENTO.OCUPADO, 4);
        }
        return;
    }

    if (missaoId === 'janela_manutencao_decisao') {
        if (fase === 1) await Promise.all([piscarElementoV67('SEG-L2-B05',ESTADO_SEGMENTO.RESERVADO,2),piscarElementoV67('SEG-L2-B06',ESTADO_SEGMENTO.RESERVADO,2)]);
        else if (fase === 2) {
            const estado = risco === 'arriscado' ? ESTADO_SEGMENTO.LIVRE : ESTADO_SEGMENTO.INDISPONIVEL;
            const st=segmentState['SEG-L2-B06']; if(st){st.estado=estado;st.trem=null;} pintarSegmento('SEG-L2-B06',estado); setSignalVisual('S-L2-04','vermelho');
            await esperar(1400);
        } else if (fase === 3) {
            if (risco === 'seguro') await executarRotaVisualV67('T101_DESVIO_MANUTENCAO','T101','translate(135,180)');
            else if (risco === 'moderado') await piscarElementoV67('SEG-L1-B05',ESTADO_SEGMENTO.RESERVADO,3);
            else solicitarRota('T201_CARGA_LINHA2');
        } else if (fase === 4) {
            const estado = risco === 'seguro' ? ESTADO_SEGMENTO.LIVRE : ESTADO_SEGMENTO.INDISPONIVEL;
            const st=segmentState['SEG-L2-B06']; if(st){st.estado=estado;st.trem=null;} pintarSegmento('SEG-L2-B06',estado);
            setSignalVisual('S-L2-04',risco === 'seguro' ? 'verde' : 'vermelho'); await esperar(1500);
        }
        return;
    }

    if (missaoId === 'fila_terminal_decisao') {
        if (fase === 1) await Promise.all([piscarElementoV67('SEG-PB1-B01',ESTADO_SEGMENTO.RESERVADO,2),piscarElementoV67('SEG-L2-B08',ESTADO_SEGMENTO.RESERVADO,2)]);
        else if (fase === 2) {
            if (risco === 'seguro') await executarRotaVisualV67('T401_RECOLHIMENTO_PATIO_B','T401','translate(1350,300)');
            else if (risco === 'moderado') await executarRotaVisualV67('T501_PERA_COMPLETA','T501','translate(450,300)',16000);
            else {
                solicitarRota('T401_RECOLHIMENTO_PATIO_B');
                solicitarRota('T201_APROXIMACAO_TERMINAL');
                await piscarElementoV67('SEG-L2-B08',ESTADO_SEGMENTO.OCUPADO,3);
            }
        } else if (fase === 3) {
            await piscarElementoV67('SEG-L2-B07',risco === 'arriscado' ? ESTADO_SEGMENTO.OCUPADO : ESTADO_SEGMENTO.RESERVADO,4);
            setSignalVisual('S-L2-05',risco === 'seguro' ? 'vermelho' : 'amarelo');
        } else if (fase === 4) {
            if (risco === 'seguro') await executarRotaVisualV67('T201_APROXIMACAO_TERMINAL','T201','translate(630,300)');
            else await piscarElementoV67('SEG-PB1-B01',risco === 'arriscado' ? ESTADO_SEGMENTO.OCUPADO : ESTADO_SEGMENTO.RESERVADO,4);
        }
    }
}


// ===== Revisão v68 - animação garantida entre as fases =====
function mostrarAvisoMapaV68(texto) {
    let aviso = document.getElementById('mission-map-notice');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'mission-map-notice';
        aviso.className = 'mission-map-notice';
        document.querySelector('.synoptic-panel')?.appendChild(aviso);
    }
    aviso.textContent = texto;
    aviso.classList.add('visible');
    return new Promise(resolve => setTimeout(() => {
        aviso.classList.remove('visible');
        resolve();
    }, 900));
}

function animarElementoNoSegmentoV68(trem, elemento, duracao) {
    return new Promise(resolve => {
        const comprimento = elemento.getTotalLength();
        let inicio = null;
        function quadro(tempo) {
            if (!inicio) inicio = tempo;
            const progresso = Math.min((tempo - inicio) / duracao, 1);
            const suave = -(Math.cos(Math.PI * progresso) - 1) / 2;
            const distancia = comprimento * suave;
            const ponto = elemento.getPointAtLength(distancia);
            const antes = elemento.getPointAtLength(Math.max(0, distancia - 2));
            const depois = elemento.getPointAtLength(Math.min(comprimento, distancia + 2));
            const angulo = Math.atan2(depois.y - antes.y, depois.x - antes.x) * 180 / Math.PI;
            trem.elemento.setAttribute('transform', `translate(${ponto.x.toFixed(2)}, ${ponto.y.toFixed(2)}) rotate(${angulo.toFixed(2)})`);
            trazerTrensParaFrente();
            if (progresso < 1) requestAnimationFrame(quadro);
            else resolve();
        }
        requestAnimationFrame(quadro);
    });
}

async function animarTremDidaticoV68(codigoTrem, segmentos, duracaoPorTrecho = 1050) {
    const trem = trainState[codigoTrem];
    const validos = segmentos.filter(id => document.getElementById(id));
    if (!trem || validos.length === 0) return;

    trem.emMovimento = true;
    mudarStatusTrem(codigoTrem, 'circulando');
    registrarEvento(`${codigoTrem}: iniciando consequência visual da decisão.`);

    // Mostra antecipadamente a rota que será percorrida.
    validos.forEach(id => {
        const estado = segmentState[id];
        if (estado) {
            estado.estado = ESTADO_SEGMENTO.RESERVADO;
            estado.trem = codigoTrem;
        }
        pintarSegmento(id, ESTADO_SEGMENTO.RESERVADO);
    });
    await new Promise(resolve => setTimeout(resolve, 650));

    for (let i = 0; i < validos.length; i += 1) {
        const id = validos[i];
        const elemento = document.getElementById(id);
        const estado = segmentState[id];
        if (estado) {
            estado.estado = ESTADO_SEGMENTO.OCUPADO;
            estado.trem = codigoTrem;
        }
        pintarSegmento(id, ESTADO_SEGMENTO.OCUPADO);
        await animarElementoNoSegmentoV68(trem, elemento, duracaoPorTrecho);
        if (i > 0) {
            const anteriorId = validos[i - 1];
            const anterior = segmentState[anteriorId];
            if (anterior) {
                anterior.estado = ESTADO_SEGMENTO.LIVRE;
                anterior.trem = null;
            }
            pintarSegmento(anteriorId, ESTADO_SEGMENTO.LIVRE);
        }
        await new Promise(resolve => setTimeout(resolve, 180));
    }

    const ultimoId = validos[validos.length - 1];
    const ultimo = segmentState[ultimoId];
    if (ultimo) {
        ultimo.estado = ESTADO_SEGMENTO.LIVRE;
        ultimo.trem = null;
    }
    pintarSegmento(ultimoId, ESTADO_SEGMENTO.LIVRE);
    trem.emMovimento = false;
    mudarStatusTrem(codigoTrem, 'aguardando');
    registrarEvento(`${codigoTrem}: consequência visual concluída.`);
}

async function mostrarFalhaVisualV68(segmento, sinal, texto) {
    registrarEvento(texto);
    setSignalVisual(sinal, 'vermelho');
    const estado = segmentState[segmento];
    const anterior = estado?.estado || ESTADO_SEGMENTO.LIVRE;
    for (let i = 0; i < 6; i += 1) {
        pintarSegmento(segmento, i % 2 === 0 ? ESTADO_SEGMENTO.INDISPONIVEL : anterior);
        await new Promise(resolve => setTimeout(resolve, 330));
    }
    pintarSegmento(segmento, anterior);
}

async function executarConsequenciaVisualV68(missaoId, passo, opcao) {
    const fase = Number((passo.titulo.match(/Fase\s+(\d+)/i) || [0, 0])[1]);
    const risco = opcao.risco || 'neutro';
    await mostrarAvisoMapaV68(`Acompanhe no mapa: consequência da Fase ${fase}`);

    if (missaoId === 'cruzamento_decisao') {
        if (fase === 1) {
            await mostrarFalhaVisualV68('SEG-AMV-06', 'S-PA-02', risco === 'arriscado' ? 'Verificação incompleta: AMV-06 mantido restritivo.' : 'AMV-06, sinal e via de cruzamento sendo conferidos.');
        } else if (fase === 2) {
            if (risco === 'seguro') await animarTremDidaticoV68('T201',['SEG-L2-B04','SEG-L2-B05','SEG-L2-B06','SEG-L2-B07','SEG-L2-B08'],900);
            else if (risco === 'moderado') await animarTremDidaticoV68('T101',['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04'],900);
            else await mostrarFalhaVisualV68('SEG-L2-B07','S-L2-04','Conflito detectado: saída de T301 negada.');
        } else if (fase === 3) {
            await mostrarFalhaVisualV68('SEG-L2-B07','S-L2-04','Indicação intermitente do sensor S207 em análise.');
        } else if (fase === 4) {
            if (risco === 'arriscado') await mostrarFalhaVisualV68('SEG-AMV-06','S-PA-02','Saída antecipada de T301 bloqueada.');
            else await animarTremDidaticoV68('T301',['SEG-PA1-B02','SEG-AMV-06','SEG-L2-B06','SEG-L2-B07'],1050);
        }
        return;
    }

    if (missaoId === 'prioridade_exportacao') {
        if (fase === 1) await Promise.all([
            piscarElementoV67('SEG-L1-B01',ESTADO_SEGMENTO.RESERVADO,3),
            piscarElementoV67('SEG-L2-B01',ESTADO_SEGMENTO.RESERVADO,3)
        ]);
        else if (fase === 2 && risco === 'seguro') await Promise.all([
            animarTremDidaticoV68('T101',['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04'],900),
            animarTremDidaticoV68('T201',['SEG-L2-B01','SEG-L2-B02','SEG-L2-B03','SEG-L2-B04'],900)
        ]);
        else if (fase === 2) await animarTremDidaticoV68(risco === 'moderado' ? 'T201' : 'T101',risco === 'moderado' ? ['SEG-L2-B01','SEG-L2-B02','SEG-L2-B03'] : ['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03'],950);
        else if (fase === 3) await mostrarFalhaVisualV68('SEG-L2-B06','S-L2-04','Restrição temporária aplicada à Linha 2.');
        else if (fase === 4 && risco !== 'arriscado') await animarTremDidaticoV68('T201',['SEG-L2-B06','SEG-L2-B07','SEG-L2-B08'],1050);
        else await mostrarFalhaVisualV68('SEG-L2-B08','S-L2-05','Entrada no terminal negada por falta de capacidade.');
        return;
    }

    if (missaoId === 'falha_amv_decisao') {
        if (fase === 1 || fase === 3) await mostrarFalhaVisualV68('SEG-AMV-07','S-PA-01','AMV-07 sem confirmação de posição.');
        else if (fase === 2 && risco === 'seguro') await animarTremDidaticoV68('T101',['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04'],950);
        else if (fase === 2) await mostrarFalhaVisualV68('SEG-AMV-07','S-PA-01','Movimento dependente do AMV-07 permanece bloqueado.');
        else if (fase === 4 && risco !== 'arriscado') await animarTremDidaticoV68('T302',['SEG-PA3-B01','SEG-AMV-07','SEG-L2-B04','SEG-L2-B05'],1050);
        else await mostrarFalhaVisualV68('SEG-AMV-07','S-PA-01','Retomada sem conferência foi impedida.');
        return;
    }

    if (missaoId === 'janela_manutencao_decisao') {
        if (fase <= 2) await mostrarFalhaVisualV68('SEG-L2-B06','S-L2-04',fase === 1 ? 'Limites da janela sendo conferidos.' : 'L2-B06 entregue à manutenção.');
        else if (fase === 3 && risco === 'seguro') await animarTremDidaticoV68('T101',['SEG-L1-B01','SEG-L1-B02','SEG-L1-B03','SEG-L1-B04','SEG-L1-B05'],900);
        else if (fase === 3) await mostrarFalhaVisualV68('SEG-L2-B06','S-L2-04','Rota pela área de manutenção indisponível.');
        else if (fase === 4 && risco === 'seguro') {
            pintarSegmento('SEG-L2-B06',ESTADO_SEGMENTO.LIVRE); setSignalVisual('S-L2-04','verde'); await new Promise(r=>setTimeout(r,1800));
        } else await mostrarFalhaVisualV68('SEG-L2-B06','S-L2-04','Trecho permanece interditado até a conferência final.');
        return;
    }

    if (missaoId === 'fila_terminal_decisao') {
        if (fase === 1) await Promise.all([piscarElementoV67('SEG-PB1-B01',ESTADO_SEGMENTO.RESERVADO,3),piscarElementoV67('SEG-L2-B08',ESTADO_SEGMENTO.RESERVADO,3)]);
        else if (fase === 2 && risco === 'seguro') await animarTremDidaticoV68('T401',['SEG-AMV-09','SEG-PB1-B01'],1200);
        else if (fase === 2 && risco === 'moderado') await animarTremDidaticoV68('T501',['SEG-AMV-11','SEG-PERA-B01','SEG-PERA-B02'],900);
        else if (fase === 2) await mostrarFalhaVisualV68('SEG-L2-B08','S-L2-05','Saturação da área de terminal detectada.');
        else if (fase === 3) await mostrarFalhaVisualV68('SEG-L2-B07','S-L2-04','T201 mantido em ponto de regulação.');
        else if (fase === 4 && risco === 'seguro') await animarTremDidaticoV68('T201',['SEG-L2-B06','SEG-L2-B07','SEG-L2-B08'],1050);
        else await mostrarFalhaVisualV68('SEG-PB1-B01','S-PB-01','Movimentos adicionais retidos na área do terminal.');
    }
}


// ===== Revisão v69 - fluxo único, animação antes do resultado e reset robusto =====
let tokenMissaoV69 = 0;

function resetarMissaoV69() {
    tokenMissaoV69 += 1;
    execucaoAtualId += 1;
    window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
    if (typeof abortarMovimentosV44 === 'function') abortarMovimentosV44();
    document.querySelectorAll('.decisao-overlay, .relatorio-overlay, .resultado-escolha-overlay, .game-over-overlay').forEach(el => el.remove());
    document.getElementById('mission-map-notice')?.remove();
    resetarCenario(false);
    relatorioMissaoAtual = null;
    Object.assign(GAME_DECISAO, { pontos:100, seguranca:100, vidas:3, sequencia:0, iniciado:false, encerrado:false, historico:[] });
    atualizarHudV62();
    document.querySelectorAll('.btn-missao').forEach(btn => btn.classList.remove('active'));
    registrarEvento('Missão resetada. Selecione uma missão e clique em Iniciar missão.');
}

function instalarResetMissaoV69() {
    const botao = document.querySelector('[data-action="reset-missao"]');
    if (!botao || botao.dataset.resetV69 === 'true') return;
    botao.dataset.resetV69 = 'true';
    botao.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        resetarMissaoV69();
    }, true);
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', instalarResetMissaoV69);
else instalarResetMissaoV69();
