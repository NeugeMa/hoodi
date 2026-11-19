import { ESTACAO_LIBERDADE, FIAP_PAULISTA } from '@/features/demo/dados-demo';

import type { CategoriaLugar, LugarRecomendado, RespostaRecomendacao, RespostaSugestoes } from './lugares';

/** Respostas SIMULADAS do modo demonstração (nada sai do aparelho; não são lugares nem registros reais). */

const SUGESTOES = [
  { id: 'demo:1', rotulo: 'Estação Liberdade', contexto: 'Liberdade', coordenada: ESTACAO_LIBERDADE },
  { id: 'demo:2', rotulo: 'Av. Paulista, 1106', contexto: 'Bela Vista', coordenada: FIAP_PAULISTA },
  { id: 'demo:3', rotulo: 'Parque Trianon', contexto: 'Jardim Paulista', coordenada: { latitude: -23.5617, longitude: -46.6559 } },
];

export function sugestoesDemo(): RespostaSugestoes {
  return { situacao: 'ok', sugestoes: SUGESTOES };
}

const LUGARES: Omit<LugarRecomendado, 'id'>[] = [
  { nome: 'Lugar de exemplo A', contexto: 'Bela Vista', coordenada: { latitude: -23.5629, longitude: -46.6505 }, distanciaMetros: 260, situacao: 'com_dado', nivel: 0 },
  { nome: 'Lugar de exemplo B', contexto: 'Consolação', coordenada: { latitude: -23.5602, longitude: -46.6557 }, distanciaMetros: 540, situacao: 'com_dado', nivel: 1 },
  { nome: 'Lugar de exemplo C', contexto: 'Bela Vista', coordenada: { latitude: -23.5671, longitude: -46.6475 }, distanciaMetros: 480, situacao: 'sem_dado', nivel: null },
];

export function recomendacaoDemo(categoria: CategoriaLugar): RespostaRecomendacao {
  return {
    situacao: 'ok',
    motivo: null,
    versaoGrade: 'demo',
    faixa: null,
    aviso: 'Demonstração: lugares e riscos simulados.',
    lugares: LUGARES.map((l, i) => ({ ...l, id: `demo:${categoria}:${i}` })),
  };
}
