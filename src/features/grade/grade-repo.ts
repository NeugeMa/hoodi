import { abrirBanco } from '@/db/banco';

import type { GradeRisco, GradeSalva } from './tipos';

/**
 * Grade de risco no banco local (tabela grade_risco). Guarda só a última versão
 * válida, para o Mapa e o alerta funcionarem sem internet (F03 CA6, RNF03).
 */

export async function lerGradeSalva(): Promise<GradeSalva | null> {
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<{ baixada_em: string; conteudo: string }>(
    'SELECT baixada_em, conteudo FROM grade_risco WHERE id = 1',
  );
  if (!linha) return null;
  return { ...(JSON.parse(linha.conteudo) as GradeRisco), baixadaEm: linha.baixada_em };
}

/** Substitui a grade salva. Só é chamada depois que o checksum foi conferido. */
export async function salvarGrade(grade: GradeRisco): Promise<GradeSalva> {
  const db = await abrirBanco();
  const baixadaEm = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO grade_risco (id, versao, baixada_em, conteudo) VALUES (1, ?, ?, ?)',
    grade.versao,
    baixadaEm,
    JSON.stringify(grade),
  );
  return { ...grade, baixadaEm };
}
