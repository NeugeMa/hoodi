import { abrirBanco } from '@/db/banco';

/**
 * hoodi Pet pareado com este celular (F06).
 * tokenHex não é mais usado: no protocolo v1 o pareamento é o do sistema (código na tela do Pet).
 * Fica gravado vazio para não precisar migrar a tabela pet_pareado.
 */
export type PetPareado = { dispositivoId: string; nome: string; tokenHex: string; pareadoEm: string };

type Linha = { dispositivo_id: string; nome: string; token_hex: string; pareado_em: string };

export async function lerPetPareado(): Promise<PetPareado | null> {
  const db = await abrirBanco();
  const l = await db.getFirstAsync<Linha>('SELECT * FROM pet_pareado WHERE id = 1');
  return l ? { dispositivoId: l.dispositivo_id, nome: l.nome, tokenHex: l.token_hex, pareadoEm: l.pareado_em } : null;
}

export async function salvarPetPareado(pet: PetPareado) {
  const db = await abrirBanco();
  await db.runAsync(
    'INSERT OR REPLACE INTO pet_pareado (id, dispositivo_id, nome, token_hex, pareado_em) VALUES (1, ?, ?, ?, ?)',
    pet.dispositivoId,
    pet.nome,
    pet.tokenHex,
    pet.pareadoEm,
  );
}

export async function esquecerPetPareado() {
  const db = await abrirBanco();
  await db.runAsync('DELETE FROM pet_pareado');
}
