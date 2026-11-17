import type { CelulaGrade, Coordenada, GradeRisco } from '@/features/grade/tipos';
import type { NivelRisco } from '@/features/risco/nivel';

/**
 * Dados SIMULADOS do modo demonstração, em volta da FIAP Paulista.
 * Não são registros da SSP-SP: servem só para mostrar como o app se comporta.
 */

export const FIAP_PAULISTA: Coordenada = { latitude: -23.5641, longitude: -46.6527 };
/** Destino dos exemplos (TC13): Estação Liberdade do Metrô. */
export const ESTACAO_LIBERDADE: Coordenada = { latitude: -23.5555, longitude: -46.6355 };

/** Tamanho da célula (~ 220 m), parecido com o H3 resolução 9 da grade real. */
const PASSO_LAT = 0.002;
const PASSO_LNG = 0.0022;

const RUAS = [
  'Av. Paulista',
  'Rua Augusta',
  'Al. Santos',
  'Rua Frei Caneca',
  'Rua Treze de Maio',
  'Rua da Consolação',
  'Rua Pamplona',
  'Al. Jaú',
  'Rua Peixoto Gomide',
  'Av. Brigadeiro Luís Antônio',
  'Rua Santo Antônio',
  'Rua Rui Barbosa',
  'Rua Conselheiro Ramalho',
  'Rua dos Estudantes',
  'Rua Galvão Bueno',
  'Viaduto Jacareí',
];

/**
 * Mapa dos níveis (linhas de sul para norte, colunas de oeste para leste).
 * t = tranquila, m = médio, a = alto, s = sem dado. O caminho direto até a Liberdade
 * cruza 3 células de risco alto; o desvio pelo sul não passa por nenhuma (nem por "sem dado").
 */
const MAPA = [
  't t t t t m t t t t',
  't t t t t t t m t t',
  's t t m t t t t t t',
  't t m t a a t t t t',
  't m t t a a m t t m',
  't t t m t t t m t t',
  't t s t t m t t t t',
];

const NIVEIS: Record<string, NivelRisco> = { t: 'tranquila', m: 'medio', a: 'alto', s: 'sem-dado' };

function criarCelulas(): CelulaGrade[] {
  const celulas: CelulaGrade[] = [];
  const linhas = MAPA.map((l) => l.split(' '));
  const sulOrigem = FIAP_PAULISTA.latitude - 1.5 * PASSO_LAT; // FIAP fica na 2ª linha
  const oesteOrigem = FIAP_PAULISTA.longitude - 1.5 * PASSO_LNG;
  linhas.forEach((colunas, i) => {
    colunas.forEach((letra, j) => {
      const sul = sulOrigem + i * PASSO_LAT;
      const oeste = oesteOrigem + j * PASSO_LNG;
      const nivel = NIVEIS[letra];
      celulas.push({
        id: `demo-${i}-${j}`,
        limites: { sul, norte: sul + PASSO_LAT, oeste, leste: oeste + PASSO_LNG },
        referencia: RUAS[(i * 3 + j) % RUAS.length],
        // "Sem dado" = faixa ausente na célula (como na grade real).
        // Mesmo nível nas duas faixas: a demonstração mostra o risco alto a qualquer hora.
        niveis: nivel === 'sem-dado' ? {} : { dia: nivel, noite: nivel },
      });
    });
  });
  return celulas;
}

export function gradeDemo(): GradeRisco & { baixadaEm: string } {
  return {
    versao: 'demonstracao',
    publicadoEm: '2026-11-03T12:00:00Z',
    baixadaEm: new Date().toISOString(),
    fonte: 'SSP-SP (dados simulados para demonstração)',
    // Duas faixas cobrindo o dia inteiro, para a demonstração funcionar a qualquer hora.
    faixas: [
      { id: 'dia', rotulo: '6h–18h', inicio: 6, fim: 18 },
      { id: 'noite', rotulo: '18h–6h', inicio: 18, fim: 6 },
    ],
    celulas: criarCelulas(),
  };
}

/** Caminho "direto" da FIAP até a Liberdade (mais rápido, passa pelo risco alto). */
export const CAMINHO_DIRETO: Coordenada[] = [
  FIAP_PAULISTA,
  { latitude: -23.5622, longitude: -46.6495 },
  { latitude: -23.5605, longitude: -46.6462 },
  { latitude: -23.5588, longitude: -46.6428 },
  { latitude: -23.5572, longitude: -46.6392 },
  ESTACAO_LIBERDADE,
];

/** Desvio pelo sul (alguns minutos a mais, menos risco registrado no caminho). */
export const CAMINHO_DESVIO: Coordenada[] = [
  FIAP_PAULISTA,
  { latitude: -23.5652, longitude: -46.6488 },
  { latitude: -23.5655, longitude: -46.6445 },
  { latitude: -23.5643, longitude: -46.6402 },
  { latitude: -23.5612, longitude: -46.6372 },
  { latitude: -23.5578, longitude: -46.6358 },
  ESTACAO_LIBERDADE,
];

/** Distância aproximada em metros de um caminho (para os minutos a pé). */
export function metrosDoCaminho(pontos: Coordenada[]) {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    const dy = (b.latitude - a.latitude) * 111_320;
    const dx = (b.longitude - a.longitude) * 111_320 * Math.cos((a.latitude * Math.PI) / 180);
    total += Math.hypot(dx, dy);
  }
  return Math.round(total);
}

/** Ponto a `metros` do início do caminho (para a caminhada simulada). Passou do fim: o último ponto. */
export function pontoNoCaminho(caminho: Coordenada[], metros: number): { ponto: Coordenada; restanteM: number } {
  const total = metrosDoCaminho(caminho);
  let andado = 0;
  for (let i = 1; i < caminho.length; i++) {
    const trecho = metrosDoCaminho([caminho[i - 1], caminho[i]]);
    if (andado + trecho >= metros) {
      const t = trecho === 0 ? 0 : (metros - andado) / trecho;
      const a = caminho[i - 1];
      const b = caminho[i];
      return {
        ponto: { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t },
        restanteM: Math.max(0, total - metros),
      };
    }
    andado += trecho;
  }
  return { ponto: caminho[caminho.length - 1], restanteM: 0 };
}
