import type { PosicaoAtual } from './tipos';

/** Frase curta de "onde você está agora", usada no Início e no Mapa. */
export function explicacaoDaPosicao(posicao: PosicaoAtual | null) {
  if (!posicao) return 'Ainda não sabemos onde você está.';
  if (!posicao.celulaId) return 'O Hoodi ainda não tem dados para este lugar.';
  if (posicao.nivel === 'sem-dado') {
    return 'Não há registro utilizável para este lugar. Isso não quer dizer que a área é tranquila.';
  }
  return posicao.motivo;
}
