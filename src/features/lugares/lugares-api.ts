import { ErroApi } from '@/features/api/cliente';
import { chamarAutenticado } from '@/features/conta/sessao';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import type { Coordenada } from '@/features/grade/tipos';

import {
  corpoRecomendar,
  corpoSugerir,
  textoParaBuscar,
  type CategoriaLugar,
  type RespostaRecomendacao,
  type RespostaSugestoes,
} from './lugares';
import { recomendacaoDemo, sugestoesDemo } from './lugares-demo';

/**
 * Sugestões de destino e lugares próximos pela API do Hoodi (com login). O servidor consulta o HeiGIT com a chave
 * dele e não guarda o texto nem a posição. Falha de busca vira `indisponivel`: o fluxo de digitar o endereço continua.
 */

export async function sugerirLugares(texto: string): Promise<RespostaSugestoes> {
  const limpo = textoParaBuscar(texto);
  if (!limpo) return { situacao: 'ok', sugestoes: [] };
  if (MODO_DEMO) return sugestoesDemo();
  try {
    return await chamarAutenticado<RespostaSugestoes>('/v1/lugares/sugerir', { metodo: 'POST', corpo: corpoSugerir(limpo) });
  } catch (e) {
    if (e instanceof ErroApi) return { situacao: 'indisponivel', sugestoes: [] };
    throw e;
  }
}

export async function recomendarLugares(posicao: Coordenada, categoria: CategoriaLugar): Promise<RespostaRecomendacao> {
  if (MODO_DEMO) return recomendacaoDemo(categoria);
  return chamarAutenticado<RespostaRecomendacao>('/v1/lugares/recomendar', { metodo: 'POST', corpo: corpoRecomendar(posicao, categoria) });
}
