import type { Sessao } from './tipos';

/** Versão web (pré-visualização): o navegador não tem SecureStore, então usa o localStorage
 * (a sessão continua ao recarregar a página, como no celular). */

const CHAVE = 'hoodi:sessao';

export async function lerSessaoSalva(): Promise<Sessao | null> {
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as Sessao) : null;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao: Sessao | null) {
  try {
    if (sessao) globalThis.localStorage?.setItem(CHAVE, JSON.stringify(sessao));
    else globalThis.localStorage?.removeItem(CHAVE);
  } catch {
    // Sem armazenamento disponível.
  }
}
