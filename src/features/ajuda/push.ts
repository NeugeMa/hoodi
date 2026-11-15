import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { prepararNotificacoes } from '@/features/alerta/notificacoes';
import { idDaInstalacao } from '@/features/conta/conta-context';
import { chamarAutenticado } from '@/features/conta/sessao';

/**
 * Push dos pedidos de ajuda (F09): o celular do contato recebe um aviso do servidor.
 * O token Expo deste aparelho é registrado na API (PUT /v1/push/tokens) depois de entrar.
 *
 * Limites: precisa de development build com projeto EAS (o Expo Go no Android não recebe push remoto).
 * Sem isso, o registro é pulado em silêncio e o contato vê os pedidos na lista "Pedidos recebidos".
 */

function idDoProjetoEas(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function registrarPushDoAparelho() {
  try {
    const projectId = idDoProjetoEas();
    if (!Device.isDevice || !projectId) return;
    if (!(await prepararNotificacoes())) return;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await chamarAutenticado('/v1/push/tokens', {
      metodo: 'PUT',
      corpo: { expoPushToken, plataforma: Platform.OS === 'ios' ? 'ios' : 'android', instalacaoId: await idDaInstalacao() },
    });
  } catch {
    // Sem push neste aparelho: o pedido continua aparecendo em "Pedidos recebidos".
  }
}

function abrirPedido(resposta: Notifications.NotificationResponse | null | undefined) {
  const dados = resposta?.notification.request.content.data as { tipo?: unknown; pedidoId?: unknown } | undefined;
  if (dados?.tipo === 'pedido_ajuda' && typeof dados.pedidoId === 'string') {
    router.push({ pathname: '/ajuda/[id]', params: { id: dados.pedidoId } });
  }
}

/**
 * Com a pessoa logada: registra o push e, ao tocar no aviso de um pedido de ajuda,
 * abre o detalhe do pedido (também quando o toque abriu o app).
 */
export function usePushPedidosAjuda(logado: boolean) {
  const ultima = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (logado) registrarPushDoAparelho();
  }, [logado]);

  useEffect(() => {
    if (logado) abrirPedido(ultima);
  }, [logado, ultima]);
}
