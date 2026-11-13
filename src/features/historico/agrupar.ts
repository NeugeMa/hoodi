import { diaMes } from '@/features/grade/datas';

import type { AlertaSalvo } from './tipos';

export type GrupoDeAlertas = { titulo: string; alertas: AlertaSalvo[] };

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Hoje", "Ontem" ou "12 nov." */
export function tituloDoDia(iso: string, agora = new Date()) {
  const dia = new Date(iso);
  if (mesmoDia(dia, agora)) return 'Hoje';
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (mesmoDia(dia, ontem)) return 'Ontem';
  return diaMes(iso);
}

/** "23:14" */
export function hora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Agrupa por dia, mantendo a ordem (do mais recente para o mais antigo). */
export function agruparPorDia(alertas: AlertaSalvo[], agora = new Date()): GrupoDeAlertas[] {
  const grupos: GrupoDeAlertas[] = [];
  for (const alerta of alertas) {
    const titulo = tituloDoDia(alerta.criadoEm, agora);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.titulo === titulo) ultimo.alertas.push(alerta);
    else grupos.push({ titulo, alertas: [alerta] });
  }
  return grupos;
}

/** Quantos alertas de cada nível nos últimos 7 dias. */
export function resumoDaSemana(alertas: AlertaSalvo[], agora = new Date()) {
  const limite = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recentes = alertas.filter((a) => new Date(a.criadoEm).getTime() >= limite);
  return {
    total: recentes.length,
    medio: recentes.filter((a) => a.nivel === 'medio').length,
    alto: recentes.filter((a) => a.nivel === 'alto').length,
  };
}
