import Constants, { ExecutionEnvironment } from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';
import type { BleManager as TipoBleManager, Subscription } from 'react-native-ble-plx';

import {
  CARAC_COMANDO,
  CARAC_PAREAMENTO,
  montarComando,
  paraBase64,
  PREFIXO_NOME,
  SERVICO_PET,
} from './protocolo';

/**
 * Bluetooth (BLE) com o hoodi Pet, usando react-native-ble-plx.
 * O Expo Go não tem o módulo nativo de BLE: lá o suporte é "expo-go" e nada é chamado.
 * Para testar o Bluetooth de verdade é preciso um development build.
 */

export type Suporte = 'ok' | 'expo-go' | 'web';
export type EstadoBluetooth = 'ligado' | 'desligado' | 'sem-permissao' | 'sem-suporte' | 'desconhecido';
export type PetEncontrado = { id: string; nome: string; rssi: number | null };

export const SUPORTE: Suporte =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ? 'expo-go' : 'ok';

let gerenciador: TipoBleManager | null = null;

/** Cria o BleManager só quando o módulo nativo existe (fora do Expo Go). */
function ble(): TipoBleManager {
  if (SUPORTE !== 'ok') throw new Error('Bluetooth indisponível no Expo Go');
  if (!gerenciador) {
    // require tardio: no Expo Go o módulo nativo não existe e nem é carregado.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BleManager } = require('react-native-ble-plx') as typeof import('react-native-ble-plx');
    gerenciador = new BleManager();
  }
  return gerenciador;
}

/** Android 12+: BLUETOOTH_SCAN e BLUETOOTH_CONNECT. Antes disso: localização. iOS: pedido pelo sistema. */
export async function pedirPermissoes(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const versao = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
  if (versao >= 31) {
    const r = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(r).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  }
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

/** Acompanha se o Bluetooth do celular está ligado (F06 CA6). */
export function observarBluetooth(callback: (estado: EstadoBluetooth) => void): () => void {
  if (SUPORTE !== 'ok') {
    callback('sem-suporte');
    return () => {};
  }
  const sub = ble().onStateChange((s) => {
    callback(s === 'PoweredOn' ? 'ligado' : s === 'PoweredOff' ? 'desligado' : s === 'Unauthorized' ? 'sem-permissao' : s === 'Unsupported' ? 'sem-suporte' : 'desconhecido');
  }, true);
  return () => sub.remove();
}

/** Busca Pets por perto (F06 CA3). Devolve a função que para a busca. */
export function buscarPets(onEncontrado: (pet: PetEncontrado) => void, onErro: (e: Error) => void): () => void {
  const manager = ble();
  manager.startDeviceScan(null, { allowDuplicates: false }, (erro, dispositivo) => {
    if (erro) {
      onErro(erro);
      return;
    }
    const nome = dispositivo?.name ?? dispositivo?.localName ?? '';
    const anunciaServico = dispositivo?.serviceUUIDs?.some((u) => u.toLowerCase() === SERVICO_PET) ?? false;
    if (dispositivo && (nome.startsWith(PREFIXO_NOME) || anunciaServico)) {
      onEncontrado({ id: dispositivo.id, nome: nome || PREFIXO_NOME, rssi: dispositivo.rssi });
    }
  });
  return () => {
    manager.stopDeviceScan();
  };
}

/** Conecta e descobre o serviço do Pet. */
export async function conectar(id: string) {
  const manager = ble();
  const dispositivo = await manager.connectToDevice(id, { timeout: 10_000 });
  await dispositivo.discoverAllServicesAndCharacteristics();
}

/** Grava o token deste celular no Pet (CA9: só este celular comanda o Pet). */
export async function gravarToken(id: string, token: Uint8Array) {
  await ble().writeCharacteristicWithResponseForDevice(id, SERVICO_PET, CARAC_PAREAMENTO, paraBase64(token));
}

export async function enviarComando(id: string, token: Uint8Array, comando: number, argumento = 0) {
  await ble().writeCharacteristicWithResponseForDevice(
    id,
    SERVICO_PET,
    CARAC_COMANDO,
    paraBase64(montarComando(token, comando, argumento)),
  );
}

export async function desconectar(id: string) {
  try {
    await ble().cancelDeviceConnection(id);
  } catch {
    // Já estava desconectado.
  }
}

/** Avisa quando a conexão cai (F06 CA8). */
export function observarDesconexao(id: string, callback: () => void): () => void {
  if (SUPORTE !== 'ok') return () => {};
  const sub: Subscription = ble().onDeviceDisconnected(id, () => callback());
  return () => sub.remove();
}
