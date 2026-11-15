import type { Sessao } from './tipos';

/** Versão web (pré-visualização): o navegador não tem SecureStore, então usa a sessionStorage. */

const CHAVE = 'hoodi:sessao';

export async function lerSessaoSalva(): Promise<Sessao | null> {
  try {
    const texto = globalThis.sessionStorage?.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as Sessao) : null;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao: Sessao | null) {
  try {
    if (sessao) globalThis.sessionStorage?.setItem(CHAVE, JSON.stringify(sessao));
    else globalThis.sessionStorage?.removeItem(CHAVE);
  } catch {
    // Sem armazenamento disponível.
  }
}
