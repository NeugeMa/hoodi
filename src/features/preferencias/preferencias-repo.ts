import { abrirBanco } from '@/db/banco';

/**
 * Preferências simples em chave/valor (tabela preferencias), só no aparelho.
 * Use as chaves de PREF (chaves.ts) para não espalhar textos soltos pelo código.
 */
export { PREF } from './chaves';

export async function lerPreferencia(chave: string): Promise<string | null> {
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM preferencias WHERE chave = ?', chave);
  return linha?.valor ?? null;
}

export async function salvarPreferencia(chave: string, valor: string) {
  const db = await abrirBanco();
  await db.runAsync('INSERT OR REPLACE INTO preferencias (chave, valor) VALUES (?, ?)', chave, valor);
}
