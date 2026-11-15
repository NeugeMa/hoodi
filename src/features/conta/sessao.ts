import { chamarApi, ehErroHttp, ErroApi, type OpcoesChamada } from '@/features/api/cliente';

import { lerSessaoSalva, salvarSessao } from './sessao-armazem';
import { sessaoDeTokens, type Sessao, type TokensAuth } from './tipos';

/**
 * Sessão da conta, fora do React para o cliente da API poder usar.
 * - O access token dura 60 min; antes de vencer, o app troca pelo refresh token (rotativo).
 * - Renovação "single-flight": várias chamadas ao mesmo tempo esperam a mesma renovação
 *   (a API revoga a família se o mesmo refresh for usado de novo fora da janela de 45 s).
 * - Refresh recusado (401): a sessão acaba e o app volta para Entrar.
 */

const MARGEM_MS = 60_000;
const TENTATIVAS_REDE = 2;

let atual: Sessao | null = null;
const ouvintes = new Set<(s: Sessao | null) => void>();

export function sessaoAtual() {
  return atual;
}

export function ouvirSessao(fn: (s: Sessao | null) => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

export async function definirSessao(sessao: Sessao | null) {
  atual = sessao;
  await salvarSessao(sessao);
  ouvintes.forEach((fn) => fn(sessao));
}

/** Lê a sessão salva ao abrir o app. Sessão com o refresh vencido é descartada. */
export async function carregarSessao() {
  const salva = await lerSessaoSalva();
  if (salva && Date.parse(salva.expiraRefreshEm) <= Date.now()) {
    await definirSessao(null);
    return null;
  }
  atual = salva;
  return salva;
}

let renovando: Promise<Sessao | null> | null = null;

/** Troca o refresh token por um par novo. Devolve null se a sessão acabou. */
export function renovarSessao(): Promise<Sessao | null> {
  renovando ??= (async () => {
    const antes = atual;
    if (!antes) return null;
    for (let tentativa = 0; ; tentativa++) {
      try {
        // Na falha de rede, tenta de novo com o MESMO refresh token (a API tolera o replay).
        const tokens = await chamarApi<TokensAuth>('/v1/auth/renovar', {
          metodo: 'POST',
          corpo: { refreshToken: antes.refreshToken },
        });
        const nova = sessaoDeTokens(tokens);
        await definirSessao(nova);
        return nova;
      } catch (e) {
        if (ehErroHttp(e, 401)) {
          await definirSessao(null);
          return null;
        }
        if (e instanceof ErroApi && e.tipo === 'sem-internet' && tentativa < TENTATIVAS_REDE) continue;
        throw e;
      }
    }
  })().finally(() => {
    renovando = null;
  });
  return renovando;
}

function venceLogo(s: Sessao) {
  return Date.parse(s.expiraEm) - Date.now() < MARGEM_MS;
}

/** Chamada à API com o access token, renovando quando precisa. */
export async function chamarAutenticado<T>(caminho: string, opcoes: Omit<OpcoesChamada, 'token'> = {}): Promise<T> {
  let sessao = atual;
  if (sessao && venceLogo(sessao)) sessao = await renovarSessao();
  if (!sessao) throw new ErroApi('http', 401, 'SEM_SESSAO');

  try {
    return await chamarApi<T>(caminho, { ...opcoes, token: sessao.accessToken });
  } catch (e) {
    if (!ehErroHttp(e, 401)) throw e;
    const nova = await renovarSessao();
    if (!nova) throw e;
    return chamarApi<T>(caminho, { ...opcoes, token: nova.accessToken });
  }
}
