import { ErroApi, mensagemDeFalha } from '@/features/api/cliente';

import { enviarPanico, type PanicoRegistrado } from './panico-api';
import { chaveDoPedido, horaCurta, MAX_PEDIDOS_POR_HORA, posicaoAproximada, registrarPedidoFeito, situacaoDoLimite } from './pedido-ajuda';

export type ResultadoPedido =
  | { tipo: 'registrado'; pedido: PanicoRegistrado }
  | { tipo: 'nao-enviado'; motivo: 'sem-internet' | 'limite' | 'falha'; texto: string };

/** Resultado de um pedido feito pelo Pet, para a tela Pedir ajuda abrir já mostrando-o. */
let resultadoDoPet: ResultadoPedido | null = null;

export function guardarResultadoDoPet(resultado: ResultadoPedido) {
  resultadoDoPet = resultado;
}

/** Devolve (uma vez só) o resultado guardado pelo Pet. */
export function retirarResultadoDoPet() {
  const r = resultadoDoPet;
  resultadoDoPet = null;
  return r;
}

/**
 * Envia o pedido de ajuda (F09 CA4 a CA8). Usado pelo botão da tela Pedir ajuda e pela
 * pressão longa no botão do Hoodi Pet. Nunca diz "enviado" quando não foi.
 */
export async function enviarPedidoDeAjuda(): Promise<ResultadoPedido> {
  // F09 CA7: no quarto pedido da hora, explica o limite e não envia.
  const situacao = await situacaoDoLimite();
  if (situacao.restantes === 0) {
    return {
      tipo: 'nao-enviado',
      motivo: 'limite',
      texto: `Você já enviou ${MAX_PEDIDOS_POR_HORA} pedidos na última hora, o limite do Hoodi. Este pedido não foi enviado.${
        situacao.liberaEm ? ` Você pode pedir de novo às ${horaCurta(situacao.liberaEm.toISOString())}.` : ''
      }`,
    };
  }

  try {
    const pedido = await enviarPanico(chaveDoPedido(), await posicaoAproximada());
    if (!pedido.reutilizado) await registrarPedidoFeito(pedido.registradoEm);
    return { tipo: 'registrado', pedido };
  } catch (e) {
    // F09 CA8: sem internet, avisa na hora e nunca mostra "enviado".
    const semInternet = e instanceof ErroApi && e.tipo === 'sem-internet';
    return {
      tipo: 'nao-enviado',
      motivo: semInternet ? 'sem-internet' : 'falha',
      texto: semInternet
        ? 'Você está sem internet e o pedido não foi enviado. Se puder, ligue para alguém de confiança.'
        : `${mensagemDeFalha(e)} O pedido não foi enviado.`,
    };
  }
}
