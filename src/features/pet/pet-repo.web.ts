/** Versão web (pré-visualização): localStorage no lugar do SQLite. */
import type { PetPareado } from './pet-repo';

export type { PetPareado } from './pet-repo';

const CHAVE = 'hoodi:pet_pareado';

export async function lerPetPareado(): Promise<PetPareado | null> {
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as PetPareado) : null;
  } catch {
    return null;
  }
}

export async function salvarPetPareado(pet: PetPareado) {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(pet));
  } catch {
    // Sem armazenamento disponível.
  }
}

export async function esquecerPetPareado() {
  try {
    globalThis.localStorage?.removeItem(CHAVE);
  } catch {
    // Sem armazenamento disponível.
  }
}
