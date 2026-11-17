import type { Coordenada } from '@/features/grade/tipos';

/** No navegador não há localização em segundo plano. */
export const TAREFA_LOCALIZACAO = 'hoodi-localizacao-segundo-plano';
export type PermissaoSegundoPlano = 'permitida' | 'negada' | 'nao-pedida' | 'indisponivel';

export function definirOuvinte(_novo: ((posicao: Coordenada) => void) | null) {}
export async function estadoSegundoPlano(): Promise<PermissaoSegundoPlano> {
  return 'indisponivel';
}
export async function pedirSegundoPlano(): Promise<PermissaoSegundoPlano> {
  return 'indisponivel';
}
export async function iniciarSegundoPlano() {
  throw new Error('Segundo plano indisponível no navegador');
}
export async function pararSegundoPlano() {}
