/** Versão web (pré-visualização): sem notificações do sistema; o aviso aparece só na tela. */
import type { Alerta } from './motor';

export async function prepararNotificacoes() {
  return false;
}

export async function notificarAlerta(_alerta: Alerta, _opcoes: { som?: boolean } = {}) {}
