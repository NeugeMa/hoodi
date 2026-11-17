import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';

import { observarBluetooth, pedirPermissoes, SUPORTE } from '@/features/pet/pet-ble';
import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

/**
 * Permissões de notificações e Bluetooth (F02 CA2, CA4). A localização fica no acompanhamento.
 * Nada é pedido ao sistema sem a pessoa tocar em "Permitir" depois de ler o motivo.
 */

export type EstadoPermissao = 'permitida' | 'negada' | 'nao-pedida' | 'indisponivel';

export async function estadoNotificacoes(): Promise<EstadoPermissao> {
  try {
    const r = await Notifications.getPermissionsAsync();
    if (r.granted) return 'permitida';
    return r.status === 'undetermined' ? 'nao-pedida' : 'negada';
  } catch {
    return 'indisponivel';
  }
}

export async function pedirNotificacoes(): Promise<EstadoPermissao> {
  try {
    const r = await Notifications.requestPermissionsAsync();
    return r.granted ? 'permitida' : 'negada';
  } catch {
    return 'indisponivel';
  }
}

/** Primeiro estado conhecido do Bluetooth (no iPhone, criar o gerenciador já dispara o pedido). */
function primeiroEstado(limiteMs: number) {
  return new Promise<EstadoPermissao>((resolve) => {
    let parar: () => void = () => {};
    const timer = setTimeout(() => {
      parar();
      resolve('nao-pedida');
    }, limiteMs);
    parar = observarBluetooth((estado) => {
      if (estado === 'desconhecido') return;
      clearTimeout(timer);
      // Desligado não é falta de permissão: a permissão foi dada, só falta ligar.
      resolve(estado === 'sem-permissao' ? 'negada' : estado === 'sem-suporte' ? 'indisponivel' : 'permitida');
      setTimeout(() => parar(), 0);
    });
  });
}

async function androidTemBluetooth() {
  const versao = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
  if (versao >= 31) {
    const [scan, connect] = await Promise.all([
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
    ]);
    return scan && connect;
  }
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
}

export async function estadoBluetooth(): Promise<EstadoPermissao> {
  // Expo Go não tem o módulo de Bluetooth: o Hoodi Pet só funciona no app instalado.
  if (SUPORTE !== 'ok') return 'indisponivel';
  const jaPedido = (await lerPreferencia(PREF.bluetoothPedido)) === '1';
  if (Platform.OS === 'android') {
    if (await androidTemBluetooth()) return 'permitida';
    return jaPedido ? 'negada' : 'nao-pedida';
  }
  // iPhone: sem pedir antes, não dá para consultar sem disparar o pedido do sistema.
  return jaPedido ? primeiroEstado(3_000) : 'nao-pedida';
}

export async function pedirBluetooth(): Promise<EstadoPermissao> {
  if (SUPORTE !== 'ok') return 'indisponivel';
  await salvarPreferencia(PREF.bluetoothPedido, '1');
  if (Platform.OS === 'android') return (await pedirPermissoes()) ? 'permitida' : 'negada';
  return primeiroEstado(60_000);
}
