import type { NivelRisco } from '@/features/risco/nivel';

/**
 * Carinhas do hoodi Pet em pixel art, no mesmo formato da tela OLED do Pet.
 * Grade de 17 × 12 pixels. Os desenhos abaixo são feitos numa grade de trabalho
 * de 21 × 14 (centro na coluna 10) e recortados com DESLOCAMENTO na hora de desenhar.
 * Cada estado é uma sequência de quadros (como um bichinho virtual de LCD).
 * Os mesmos desenhos podem ser levados para o firmware do Pet.
 */

export const LARGURA = 17;
export const ALTURA = 12;
/** Recorte da grade de trabalho (21 × 14) para a tela (17 × 12). */
const DESLOCAMENTO = { x: -2, y: -1 };

/** tranquila/atenta/preocupada vêm do design system; confusa e procurando são extras do app. */
export type Carinha = 'tranquila' | 'atenta' | 'preocupada' | 'confusa' | 'procurando';

export type Quadro = {
  /** Pixels acesos como [x, y]. */
  pixels: [number, number][];
  /** Quanto tempo o quadro fica na tela, em ms. */
  ms: number;
};

export function carinhaDoNivel(nivel: NivelRisco | null): Carinha {
  switch (nivel) {
    case 'tranquila':
      return 'tranquila';
    case 'medio':
      return 'atenta';
    case 'alto':
      return 'preocupada';
    case 'sem-dado':
      return 'confusa';
    default:
      return 'procurando';
  }
}

export const NOME_CARINHA: Record<Carinha, string> = {
  tranquila: 'tranquila',
  atenta: 'atenta',
  preocupada: 'preocupada',
  confusa: 'confusa',
  procurando: 'procurando você',
};

// ---------- Partes do rosto ----------

type Olhos = 'abertos' | 'piscando' | 'felizes';
type Boca = 'sorriso' | 'reta' | 'triste' | 'ondulada' | 'pontos1' | 'pontos2' | 'pontos3';
type Extra = 'sobrancelhasBravas' | 'interrogacao';

type Rosto = {
  olhos: Olhos;
  boca: Boca;
  extras?: Extra[];
  /** Deslocamento só dos olhos (olhar para o lado ou para cima). */
  olharX?: number;
  olharY?: number;
  /** Deslocamento do rosto inteiro (respirar, tremer). */
  dx?: number;
  dy?: number;
};

const OLHO_ESQ = 6;
const OLHO_DIR = 13;
const OLHO_Y = 4;

function olhos(tipo: Olhos, ox: number, oy: number): [number, number][] {
  const px: [number, number][] = [];
  for (const x of [OLHO_ESQ, OLHO_DIR]) {
    if (tipo === 'abertos') {
      for (let dy = 0; dy < 3; dy++) px.push([x + ox, OLHO_Y + dy + oy], [x + 1 + ox, OLHO_Y + dy + oy]);
    } else if (tipo === 'piscando') {
      px.push([x + ox, OLHO_Y + 2 + oy], [x + 1 + ox, OLHO_Y + 2 + oy]);
    } else {
      // Olhos fechados de felicidade: um arco ∩.
      px.push([x, OLHO_Y + 1], [x + 1, OLHO_Y + 1], [x - 1, OLHO_Y + 2], [x + 2, OLHO_Y + 2]);
    }
  }
  return px;
}

function linha(x0: number, x1: number, y: number): [number, number][] {
  const px: [number, number][] = [];
  for (let x = x0; x <= x1; x++) px.push([x, y]);
  return px;
}

function boca(tipo: Boca): [number, number][] {
  switch (tipo) {
    case 'sorriso':
      return [[7, 9], [13, 9], ...linha(8, 12, 10)];
    case 'reta':
      return linha(8, 12, 10);
    case 'triste':
      return [...linha(8, 12, 9), [7, 10], [13, 10]];
    case 'ondulada':
      return [[7, 10], [8, 9], [9, 10], [10, 9], [11, 10], [12, 9], [13, 10]];
    case 'pontos1':
      return [[8, 10]];
    case 'pontos2':
      return [[8, 10], [10, 10]];
    case 'pontos3':
      return [[8, 10], [10, 10], [12, 10]];
  }
}

function extra(tipo: Extra): [number, number][] {
  switch (tipo) {
    case 'sobrancelhasBravas':
      // Ponta de dentro mais baixa: cara de preocupação.
      return [[5, 1], [6, 2], [7, 2], [15, 1], [14, 2], [13, 2]];
    case 'interrogacao':
      return [[16, 2], [17, 2], [15, 3], [18, 3], [18, 4], [17, 5], [17, 6], [17, 8]];
  }
}

function desenhar(r: Rosto): [number, number][] {
  const dx = (r.dx ?? 0) + DESLOCAMENTO.x;
  const dy = (r.dy ?? 0) + DESLOCAMENTO.y;
  const px = [
    ...olhos(r.olhos, r.olharX ?? 0, r.olharY ?? 0),
    ...boca(r.boca),
    ...(r.extras ?? []).flatMap(extra),
  ];
  // Partes podem acender o mesmo pixel; guarda cada pixel uma vez só.
  const unicos = new Map<string, [number, number]>();
  for (const [x0, y0] of px) {
    const x = x0 + dx;
    const y = y0 + dy;
    if (x >= 0 && x < LARGURA && y >= 0 && y < ALTURA) unicos.set(`${x},${y}`, [x, y]);
  }
  return [...unicos.values()];
}

function q(rosto: Rosto, ms: number): Quadro {
  return { pixels: desenhar(rosto), ms };
}

// ---------- Animações ----------

export const QUADROS: Record<Carinha, Quadro[]> = {
  // Respira devagar, pisca e às vezes fecha os olhos de felicidade.
  tranquila: [
    q({ olhos: 'abertos', boca: 'sorriso' }, 1000),
    q({ olhos: 'abertos', boca: 'sorriso', dy: -1 }, 500),
    q({ olhos: 'abertos', boca: 'sorriso' }, 1000),
    q({ olhos: 'piscando', boca: 'sorriso' }, 130),
    q({ olhos: 'abertos', boca: 'sorriso' }, 700),
    q({ olhos: 'felizes', boca: 'sorriso' }, 1100),
  ],
  // Olha para um lado e para o outro, prestando atenção.
  atenta: [
    q({ olhos: 'abertos', boca: 'reta' }, 900),
    q({ olhos: 'abertos', boca: 'reta', olharX: -1 }, 700),
    q({ olhos: 'abertos', boca: 'reta' }, 400),
    q({ olhos: 'abertos', boca: 'reta', olharX: 1 }, 700),
    q({ olhos: 'abertos', boca: 'reta' }, 500),
    q({ olhos: 'piscando', boca: 'reta' }, 130),
  ],
  // Treme rápido, para depois de um tempo e treme de novo.
  preocupada: [
    q({ olhos: 'abertos', boca: 'triste', extras: ['sobrancelhasBravas'], dx: -1 }, 90),
    q({ olhos: 'abertos', boca: 'triste', extras: ['sobrancelhasBravas'], dx: 1 }, 90),
    q({ olhos: 'abertos', boca: 'triste', extras: ['sobrancelhasBravas'], dx: -1 }, 90),
    q({ olhos: 'abertos', boca: 'triste', extras: ['sobrancelhasBravas'], dx: 1 }, 90),
    q({ olhos: 'abertos', boca: 'triste', extras: ['sobrancelhasBravas'] }, 900),
    q({ olhos: 'piscando', boca: 'triste', extras: ['sobrancelhasBravas'] }, 130),
    q({ olhos: 'abertos', boca: 'triste', extras: ['sobrancelhasBravas'] }, 700),
  ],
  // Sem dado: não sabe dizer. Nunca sorri (sem dado não é área tranquila).
  confusa: [
    q({ olhos: 'abertos', boca: 'ondulada', extras: ['interrogacao'] }, 900),
    q({ olhos: 'abertos', boca: 'ondulada', extras: ['interrogacao'], olharX: 1, olharY: -1 }, 800),
    q({ olhos: 'abertos', boca: 'ondulada' }, 300),
    q({ olhos: 'abertos', boca: 'ondulada', extras: ['interrogacao'] }, 700),
    q({ olhos: 'piscando', boca: 'ondulada', extras: ['interrogacao'] }, 130),
  ],
  // Procurando a posição: olha em volta enquanto os pontinhos carregam.
  procurando: [
    q({ olhos: 'abertos', boca: 'pontos1', olharX: -1 }, 350),
    q({ olhos: 'abertos', boca: 'pontos2', olharX: -1 }, 350),
    q({ olhos: 'abertos', boca: 'pontos3', olharX: -1 }, 350),
    q({ olhos: 'abertos', boca: 'pontos1', olharX: 1 }, 350),
    q({ olhos: 'abertos', boca: 'pontos2', olharX: 1 }, 350),
    q({ olhos: 'abertos', boca: 'pontos3', olharX: 1 }, 350),
    q({ olhos: 'piscando', boca: 'pontos3' }, 130),
  ],
};
