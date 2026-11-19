/**
 * Política do modo demonstração, sem dependência de react-native (testável em Node).
 * Falha fechado: o demo só liga em desenvolvimento (__DEV__) ou em build com
 * EXPO_PUBLIC_AMBIENTE=demo. Ambiente ausente, "producao" ou "homologacao" nunca liga,
 * nem por variável nem por ?demo=1 no navegador.
 */
export function demoPermitido(ambiente: string | undefined, dev: boolean): boolean {
  return dev || ambiente === 'demo';
}

export function demoLigado(env: { demo?: string; ambiente?: string; dev: boolean }, daWeb: boolean): boolean {
  if (!demoPermitido(env.ambiente, env.dev)) return false;
  return env.demo === '1' || daWeb;
}
