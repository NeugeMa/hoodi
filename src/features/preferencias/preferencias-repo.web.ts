/** Versão web (pré-visualização): localStorage no lugar do SQLite. */
export { PREF } from './chaves';

const PREFIXO = 'hoodi:pref:';

export async function lerPreferencia(chave: string): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(PREFIXO + chave) ?? null;
  } catch {
    return null;
  }
}

export async function salvarPreferencia(chave: string, valor: string) {
  try {
    globalThis.localStorage?.setItem(PREFIXO + chave, valor);
  } catch {
    // Sem armazenamento disponível.
  }
}
