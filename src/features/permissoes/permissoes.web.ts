/** Versão web (pré-visualização): o navegador não tem notificações do app nem Bluetooth com o Pet. */
export type EstadoPermissao = 'permitida' | 'negada' | 'nao-pedida' | 'indisponivel';

export async function estadoNotificacoes(): Promise<EstadoPermissao> {
  return 'indisponivel';
}
export async function pedirNotificacoes(): Promise<EstadoPermissao> {
  return 'indisponivel';
}
export async function estadoBluetooth(): Promise<EstadoPermissao> {
  return 'indisponivel';
}
export async function pedirBluetooth(): Promise<EstadoPermissao> {
  return 'indisponivel';
}
