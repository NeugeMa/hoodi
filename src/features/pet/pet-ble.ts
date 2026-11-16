import Constants, { ExecutionEnvironment } from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';
import type { BleManager as TipoBleManager, Subscription } from 'react-native-ble-plx';

import {
  CARAC_COMANDO,
  CARAC_EVENTO,
  CARAC_STATUS,
  deBase64,
  lerEvento,
  paraBase64,
  PREFIXO_NOME,
  SERVICO_PET,
  type EventoPet,
} from './protocolo';

/**
 * Bluetooth (BLE) com o hoodi Pet, usando react-native-ble-plx (protocolo v1, ver protocolo.ts).
 * O Expo Go não tem o módulo nativo de BLE: lá o suporte é "expo-go" e nada é chamado.
 * Para testar o Bluetooth de verdade é preciso um development build.
 */

export type Suporte = 'ok' | 'expo-go' | 'web';
export type EstadoBluetooth = 'ligado' | 'desligado' | 'sem-permissao' | 'sem-suporte' | 'desconhecido';
export type PetEncontrado = { id: string; nome: string; rssi: number | null };

export const SUPORTE: Suporte =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ? 'expo-go' : 'ok';

/** Tempo para a pessoa digitar no celular o código que aparece no Pet. */
const TEMPO_PAREAMENTO_MS = 60_000;

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

/**
 * Garante o pareamento (CA9). Ler o status do Pet exige pareamento: na primeira vez,
 * o sistema abre o pedido de código e a pessoa digita os 6 dígitos da tela do Pet.
 * Enquanto ela digita, a leitura falha; tenta de novo até TEMPO_PAREAMENTO_MS.
 * Com o celular já pareado, passa na primeira tentativa.
 */
export async function garantirPareamento(id: string) {
  const inicio = Date.now();
  for (;;) {
    try {
      await ble().readCharacteristicForDevice(id, SERVICO_PET, CARAC_STATUS);
      return;
    } catch (e) {
      if (Date.now() - inicio >= TEMPO_PAREAMENTO_MS) throw e;
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }
}

/** Escreve um comando já montado (montarEstado / montarSimples). */
export async function enviarComando(id: string, frame: Uint8Array) {
  await ble().writeCharacteristicWithResponseForDevice(id, SERVICO_PET, CARAC_COMANDO, paraBase64(frame));
}

/** Clique e pressão longa no botão do Pet. O contador evita repetir o mesmo evento. */
export function observarEventos(id: string, callback: (evento: EventoPet) => void): () => void {
  if (SUPORTE !== 'ok') return () => {};
  let ultimo = -1;
  const sub: Subscription = ble().monitorCharacteristicForDevice(id, SERVICO_PET, CARAC_EVENTO, (erro, c) => {
    if (erro || !c?.value) return;
    const evento = lerEvento(deBase64(c.value));
    if (!evento || evento.contador === ultimo) return;
    ultimo = evento.contador;
    callback(evento);
  });
  return () => sub.remove();
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
