import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import type { Coordenada } from '@/features/grade/tipos';

/**
 * Localização em segundo plano (alerta ambiente com a tela apagada ou o app em segundo plano).
 * Só no app instalado (development build); no Expo Go e no navegador não existe.
 * O sistema entrega as posições a uma tarefa; ela repassa ao ouvinte que o acompanhamento registrou.
 * Se o sistema encerrar o app por completo, não há ouvinte e as posições são descartadas
 * (limite conhecido: o alerta volta quando a pessoa abrir o app de novo).
 */

export const TAREFA_LOCALIZACAO = 'hoodi-localizacao-segundo-plano';

export type PermissaoSegundoPlano = 'permitida' | 'negada' | 'nao-pedida' | 'indisponivel';

type Ouvinte = (posicao: Coordenada) => void;
let ouvinte: Ouvinte | null = null;

/** O acompanhamento registra quem recebe as posições; `null` ao parar. */
export function definirOuvinte(novo: Ouvinte | null) {
  ouvinte = novo;
}

// Precisa ser definida na carga do módulo, antes de qualquer tela (regra do gerenciador de tarefas).
try {
  TaskManager.defineTask(TAREFA_LOCALIZACAO, async ({ data, error }) => {
    if (error || !ouvinte) return;
    const locais = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
    for (const local of locais) ouvinte({ latitude: local.coords.latitude, longitude: local.coords.longitude });
  });
} catch {
  // Ambiente sem gerenciador de tarefas (Expo Go): o segundo plano fica indisponível.
}

export async function estadoSegundoPlano(): Promise<PermissaoSegundoPlano> {
  try {
    if (!(await TaskManager.isAvailableAsync())) return 'indisponivel';
    const r = await Location.getBackgroundPermissionsAsync();
    if (r.granted) return 'permitida';
    return r.canAskAgain ? 'nao-pedida' : 'negada';
  } catch {
    return 'indisponivel';
  }
}

/** Depois que a localização "ao usar" foi dada. No Android 11+ o sistema leva à tela de configurações. */
export async function pedirSegundoPlano(): Promise<PermissaoSegundoPlano> {
  try {
    if (!(await TaskManager.isAvailableAsync())) return 'indisponivel';
    const r = await Location.requestBackgroundPermissionsAsync();
    return r.granted ? 'permitida' : 'negada';
  } catch {
    return 'indisponivel';
  }
}

export async function iniciarSegundoPlano() {
  if (await Location.hasStartedLocationUpdatesAsync(TAREFA_LOCALIZACAO)) return;
  await Location.startLocationUpdatesAsync(TAREFA_LOCALIZACAO, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 10,
    timeInterval: 5_000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    // Android: serviço em primeiro plano, com a notificação fixa que o sistema exige.
    foregroundService: {
      notificationTitle: 'Hoodi acompanhando o risco',
      notificationBody: 'A posição fica só no celular. Toque para abrir o app.',
    },
  });
}

export async function pararSegundoPlano() {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TAREFA_LOCALIZACAO)) {
      await Location.stopLocationUpdatesAsync(TAREFA_LOCALIZACAO);
    }
  } catch {
    // já parado
  }
}
