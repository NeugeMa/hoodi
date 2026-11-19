import * as Location from 'expo-location';

import { FIAP_PAULISTA } from '@/features/demo/dados-demo';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import type { Coordenada } from '@/features/grade/tipos';

const ESPERA_MAXIMA_MS = 8_000;

/** Onde a pessoa está agora. Sem permissão, sem GPS ou GPS demorando mais de 8 s: null (a tela avisa). */
export async function posicaoAtual(): Promise<Coordenada | null> {
  if (MODO_DEMO) return FIAP_PAULISTA; // demonstração: sempre saindo da FIAP Paulista
  try {
    const permissao = await Location.getForegroundPermissionsAsync();
    if (!permissao.granted) return null;
    const ultima = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    const local =
      ultima ??
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ESPERA_MAXIMA_MS)),
      ]));
    return local ? { latitude: local.coords.latitude, longitude: local.coords.longitude } : null;
  } catch {
    return null;
  }
}
