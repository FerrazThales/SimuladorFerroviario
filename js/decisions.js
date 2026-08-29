
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
                tipo: 'decisão',
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
                tipo: 'decisão',
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
            tipo:'decisão',
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
            tipo:'decisão', titulo:'AMV-07 sem confirmação de posição',
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
            tipo:'decisão', titulo:'Interdição programada em L2-B06',
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
            tipo:'decisão', titulo:'Terminal com recebimento restrito',
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
        } else if (passo.tipo === 'decisão') {
            await esperarMalhaPararV45();
            window.CCO_MISSAO_AGUARDANDO_DECISAO = true;
            const opcaoEscolhida = await perguntarDecisao(passo);
            window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
            if (meuId !== execucaoAtualId) return;
            registrarEvento(`Decisão registrada: ${opcaoEscolhida.titulo}`);
            registrarEscolhaRelatorio(passo.titulo, opcaoEscolhida);
            if (opcaoEscolhida.efeito) await opcaoEscolhida.efeito();
            await esperarMalhaPararV45();
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
    document.querySelectorAll('.btn-missão').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.decisão-overlay, .relatório-overlay').forEach(el => el.remove());
}

function perguntarDecisao(decisao) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'decisão-overlay';
        overlay.innerHTML = `
            <div class="decisão-modal">
                <span class="decisão-modal-tag">DECISÃO OPERACIONAL</span>
                <h3 class="decisão-modal-titulo">${decisao.titulo}</h3>
                <p class="decisão-modal-contexto">${decisao.contexto}</p>
                <div class="decisão-modal-opcoes"></div>
            </div>
        `;
        const opcoesEl = overlay.querySelector('.decisão-modal-opcoes');
        decisao.opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.className = `decisão-opcao decisão-opcao--${opcao.risco || 'neutro'}`;
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
    overlay.className = 'relatório-overlay';
    overlay.innerHTML = `
        <div class="relatório-modal">
            <span class="decisão-modal-tag">RELATÓRIO DA MISSÃO</span>
            <h3 class="decisão-modal-titulo">${relatorioMissaoAtual.nome}</h3>
            <ul class="relatório-lista">${linhas}</ul>
            <button class="relatório-fechar">Fechar</button>
        </div>
    `;
    overlay.querySelector('.relatório-fechar').addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

function marcarMissaoAtiva(missaoId) {
    document.querySelectorAll('.btn-missão').forEach(btn => btn.classList.toggle('active', btn.dataset.missao === missaoId));
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
        .decisão-overlay,.relatório-overlay{position:fixed;inset:0;background:rgba(3,4,6,.72);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
        .decisão-modal,.relatório-modal{width:min(560px,100%);background:#0e1116;border:1px solid rgba(217,184,74,.5);border-radius:14px;padding:22px 24px;box-shadow:0 24px 70px rgba(0,0,0,.55)}
        .decisão-modal-tag{color:#e2c26b;font-size:10.5px;font-weight:700;letter-spacing:1.2px}.decisão-modal-titulo{color:#fff;font-size:17px;margin:8px 0 10px}.decisão-modal-contexto{color:#c7cdd3;font-size:12.5px;line-height:1.5;margin-bottom:16px}.decisão-modal-opcoes{display:flex;flex-direction:column;gap:9px}
        .decisão-opcao{text-align:left;border-radius:10px;padding:10px 12px;cursor:pointer;background:#141821;color:#fff;display:flex;flex-direction:column;gap:3px;border:1px solid #2a323d;transition:transform .12s ease,border-color .12s ease}.decisão-opcao strong{font-size:12.5px}.decisão-opcao span{font-size:11px;color:#a7b0b8}.decisão-opcao:hover{transform:translateY(-1px)}.decisão-opcao--seguro:hover{border-color:#36d979}.decisão-opcao--moderado:hover{border-color:#d9b84a}.decisão-opcao--arriscado:hover{border-color:#c94b4b}
        .relatório-lista{list-style:none;display:grid;gap:7px;margin:6px 0 14px;padding:0}.relatório-lista li{font-size:12px;color:#dfe4e8}.tag-risco{font-size:9.5px;text-transform:uppercase;padding:2px 6px;border-radius:999px;margin-left:6px}.tag-risco--seguro{background:rgba(54,217,121,.18);color:#8ff0b8}.tag-risco--moderado{background:rgba(217,184,74,.18);color:#f0e0a0}.tag-risco--arriscado{background:rgba(201,75,75,.18);color:#f5b6b6}.relatório-fechar{width:100%;padding:9px;border-radius:9px;border:1px solid rgba(217,184,74,.5);background:#1c1305;color:#f5e6bc;cursor:pointer;font-size:12px;font-weight:650}
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
        overlay.className = 'decisão-overlay resultado-escolha-overlay';
        const perdeuVida = impacto.vidas < 0;
        const classe = opcao.risco || 'neutro';
        overlay.innerHTML = `
          <div class="decisão-modal resultado-escolha resultado-escolha--${classe}">
            <span class="decisão-modal-tag">RESULTADO DA DECISÃO</span>
            <h3 class="decisão-modal-titulo">${impacto.rotulo}</h3>
            <p class="decisão-modal-contexto"><strong>${opcao.titulo}</strong><br>${opcao.descricao}</p>
            <div class="impact-grid">
              <span><small>Pontos</small><strong>${impacto.pontos >= 0 ? '+' : ''}${impacto.pontos}</strong></span>
              <span><small>Segurança</small><strong>${impacto.seguranca >= 0 ? '+' : ''}${impacto.seguranca}%</strong></span>
              <span><small>Vidas</small><strong>${impacto.vidas}</strong></span>
            </div>
            <p class="resultado-feedback">${perdeuVida ? 'A decisão gerou uma ocorrência crítica simulada. Uma vida foi perdida.' : 'A missão continuará com os impactos registrados.'}</p>
            <button class="relatório-fechar">Continuar</button>
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
    overlay.className = 'relatório-overlay game-over-overlay';
    overlay.innerHTML = `
      <div class="relatório-modal game-over-modal">
        <span class="decisão-modal-tag">MISSÃO ENCERRADA</span>
        <h3 class="decisão-modal-titulo">Operação não concluída</h3>
        <p class="decisão-modal-contexto">${motivo}</p>
        <div class="impact-grid impact-grid--final">
          <span><small>Pontuação</small><strong>${GAME_DECISAO.pontos}</strong></span>
          <span><small>Segurança</small><strong>${GAME_DECISAO.seguranca}%</strong></span>
          <span><small>Vidas</small><strong>${GAME_DECISAO.vidas}</strong></span>
        </div>
        <button class="relatório-fechar">Tentar novamente</button>
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
        } else if (passo.tipo === 'decisão') {
            await esperarMalhaPararV45();
            window.CCO_MISSAO_AGUARDANDO_DECISAO = true;
            const opcaoEscolhida = await perguntarDecisao(passo);
            window.CCO_MISSAO_AGUARDANDO_DECISAO = false;
            if (meuId !== execucaoAtualId) return;
            const impacto = avaliarEscolhaV62(passo, opcaoEscolhida);
            registrarEvento(`Decisão registrada: ${opcaoEscolhida.titulo} | ${impacto.pontos >= 0 ? '+' : ''}${impacto.pontos} pontos`);
            registrarEscolhaRelatorio(passo.titulo, opcaoEscolhida);
            await exibirResultadoEscolhaV62(passo, opcaoEscolhida, impacto);
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
            await esperarMalhaPararV45();
        }
    }
    if (meuId !== execucaoAtualId) return;
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
    overlay.className = 'relatório-overlay';
    overlay.innerHTML = `
      <div class="relatório-modal">
        <span class="decisão-modal-tag">RELATÓRIO DA MISSÃO</span>
        <h3 class="decisão-modal-titulo">${relatorioMissaoAtual.nome}</h3>
        <div class="impact-grid impact-grid--final">
          <span><small>Pontuação</small><strong>${GAME_DECISAO.pontos}</strong></span>
          <span><small>Segurança</small><strong>${GAME_DECISAO.seguranca}%</strong></span>
          <span><small>Classificação</small><strong>${classificacao}</strong></span>
        </div>
        <ul class="relatório-lista">${linhas}</ul>
        <p class="resultado-feedback">Resultado simplificado para estudo pessoal. Não representa avaliação ou procedimento oficial.</p>
        <button class="relatório-fechar">Fechar</button>
      </div>`;
    overlay.querySelector('.relatório-fechar').addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
};

window.addEventListener('DOMContentLoaded', atualizarHudV62);

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', instalarBarraDeMissoes);
else instalarBarraDeMissoes();
