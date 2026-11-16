/**
 * Versão web, só para a pré-visualização no navegador: sem Bluetooth.
 * No celular (development build) vale pet-ble.ts.
 */
import type { EstadoBluetooth, PetEncontrado, Suporte } from './pet-ble';
import type { EventoPet } from './protocolo';

export type { EstadoBluetooth, PetEncontrado, Suporte } from './pet-ble';

export const SUPORTE: Suporte = 'web';

const indisponivel = () => Promise.reject(new Error('Bluetooth indisponível no navegador'));

export async function pedirPermissoes() {
  return false;
}

export function observarBluetooth(callback: (estado: EstadoBluetooth) => void) {
  callback('sem-suporte');
  return () => {};
}

export function buscarPets(_onEncontrado: (pet: PetEncontrado) => void, onErro: (e: Error) => void) {
  onErro(new Error('Bluetooth indisponível no navegador'));
  return () => {};
}

export const conectar = indisponivel;
export const garantirPareamento = indisponivel;
export const enviarComando = indisponivel;
export const desconectar = async () => {};

export function observarDesconexao() {
  return () => {};
}

export function observarEventos(_id: string, _callback: (evento: EventoPet) => void) {
  return () => {};
}
