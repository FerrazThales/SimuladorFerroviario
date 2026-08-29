
// Modo Decisao - CCO Ferroviario de Carga - v48
// Este arquivo nao dispara rota antes da escolha do usuario.
'use strict';

ROUTES.T201_PASSAGEM_PATIO_A_GRAOS = {
    trem: 'T201',
    nome: 'T201 comboio de graos pela principal junto ao Patio A',
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
        nome: 'Missao 1 - Encontro operacional no Patio A',
        descricao: 'T301 esta parado na desviada PA1. T201 aguarda autorizacao para seguir pela Linha 2 principal. Nenhum trem sera movimentado antes da sua decisao.',
        posicoesIniciais: {
            T201: 'translate(720,230)',
            T301: 'translate(635,350)',
            T101: 'translate(135,130)',
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
                contexto: 'T301 ocupa a desviada PA1 no Patio A. T201 esta parado aguardando autorizacao para seguir pela Linha 2 principal. Qual sequencia operacional voce autoriza?',
                opcoes: [
                    {
                        id: 'seguro',
                        titulo: 'Manter T301 retido e liberar T201 pela principal',
                        descricao: 'Autoriza o comboio carregado pela principal e so depois libera a composicao vazia.',
                        risco: 'seguro',
                        efeito: async () => {
                            registrarEvento('CCO: decisao tomada. Autorizando T201 pela Linha 2 principal.');
                            solicitarRota('T201_PASSAGEM_PATIO_A_GRAOS');
                            await esperarTremPararV45('T201');
                            registrarEvento('CCO: T201 liberou a principal. Autorizando saida de T301.');
                            solicitarRota('T301_SAIDA_LESTE_APOS_ENCONTRO');
                            await esperarTremPararV45('T301');
                        },
                    },
                    {
                        id: 'moderado',
                        titulo: 'Liberar T201 e adiantar T101 na Linha 1',
                        descricao: 'Usa a Linha 1 em paralelo para preservar janela comercial, mantendo T301 retido ate a principal ficar livre.',
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
                        titulo: 'Antecipar saida de T301 antes do comboio carregado',
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
                contexto: 'Durante a circulacao planejada, aparece um alerta de sensor. Como voce conduz a operacao?',
                opcoes: [
                    { id: 'seguro', titulo: 'Reduzir velocidade e programar inspecao', descricao: 'Prioriza seguranca e rastreabilidade.', risco: 'seguro', efeito: () => registrarEvento('CCO: velocidade restrita e inspecao programada.') },
                    { id: 'moderado', titulo: 'Seguir com monitoramento reforcado', descricao: 'Mantem fluidez com acompanhamento do CCO.', risco: 'moderado', efeito: () => registrarEvento('CCO: monitoramento reforcado mantido.') },
                    { id: 'arriscado', titulo: 'Ignorar alerta para cumprir janela', descricao: 'Prioriza janela, mas eleva risco operacional.', risco: 'arriscado', efeito: () => registrarEvento('ALERTA: alerta tecnico ignorado.') },
                ],
            },
        ],
    },
    prioridade_exportacao: {
        nome: 'Missao 2 - Prioridade de exportacao',
        descricao: 'Dois trens solicitam faixa simultanea. O despachante deve equilibrar janela comercial, peso do comboio e capacidade da linha dupla.',
        posicoesIniciais: { T101:'translate(135,130)', T201:'translate(135,230)' },
        ocupacoesIniciais: [],
        passos: [{
            tipo:'decisao',
            titulo:'Definicao de prioridade no corredor',
            contexto:'T201 transporta carga de exportacao com janela de terminal. T101 e intermodal e tambem possui compromisso comercial. As linhas 1 e 2 estao livres. Qual plano deve ser autorizado?',
            opcoes:[
                { id:'seguro', titulo:'Liberar os dois em linhas independentes', descricao:'Usa a capacidade da linha dupla e acompanha ambos os movimentos.', risco:'seguro', efeito:async()=>{ solicitarRota('T201_CARGA_LINHA2'); await esperar(800); solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T201'); await esperarTremPararV45('T101'); } },
                { id:'moderado', titulo:'Priorizar T201 e reter T101', descricao:'Garante a janela de exportacao, mas reduz o aproveitamento da linha dupla.', risco:'moderado', efeito:async()=>{ solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T101'); } },
                { id:'arriscado', titulo:'Liberar T101 e atrasar o comboio carregado', descricao:'Preserva o intermodal, mas arrisca a janela do terminal.', risco:'arriscado', efeito:async()=>{ solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T101'); solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); } }
            ]
        }]
    },
    falha_amv_decisao: {
        nome:'Missao 3 - Falha de AMV e contingencia',
        descricao:'Uma falha de AMV exige protecao da area, replanejamento e escolha de rota segura.',
        posicoesIniciais:{ T302:'translate(790,370)', T101:'translate(135,130)' },
        ocupacoesIniciais:[],
        passos:[{
            tipo:'decisao', titulo:'AMV-07 sem confirmacao de posicao',
            contexto:'T302 solicita saida do patio, mas o AMV-07 perdeu confirmacao. T101 pode circular pela Linha 1. Qual acao deve ser tomada?',
            opcoes:[
                { id:'seguro', titulo:'Bloquear T302 e liberar T101 pela Linha 1', descricao:'Mantem a area da falha protegida e preserva circulacao independente.', risco:'seguro', efeito:async()=>{ SEGMENTOS_INDISPONIVEIS_INICIAIS.add('SEG-AMV-07'); pintarSegmento('SEG-AMV-07',ESTADO_SEGMENTO.INDISPONIVEL); solicitarRota('T101_EXPRESSO_LINHA1'); await esperarTremPararV45('T101'); } },
                { id:'moderado', titulo:'Aguardar verificacao local antes de qualquer movimento', descricao:'Suspende a operacao ate confirmacao de campo.', risco:'moderado', efeito:async()=>{ registrarEvento('CCO: equipe local acionada para verificar AMV-07.'); await esperar(2200); } },
                { id:'arriscado', titulo:'Tentar autorizar T302 mesmo sem confirmacao', descricao:'A rota deve ser negada pela indisponibilidade do aparelho.', risco:'arriscado', efeito:async()=>{ SEGMENTOS_INDISPONIVEIS_INICIAIS.add('SEG-AMV-07'); const st=segmentState['SEG-AMV-07']; if(st){st.estado=ESTADO_SEGMENTO.INDISPONIVEL;st.trem=null;} pintarSegmento('SEG-AMV-07',ESTADO_SEGMENTO.INDISPONIVEL); solicitarRota('T302_FALHA_AMV'); await esperar(1200); } }
            ]
        }]
    },
    janela_manutencao_decisao: {
        nome:'Missao 4 - Janela de manutencao',
        descricao:'A manutencao precisa interditar um bloco sem interromper toda a producao do corredor.',
        posicoesIniciais:{ T101:'translate(135,130)', T201:'translate(135,230)' },
        ocupacoesIniciais:[],
        passos:[{
            tipo:'decisao', titulo:'Interdicao programada em L2-B06',
            contexto:'A manutencao solicita bloqueio de L2-B06. T101 esta pronto para circular e T201 deve ser regulado. Como organizar a janela?',
            opcoes:[
                { id:'seguro', titulo:'Interditar L2-B06 e desviar fluxo pela Linha 1', descricao:'Protege a equipe e mantem uma faixa operacional.', risco:'seguro', efeito:async()=>{ SEGMENTOS_INDISPONIVEIS_INICIAIS.add('SEG-L2-B06'); const st=segmentState['SEG-L2-B06']; if(st){st.estado=ESTADO_SEGMENTO.INDISPONIVEL;st.trem=null;} pintarSegmento('SEG-L2-B06',ESTADO_SEGMENTO.INDISPONIVEL); solicitarRota('T101_DESVIO_MANUTENCAO'); await esperarTremPararV45('T101'); } },
                { id:'moderado', titulo:'Adiar manutencao ate T201 liberar o trecho', descricao:'Preserva a circulacao atual, mas reduz a janela da equipe.', risco:'moderado', efeito:async()=>{ solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); registrarEvento('CCO: trecho entregue a manutencao apos passagem do T201.'); } },
                { id:'arriscado', titulo:'Liberar T201 durante a preparacao da manutencao', descricao:'Cria risco de conflito com a area em processo de bloqueio.', risco:'arriscado', efeito:async()=>{ registrarEvento('ALERTA: tentativa de circular durante preparacao de bloqueio.'); solicitarRota('T201_CARGA_LINHA2'); await esperarTremPararV45('T201'); } }
            ]
        }]
    },
    fila_terminal_decisao: {
        nome:'Missao 5 - Fila no terminal',
        descricao:'O terminal reduz a capacidade de recebimento e o CCO precisa regular chegadas.',
        posicoesIniciais:{ T201:'translate(720,230)', T401:'translate(1510,330)', T501:'translate(760,690)' },
        ocupacoesIniciais:[],
        passos:[{
            tipo:'decisao', titulo:'Terminal com recebimento restrito',
            contexto:'T401 ocupa a area de manobra, T201 se aproxima carregado e T501 pode usar a pera. Qual plano evita saturacao?',
            opcoes:[
                { id:'seguro', titulo:'Concluir manobra de T401 e depois aproximar T201', descricao:'Evita sobreposicao na area de terminal.', risco:'seguro', efeito:async()=>{ solicitarRota('T401_RECOLHIMENTO_PATIO_B'); await esperarTremPararV45('T401'); solicitarRota('T201_APROXIMACAO_TERMINAL'); await esperarTremPararV45('T201'); } },
                { id:'moderado', titulo:'Regular T501 na pera e aproximar T201', descricao:'Usa a pera como recurso de regulacao e mantem o patio monitorado.', risco:'moderado', efeito:async()=>{ solicitarRota('T501_PERA_COMPLETA'); await esperar(1000); solicitarRota('T201_APROXIMACAO_TERMINAL'); await esperarTremPararV45('T501'); await esperarTremPararV45('T201'); } },
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
            registrarEvento(`Decisao do despachante: ${opcaoEscolhida.titulo}`);
            registrarEscolhaRelatorio(passo.titulo, opcaoEscolhida);
            if (opcaoEscolhida.efeito) await opcaoEscolhida.efeito();
            await esperarMalhaPararV45();
        }
    }

    if (meuId !== execucaoAtualId) return;
    registrarEvento(`Missao concluida: ${missao.nome}`);
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
                <span class="decisao-modal-tag">DECISAO DO DESPACHANTE</span>
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
            <span class="decisao-modal-tag">RELATORIO DE OPERACAO</span>
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
    if (document.getElementById('decisao-styles')) return;
    const style = document.createElement('style');
    style.id = 'decisao-styles';
    style.textContent = `
        .decisao-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 20px;background:rgba(26,16,6,.92);border-bottom:1px solid rgba(217,184,74,.35)}
        .tab-label--decisao{color:#e2c26b;font-size:11px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;margin-right:4px}
        .btn-missao{height:32px;border:1px solid rgba(217,184,74,.45);border-radius:9px;background:linear-gradient(180deg,#2a1d0c 0%,#1c1305 100%);color:#f5e6bc;cursor:pointer;font-size:11px;font-weight:650;padding:0 12px}
        .btn-missao:hover{border-color:#e2c26b;transform:translateY(-1px)}.btn-missao.active{border-color:#36d979;color:#d8ffe7}.btn-missao--reset{color:#fecaca;border-color:rgba(201,75,75,.45);margin-left:auto}
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
    nav.querySelectorAll('[data-missao]').forEach(btn => btn.addEventListener('click', () => executarMissao(btn.dataset.missao)));
    const resetBtn = nav.querySelector('[data-action="reset-missao"]');
    if (resetBtn) resetBtn.addEventListener('click', resetarMissao);
}

function instalarBarraDeMissoes() {
    instalarEstilosDecisao();
    const nav = document.querySelector('.decisao-tabs');
    if (nav) { conectarBotoesModoDecisao(nav); return; }
    const tabsCenarios = document.querySelector('.scenario-tabs');
    if (!tabsCenarios) return;
    const novo = document.createElement('nav');
    novo.className = 'decisao-tabs';
    novo.setAttribute('aria-label', 'Modo Decisao');
    novo.innerHTML = `<span class="tab-label tab-label--decisao">Modo Decisao</span>${Object.entries(MISSOES).map(([id,m]) => `<button type="button" class="btn-missao" data-missao="${id}">${m.nome}</button>`).join('')}<button type="button" class="btn-missao btn-missao--reset" data-action="reset-missao">Resetar missao</button>`;
    tabsCenarios.insertAdjacentElement('afterend', novo);
    conectarBotoesModoDecisao(novo);
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', instalarBarraDeMissoes);
else instalarBarraDeMissoes();
