import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

/**
 * Banco local do app (SQLite). Tudo aqui fica só no aparelho.
 * Na pré-visualização web não há SQLite: cada repositório tem um arquivo .web.ts.
 */

const NOME_BANCO = 'hoodi.db';

/**
 * Migrações: cada item roda uma vez, em ordem (PRAGMA user_version guarda a versão).
 * Para mudar o schema, ADICIONE um item no fim; nunca edite um que já rodou.
 */
const MIGRACOES = [
  // v1 · grade de risco salva para uso offline (F03)
  `CREATE TABLE IF NOT EXISTS grade_risco (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     versao TEXT NOT NULL,
     baixada_em TEXT NOT NULL,
     conteudo TEXT NOT NULL
   );`,
  // v2 · histórico local de alertas (F10)
  `CREATE TABLE IF NOT EXISTS alertas (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     criado_em TEXT NOT NULL,
     nivel TEXT NOT NULL CHECK (nivel IN ('medio', 'alto')),
     trecho TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_alertas_criado_em ON alertas (criado_em DESC);`,
  // v3 · hoodi Pet pareado com este celular e o token de pareamento (F06)
  `CREATE TABLE IF NOT EXISTS pet_pareado (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     dispositivo_id TEXT NOT NULL,
     nome TEXT NOT NULL,
     token_hex TEXT NOT NULL,
     pareado_em TEXT NOT NULL
   );`,
  // v4 · preferências simples em chave/valor (orientação do relógio F06; Perfil F08)
  `CREATE TABLE IF NOT EXISTS preferencias (
     chave TEXT PRIMARY KEY NOT NULL,
     valor TEXT NOT NULL
   );`,
];

let banco: Promise<SQLiteDatabase> | null = null;

export function abrirBanco() {
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
