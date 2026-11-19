import type { VersaoGrade } from './tipos';

/** Contratos de dados que o decoder sabe ler. A entrega publica o 2; o 3 é da fase 2. */
export const CONTRATOS_ACEITOS: readonly number[] = [2, 3];

/** Só aceita a versão publicada se o manifesto declarar um contrato conhecido. */
export function contratoAceito(v: Pick<VersaoGrade, 'manifest'>): boolean {
  const c = v.manifest?.contrato_versao;
  return typeof c === 'number' && CONTRATOS_ACEITOS.includes(c);
}
