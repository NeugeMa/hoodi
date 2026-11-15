import * as SecureStore from 'expo-secure-store';

import type { Sessao } from './tipos';

/**
 * Tokens da sessão no armazenamento seguro do sistema (Keychain no iOS, Keystore no Android).
 * Nunca no SQLite nem em texto aberto.
 */

const CHAVE = 'hoodi.sessao';

export async function lerSessaoSalva(): Promise<Sessao | null> {
  try {
    const texto = await SecureStore.getItemAsync(CHAVE);
    return texto ? (JSON.parse(texto) as Sessao) : null;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao: Sessao | null) {
  if (sessao) await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao));
  else await SecureStore.deleteItemAsync(CHAVE);
}
