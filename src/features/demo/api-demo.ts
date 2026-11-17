import { CAMINHO_DESVIO, CAMINHO_DIRETO, codificarPolyline, metrosDoCaminho } from './dados-demo';

/**
 * API SIMULADA do modo demonstração. Responde no mesmo formato da API do Abner (v0.5/v0.6),
 * guardando tudo em memória (some ao recarregar a página). Nunca é usada fora do modo demonstração.
 */

export const CONTA_DEMO = { email: 'demo@hoodi.dev', senha: 'Teste@2026', nome: 'Mari' };

type Resposta = { status: number; corpo?: unknown };

type Conta = { id: string; email: string; nome: string; senha: string };
type Vinculo = { id: string; titularId: string; contatoId: string; nome: string };
type Convite = { conviteId: string; codigo: string; donoId: string; expiraEm: string };
type Pedido = { pedidoId: string; donoId: string; chave: string; registradoEm: string; latitude: number | null; longitude: number | null; abertos: number };

const contas = new Map<string, Conta>();
const vinculos: Vinculo[] = [];
const convites: Convite[] = [];
const pedidos: Pedido[] = [];
const pendentes = new Map<string, string>(); // token de e-mail -> e-mail

function id() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function hex64() {
  let s = '';
  for (let i = 0; i < 64; i++) s += '0123456789ABCDEF'[(Math.random() * 16) | 0];
  return s;
}
const agoraIso = (somarMs = 0) => new Date(Date.now() + somarMs).toISOString();

// Conta de demonstração com uma contato confirmada (Ana) e alguém que confia na Mari (Bruno).
function semear() {
  // Ids fixos: a sessão salva continua valendo ao recarregar a página (a API simulada recomeça).
  const mari: Conta = { id: '0d3e0000-0000-4000-8000-00000000a001', email: CONTA_DEMO.email, nome: CONTA_DEMO.nome, senha: CONTA_DEMO.senha };
  const ana: Conta = { id: '0d3e0000-0000-4000-8000-00000000a002', email: 'ana@hoodi.dev', nome: 'Ana', senha: 'x' };
  const bruno: Conta = { id: '0d3e0000-0000-4000-8000-00000000a003', email: 'bruno@hoodi.dev', nome: 'Bruno', senha: 'x' };
  [mari, ana, bruno].forEach((c) => contas.set(c.email, c));
  vinculos.push({ id: id(), titularId: mari.id, contatoId: ana.id, nome: '' });
  vinculos.push({ id: id(), titularId: bruno.id, contatoId: mari.id, nome: '' });
  convites.push({ conviteId: id(), codigo: hex64(), donoId: mari.id, expiraEm: agoraIso(45 * 60_000) });
  pedidos.push({
    pedidoId: id(),
    donoId: bruno.id,
    chave: id(),
    registradoEm: agoraIso(-26 * 60 * 60_000),
    latitude: -23.5576,
    longitude: -46.6603,
    abertos: 1,
  });
}
semear();

const porId = (contaId: string) => [...contas.values()].find((c) => c.id === contaId);

function tokens(conta: Conta) {
  return {
    accessToken: `demo-access-${conta.id}`,
    tokenType: 'Bearer',
    expiraEm: agoraIso(60 * 60_000),
    usuario: { id: conta.id, nome: conta.nome, email: conta.email },
    refreshToken: `demo-refresh-${conta.id}-${Date.now()}`,
    expiraRefreshEm: agoraIso(7 * 24 * 60 * 60_000),
  };
}

function usuarioDoToken(token?: string) {
  const contaId = token?.startsWith('demo-access-') ? token.slice('demo-access-'.length) : null;
  return contaId ? porId(contaId) : undefined;
}

const erro = (status: number, code: string): Resposta => ({ status, corpo: { title: 'Demonstração', status, code } });

function vinculoVisto(v: Vinculo, eu: Conta) {
  const titular = v.titularId === eu.id;
  return {
    id: v.id,
    titularId: v.titularId,
    contatoId: v.contatoId,
    estado: 'aceito',
    direcao: 'titular_para_contato',
    nomeExibicao: porId(titular ? v.contatoId : v.titularId)?.nome ?? 'Conta excluída',
    papelDoSolicitante: titular ? 'titular' : 'contato',
  };
}

function resumo(p: Pedido) {
  const total = vinculos.filter((v) => v.titularId === p.donoId).length;
  if (total === 0) return { estado: 'sem_destinatarios', total: 0, pendentes: 0, aceitosExpo: 0, aceitosProvedor: 0, abertosNoApp: 0, falhosOuCancelados: 0 };
  return {
    estado: p.abertos > 0 ? 'aberto_no_app' : 'aceito_expo',
    total,
    pendentes: 0,
    aceitosExpo: total,
    aceitosProvedor: 0,
    abertosNoApp: p.abertos,
    falhosOuCancelados: 0,
  };
}

function rotas() {
  const rota = (rotaId: string, caminho: typeof CAMINHO_DIRETO, exposicaoRelativa: number, posicao: number) => {
    const distanciaMetros = metrosDoCaminho(caminho);
    return {
      rotaId,
      distanciaMetros,
      duracaoSegundos: Math.round(distanciaMetros / 1.3), // ~ 4,7 km/h
      exposicaoRelativa,
      percentualSemEstimativa: 0,
      geometriaCodificada: codificarPolyline(caminho),
      posicao,
    };
  };
  return {
    situacao: 'concluida',
    motivo: null,
    versaoGrade: 'demonstracao',
    coberturaMinimaPercentual: 70,
    rotas: [rota('direta', CAMINHO_DIRETO, 1420, 2), rota('desvio', CAMINHO_DESVIO, 980, 1)],
    unidadeExposicao: 'metro_risco_relativo',
    metodoTrechoDesconhecido: 'extrapolacao_media_trechos_conhecidos',
    empateTecnicoPercentual: 5,
  };
}

/** Responde uma chamada como a API faria. */
export function responderDemo(metodo: string, caminho: string, corpo: unknown, token?: string): Resposta {
  const c = (corpo ?? {}) as Record<string, unknown>;
  const eu = usuarioDoToken(token);
  const rota = `${metodo} ${caminho.split('?')[0]}`;

  if (rota === 'GET /health') return { status: 200, corpo: { status: 'ok', versaoApi: 'demonstracao' } };

  // ---- Conta (F01) ----
  if (rota === 'POST /v1/auth/registrar') {
    const email = String(c.email ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(400, 'DADOS_INVALIDOS');
    pendentes.set(`demo-confirmar-${hex64()}`.slice(0, 64), email);
    return { status: 202, corpo: { mensagem: 'Se os dados forem elegiveis, a solicitacao de cadastro sera processada.' } };
  }
  if (rota === 'POST /v1/auth/confirmar-email') {
    // Na demonstração qualquer link do botão "Abrir o link" vale para o último cadastro.
    const email = [...pendentes.values()].pop();
    if (!email) return erro(401, 'TOKEN_INVALIDO');
    pendentes.clear();
    contas.set(email.trim().toLowerCase(), { id: id(), email: email.trim().toLowerCase(), nome: String(c.nome ?? 'Você'), senha: String(c.senha ?? '') });
    return { status: 200, corpo: { mensagem: 'E-mail confirmado. Faça login.' } };
  }
  if (rota === 'POST /v1/auth/login') {
    const conta = contas.get(String(c.email ?? '').trim().toLowerCase());
    if (!conta || conta.senha !== c.senha) return erro(401, 'CREDENCIAIS_INVALIDAS');
    return { status: 200, corpo: tokens(conta) };
  }
  if (rota === 'POST /v1/auth/renovar') {
    // demo-refresh-<id da conta>-<momento>
    const resto = String(c.refreshToken ?? '').replace(/^demo-refresh-/, '');
    const conta = porId(resto.slice(0, resto.lastIndexOf('-')));
    return conta ? { status: 200, corpo: tokens(conta) } : erro(401, 'TOKEN_INVALIDO');
  }
  if (rota === 'POST /v1/auth/solicitar-redefinicao') return { status: 202, corpo: { mensagem: 'ok' } };
  if (rota === 'POST /v1/auth/redefinir-senha') return { status: 200, corpo: { mensagem: 'Senha redefinida.' } };

  if (!eu) return erro(401, 'NAO_AUTENTICADO');

  if (rota === 'POST /v1/auth/sair') return { status: 204 };
  if (rota === 'PUT /v1/push/tokens') return { status: 200, corpo: { id: id(), ativo: true } };
  if (rota === 'DELETE /v1/conta') {
    if (c.senha !== eu.senha) return erro(403, 'SENHA_INVALIDA');
    contas.delete(eu.email);
    for (let i = vinculos.length - 1; i >= 0; i--) if (vinculos[i].titularId === eu.id || vinculos[i].contatoId === eu.id) vinculos.splice(i, 1);
    return { status: 204 };
  }

  // ---- Contatos (F09) ----
  if (rota === 'GET /v1/contatos') {
    return { status: 200, corpo: vinculos.filter((v) => v.titularId === eu.id || v.contatoId === eu.id).map((v) => vinculoVisto(v, eu)) };
  }
  if (rota === 'GET /v1/contatos/convites') {
    return {
      status: 200,
      corpo: convites.filter((x) => x.donoId === eu.id).map((x) => ({ conviteId: x.conviteId, expiraEm: x.expiraEm, estado: 'pendente', direcao: 'titular_para_contato' })),
    };
  }
  if (rota === 'POST /v1/contatos/convites') {
    const novo: Convite = { conviteId: id(), codigo: hex64(), donoId: eu.id, expiraEm: agoraIso(60 * 60_000) };
    convites.push(novo);
    return { status: 201, corpo: { conviteId: novo.conviteId, codigo: novo.codigo, expiraEm: novo.expiraEm, direcao: 'titular_para_contato' } };
  }
  if (rota === 'POST /v1/contatos/convites/resgatar') {
    const codigo = String(c.codigo ?? '').toUpperCase();
    const meu = convites.find((x) => x.codigo === codigo);
    if (meu && meu.donoId === eu.id) return erro(422, 'VINCULO_PROPRIO');
    if (meu) convites.splice(convites.indexOf(meu), 1);
    if (c.decisao === 'rejeitar') return { status: 204 };
    // Convite de outra pessoa (na demonstração: a Carla).
    let carla = contas.get('carla@hoodi.dev');
    if (!carla) {
      carla = { id: id(), email: 'carla@hoodi.dev', nome: 'Carla', senha: 'x' };
      contas.set(carla.email, carla);
    }
    const titularId = meu ? meu.donoId : carla.id;
    if (vinculos.some((v) => v.titularId === titularId && v.contatoId === eu.id)) return erro(409, 'VINCULO_EXISTENTE');
    const v: Vinculo = { id: id(), titularId, contatoId: eu.id, nome: '' };
    vinculos.push(v);
    return { status: 200, corpo: vinculoVisto(v, eu) };
  }
  let m = /^DELETE \/v1\/contatos\/convites\/(.+)$/.exec(rota);
  if (m) {
    const i = convites.findIndex((x) => x.conviteId === m![1] && x.donoId === eu.id);
    if (i < 0) return erro(409, 'CONVITE_ENCERRADO');
    convites.splice(i, 1);
    return { status: 204 };
  }
  m = /^DELETE \/v1\/contatos\/(.+)$/.exec(rota);
  if (m) {
    const i = vinculos.findIndex((v) => v.id === m![1] && (v.titularId === eu.id || v.contatoId === eu.id));
    if (i >= 0) vinculos.splice(i, 1);
    return { status: 204 };
  }

  // ---- Pedido de ajuda (F09) ----
  if (rota === 'POST /v1/panico') {
    const chave = String(c.idempotencyKey ?? '');
    const antigo = pedidos.find((p) => p.donoId === eu.id && p.chave === chave);
    if (antigo) return { status: 200, corpo: { pedidoId: antigo.pedidoId, registradoEm: antigo.registradoEm, origem: 'app', resumo: resumo(antigo), reutilizado: true } };
    const p: Pedido = {
      pedidoId: id(),
      donoId: eu.id,
      chave,
      registradoEm: agoraIso(),
      latitude: typeof c.latitude === 'number' ? c.latitude : null,
      longitude: typeof c.longitude === 'number' ? c.longitude : null,
      abertos: 0,
    };
    pedidos.push(p);
    return { status: 202, corpo: { pedidoId: p.pedidoId, registradoEm: p.registradoEm, origem: 'app', resumo: resumo(p), reutilizado: false } };
  }
  if (rota === 'GET /v1/panico/recebidos') {
    const meusTitulares = new Set(vinculos.filter((v) => v.contatoId === eu.id).map((v) => v.titularId));
    return {
      status: 200,
      corpo: pedidos
        .filter((p) => meusTitulares.has(p.donoId))
        .map((p) => ({ pedidoId: p.pedidoId, titularNome: porId(p.donoId)?.nome ?? 'Conta excluída', registradoEm: p.registradoEm })),
    };
  }
  m = /^(GET|POST) \/v1\/panico\/([^/]+)(\/status|\/abertura)?$/.exec(rota);
  if (m) {
    const p = pedidos.find((x) => x.pedidoId === m![2]);
    if (!p) return erro(404, 'NAO_ENCONTRADO');
    if (m[3] === '/abertura') {
      p.abertos++;
      return { status: 204 };
    }
    if (m[3] === '/status') {
      // Na demonstração, um contato "abre" o pedido logo depois.
      if (p.donoId === eu.id && p.abertos === 0 && Date.now() - Date.parse(p.registradoEm) > 5_000) p.abertos = 1;
      return p.donoId === eu.id
        ? { status: 200, corpo: { pedidoId: p.pedidoId, registradoEm: p.registradoEm, resumo: resumo(p) } }
        : erro(404, 'NAO_ENCONTRADO');
    }
    return {
      status: 200,
      corpo: {
        pedidoId: p.pedidoId,
        titularNome: porId(p.donoId)?.nome ?? 'Conta excluída',
        registradoEm: p.registradoEm,
        origem: 'app',
        latitude: p.latitude,
        longitude: p.longitude,
        observacao: null,
        localizacaoDisponivel: p.latitude !== null,
      },
    };
  }

  // ---- Rotas (F04) ----
  if (rota === 'POST /v1/rotas/avaliar') return { status: 200, corpo: rotas() };

  return erro(404, 'NAO_ENCONTRADO');
}
