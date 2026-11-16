import { randomUUID } from 'expo-crypto';
import * as Location from 'expo-location';

import { MODO_DEMO } from '@/features/demo/modo-demo';
import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

import type { Coordenadas } from './panico-api';

/** F09 CA7: no máximo 3 pedidos por hora. A API ainda não aplica; o app aplica. */
export const MAX_PEDIDOS_POR_HORA = 3;
const UMA_HORA_MS = 60 * 60 * 1000;

/** A API pede para reusar a mesma chave por 120 s na mesma intenção (toque repetido, rede caindo). */
const JANELA_CHAVE_MS = 120_000;

let chaveAtual: { valor: string; criadaEm: number } | null = null;

/** Chave de idempotência do pedido: a mesma por 120 s, depois uma nova. */
export function chaveDoPedido() {
  const agora = Date.now();
  if (!chaveAtual || agora - chaveAtual.criadaEm > JANELA_CHAVE_MS) {
    chaveAtual = { valor: randomUUID(), criadaEm: agora };
  }
  return chaveAtual.valor;
}

async function pedidosDaUltimaHora() {
  try {
    const lista = JSON.parse((await lerPreferencia(PREF.pedidosAjuda)) ?? '[]') as string[];
    const limite = Date.now() - UMA_HORA_MS;
    return lista.filter((iso) => Date.parse(iso) > limite);
  } catch {
    return [];
  }
}

/** Quantos pedidos ainda cabem nesta hora e, se nenhum, a partir de quando volta a poder. */
export async function situacaoDoLimite() {
  const recentes = await pedidosDaUltimaHora();
  const restantes = Math.max(0, MAX_PEDIDOS_POR_HORA - recentes.length);
  const maisAntigo = recentes.map((iso) => Date.parse(iso)).sort((a, b) => a - b)[0];
  return { restantes, liberaEm: restantes === 0 && maisAntigo ? new Date(maisAntigo + UMA_HORA_MS) : null };
}

/** Conta um pedido novo (não conta o reenvio da mesma intenção). */
export async function registrarPedidoFeito(registradoEm: string) {
  const recentes = await pedidosDaUltimaHora();
  await salvarPreferencia(PREF.pedidosAjuda, JSON.stringify([...recentes, registradoEm]));
}

/**
 * Posição aproximada para o pedido (F09 CA4 "endereço aproximado"): arredonda para cerca de 100 m.
 * Sem permissão ou sem GPS, o pedido vai sem posição (a API aceita) em vez de não sair.
 */
export async function posicaoAproximada(): Promise<Coordenadas> {
  if (MODO_DEMO) return { latitude: -23.564, longitude: -46.653 }; // demonstração: perto da FIAP Paulista
  try {
    const permissao = await Location.getForegroundPermissionsAsync();
    if (!permissao.granted) return null;
    const ultima = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    const local =
      ultima ??
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5_000)),
      ]));
    if (!local) return null;
    const arredondar = (n: number) => Math.round(n * 1000) / 1000;
    return { latitude: arredondar(local.coords.latitude), longitude: arredondar(local.coords.longitude) };
  } catch {
    return null;
  }
}

export function linkGoogleMaps(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
