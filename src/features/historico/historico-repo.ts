import { abrirBanco } from '@/db/banco';

import { avisarHistoricoMudou } from './historico-eventos';
import type { AlertaSalvo, NovoAlerta } from './tipos';

/**
 * Histórico de alertas no banco local (tabela alertas, F10).
 * Nada daqui sai do aparelho.
 */

type Linha = { id: number; criado_em: string; nivel: AlertaSalvo['nivel']; trecho: string };

/** Do mais recente para o mais antigo (F10 CA1). */
export async function listarAlertas(): Promise<AlertaSalvo[]> {
  const db = await abrirBanco();
  const linhas = await db.getAllAsync<Linha>('SELECT * FROM alertas ORDER BY criado_em DESC');
  return linhas.map((l) => ({ id: l.id, criadoEm: l.criado_em, nivel: l.nivel, trecho: l.trecho }));
}

/** Chamado pelo alerta de risco (F07) cada vez que um alerta é disparado. */
export async function registrarAlerta(alerta: NovoAlerta) {
  const db = await abrirBanco();
  await db.runAsync(
    'INSERT INTO alertas (criado_em, nivel, trecho) VALUES (?, ?, ?)',
    alerta.criadoEm,
    alerta.nivel,
    alerta.trecho,
  );
  avisarHistoricoMudou();
}

/** "Apagar histórico" (F10 CA3). Também usado ao excluir a conta (F08). */
export async function apagarHistorico() {
  const db = await abrirBanco();
  await db.runAsync('DELETE FROM alertas');
  avisarHistoricoMudou();
}
