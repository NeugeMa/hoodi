import { listarAlertas, registrarAlerta } from '@/features/historico/historico-repo';
import type { NovoAlerta } from '@/features/historico/tipos';

import { MODO_DEMO } from './modo-demo';

/**
 * Alertas de exemplo para o "Perfil demo": trajetos à noite em volta da FIAP Paulista nos últimos dias.
 * Só no modo demonstração (dados simulados, não são registros reais) e só se o histórico estiver vazio,
 * para não duplicar a cada entrada.
 */
const EXEMPLOS: { diasAtras: number; hora: number; minuto: number; nivel: NovoAlerta['nivel']; trecho: string }[] = [
  { diasAtras: 1, hora: 22, minuto: 41, nivel: 'alto', trecho: 'Viaduto Jacareí' },
  { diasAtras: 1, hora: 22, minuto: 36, nivel: 'medio', trecho: 'Rua Santo Antônio' },
  { diasAtras: 2, hora: 21, minuto: 18, nivel: 'medio', trecho: 'Rua Frei Caneca' },
  { diasAtras: 4, hora: 23, minuto: 5, nivel: 'alto', trecho: 'Rua dos Estudantes' },
  { diasAtras: 4, hora: 22, minuto: 58, nivel: 'medio', trecho: 'Rua Galvão Bueno' },
  { diasAtras: 6, hora: 19, minuto: 47, nivel: 'medio', trecho: 'Rua Treze de Maio' },
];

export async function semearHistoricoDemo(agora = new Date()) {
  if (!MODO_DEMO) return;
  if ((await listarAlertas()).length > 0) return;
  for (const e of EXEMPLOS) {
    const quando = new Date(agora);
    quando.setDate(agora.getDate() - e.diasAtras);
    quando.setHours(e.hora, e.minuto, 0, 0);
    await registrarAlerta({ criadoEm: quando.toISOString(), nivel: e.nivel, trecho: e.trecho });
  }
}
