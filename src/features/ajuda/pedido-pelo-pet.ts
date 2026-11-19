import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';

import { notificarAviso } from '@/features/alerta/notificacoes';
import { usePet } from '@/features/pet/pet-context';

import { enviarPedidoDeAjuda, guardarResultadoDoPet, type ResultadoPedido } from './enviar-pedido';
import { horaCurta } from './pedido-ajuda';

/** Celular vibra longo duas vezes: o pedido NÃO saiu. */
const VIBRACAO_FALHA = [0, 700, 300, 700];

function aviso(r: ResultadoPedido) {
  return r.tipo === 'registrado'
    ? { titulo: 'Pedido de ajuda registrado', texto: `Pelo Hoodi Pet, às ${horaCurta(r.pedido.registradoEm)}. Seus contatos estão sendo avisados.` }
    : { titulo: 'Pedido de ajuda não enviado', texto: r.texto };
}

/**
 * Pedido de ajuda pelo botão do Hoodi Pet (F09): segurar o botão de ajuda por 3 s chega no app
 * como "pressão longa" e envia o pedido direto, sem tirar o celular do bolso (decisão da equipe, 18/11).
 * O próprio Pet vibra uma vez ao reconhecer os 3 s. Depois:
 * - registrado: o Pet vibra rápido 5 vezes, o celular avisa e abre o resultado;
 * - não enviado (sem conta, sem internet, limite de 3 por hora): o celular vibra longo, avisa e explica.
 * Usa as mesmas regras do botão Pedir ajuda (limite, idempotência de 120 s, posição aproximada).
 */
export function usePedidoPeloPet(logado: boolean) {
  const { aoEvento, confirmarPedidoAjuda } = usePet();
  const enviandoRef = useRef(false);
  const logadoRef = useRef(logado);
  const confirmarRef = useRef(confirmarPedidoAjuda);

  useEffect(() => {
    logadoRef.current = logado;
    confirmarRef.current = confirmarPedidoAjuda;
  }, [logado, confirmarPedidoAjuda]);

  useEffect(
    () =>
      aoEvento(async (evento) => {
        if (evento.tipo !== 'pressao-longa' || enviandoRef.current) return;

        if (!logadoRef.current) {
          Vibration.vibrate(VIBRACAO_FALHA);
          await notificarAviso(
            'Pedido de ajuda não enviado',
            'Entre na sua conta do Hoodi para pedir ajuda pelo Hoodi Pet.',
          ).catch(() => {});
          return;
        }

        enviandoRef.current = true;
        try {
          const resultado = await enviarPedidoDeAjuda();
          if (resultado.tipo === 'registrado') await confirmarRef.current().catch(() => {});
          else Vibration.vibrate(VIBRACAO_FALHA);

          const { titulo, texto } = aviso(resultado);
          AccessibilityInfo.announceForAccessibility(`${titulo}.`);
          await notificarAviso(titulo, texto).catch(() => {});
          guardarResultadoDoPet(resultado);
          router.push('/pedir-ajuda');
        } finally {
          enviandoRef.current = false;
        }
      }),
    [aoEvento],
  );
}
