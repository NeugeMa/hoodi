import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { Alerta } from './motor';

/**
 * Notificação do alerta de risco (F07 CA1). É ela que o relógio espelha:
 * o app não fala direto com o relógio, o sistema do celular repassa a notificação.
 */

const CANAL = 'alertas-de-risco';

// Mostra a notificação mesmo com o app aberto (o aviso também aparece na tela).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let preparado: Promise<boolean> | null = null;

/** Pede permissão (uma vez) e cria o canal do Android com vibração forte. */
export function prepararNotificacoes() {
  preparado ??= (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Alertas de risco',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 400, 200, 400],
      });
    }
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  })();
  return preparado;
}

export async function notificarAlerta(alerta: Alerta) {
  if (!(await prepararNotificacoes())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: alerta.titulo, body: alerta.texto },
    trigger: Platform.OS === 'android' ? { channelId: CANAL } : null,
  });
}
