import type { GradeRisco, GradeSalva } from './tipos';

/**
 * Versão web do banco da grade, só para a pré-visualização no navegador.
 * O app no celular usa o SQLite (grade-repo.ts); o Metro escolhe este arquivo
 * automaticamente na web, onde o SQLite precisaria de configuração extra.
 */

const CHAVE = 'hoodi:grade_risco';

export async function lerGradeSalva(): Promise<GradeSalva | null> {
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as GradeSalva) : null;
  } catch {
    return null;
  }
}

export async function salvarGrade(grade: GradeRisco): Promise<GradeSalva> {
  const salva: GradeSalva = { ...grade, baixadaEm: new Date().toISOString() };
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(salva));
  } catch {
    // Sem armazenamento disponível: segue só em memória.
  }
  return salva;
}
