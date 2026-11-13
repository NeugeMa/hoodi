import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { GradeRisco, GradeSalva } from './tipos';

/**
 * Banco local (SQLite) da grade de risco. Guarda só a última versão válida,
 * para o Mapa e o alerta funcionarem sem internet (F03 CA6, RNF03).
 */

const NOME_BANCO = 'hoodi.db';

/** Cada item roda uma vez, em ordem. Para mudar o schema, ADICIONE um item no fim. */
const MIGRACOES = [
  `CREATE TABLE IF NOT EXISTS grade_risco (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     versao TEXT NOT NULL,
     baixada_em TEXT NOT NULL,
     conteudo TEXT NOT NULL
   );`,
];

let banco: Promise<SQLiteDatabase> | null = null;

function abrir() {
  banco ??= (async () => {
    const db = await openDatabaseAsync(NOME_BANCO);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    for (let v = linha?.user_version ?? 0; v < MIGRACOES.length; v++) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(MIGRACOES[v]);
        await db.execAsync(`PRAGMA user_version = ${v + 1}`);
      });
    }
    return db;
  })();
  return banco;
}

export async function lerGradeSalva(): Promise<GradeSalva | null> {
  const db = await abrir();
  const linha = await db.getFirstAsync<{ baixada_em: string; conteudo: string }>(
    'SELECT baixada_em, conteudo FROM grade_risco WHERE id = 1',
  );
  if (!linha) return null;
  return { ...(JSON.parse(linha.conteudo) as GradeRisco), baixadaEm: linha.baixada_em };
}

/** Substitui a grade salva. Só é chamada depois que o checksum foi conferido. */
export async function salvarGrade(grade: GradeRisco): Promise<GradeSalva> {
  const db = await abrir();
  const baixadaEm = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO grade_risco (id, versao, baixada_em, conteudo) VALUES (1, ?, ?, ?)',
    grade.versao,
    baixadaEm,
    JSON.stringify(grade),
  );
  return { ...grade, baixadaEm };
}
