import { webPodePersistirSessao } from './sessao-politica';
import type { Sessao } from './tipos';

/** Versão web (pré-visualização): o navegador não tem SecureStore, então usa o localStorage
 * (a sessão continua ao recarregar a página, como no celular). Em produção, só na memória. */

const CHAVE = 'hoodi:sessao';
const PERSISTE = webPodePersistirSessao(process.env.EXPO_PUBLIC_AMBIENTE);
let naMemoria: Sessao | null = null;

export async function lerSessaoSalva(): Promise<Sessao | null> {
  if (!PERSISTE) return naMemoria;
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as Sessao) : null;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao: Sessao | null) {
  if (!PERSISTE) {
    naMemoria = sessao;
    return;
  }
  try {
    if (sessao) globalThis.localStorage?.setItem(CHAVE, JSON.stringify(sessao));
    else globalThis.localStorage?.removeItem(CHAVE);
  } catch {
    // Sem armazenamento disponível.
  }
}
