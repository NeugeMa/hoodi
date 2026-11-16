import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { Alerta } from './motor';

/**
 * Notificação do alerta de risco (F07 CA1). É ela que o relógio espelha:
 * o app não fala direto com o relógio, o sistema do celular repassa a notificação.
 * O som segue a preferência do Perfil (F08 CA1); a vibração forte vale sempre.
 */

/** No Android o som é do canal e não muda depois de criado; por isso são dois canais. */
const CANAL_SILENCIOSO = 'alertas-silenciosos';
const CANAL_COM_SOM = 'alertas-com-som';

// Mostra a notificação mesmo com o app aberto (o aviso também aparece na tela).
// O som de cada notificação é decidido no envio (content.sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let preparado: Promise<boolean> | null = null;

/** Pede permissão (uma vez) e cria os canais do Android com vibração forte. */
export function prepararNotificacoes() {
  preparado ??= (async () => {
    if (Platform.OS === 'android') {
      const vibracao = { importance: AndroidImportance.HIGH, vibrationPattern: [0, 400, 200, 400] };
      await Notifications.setNotificationChannelAsync(CANAL_SILENCIOSO, {
        name: 'Alertas de risco (sem som)',
        sound: null,
        ...vibracao,
      });
      await Notifications.setNotificationChannelAsync(CANAL_COM_SOM, { name: 'Alertas de risco (com som)', ...vibracao });
    }
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  })();
  return preparado;
}

export async function notificarAlerta(alerta: Alerta, { som = false }: { som?: boolean } = {}) {
  if (!(await prepararNotificacoes())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: alerta.titulo, body: alerta.texto, sound: som ? 'default' : false },
    trigger: Platform.OS === 'android' ? { channelId: som ? CANAL_COM_SOM : CANAL_SILENCIOSO } : null,
  });
}
