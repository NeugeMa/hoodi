import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

export async function resolve(especificador, contexto, proximo) {
  let alvo = null;
  if (especificador.startsWith('@/')) alvo = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith('.') && contexto.parentURL?.startsWith(pathToFileURL(SRC).href)) {
    alvo = path.resolve(path.dirname(fileURLToPath(contexto.parentURL)), especificador);
  }
  if (alvo) {
    for (const ext of ['.ts', '.tsx', '']) {
      if ((ext || /\.tsx?$/.test(alvo)) && existsSync(alvo + ext)) return { url: pathToFileURL(alvo + ext).href, shortCircuit: true };
    }
  }
  return proximo(especificador, contexto);
}
