import type { NivelRisco } from '@/features/risco/nivel';

import desenhos from './carinhas.json';

/**
 * Carinhas do Hoodi Pet em pixel art, as MESMAS da tela OLED do Pet.
 * Os desenhos vêm de carinhas.json (18 × 12), gerado pelo scripts/gerar_carinhas.py do firmware:
 * mudou lá, é só copiar o JSON novo para cá que o app e o Pet continuam iguais.
 * O app só anima: pisca (quadros "piscando" do JSON), respira, olha para os lados e treme.
 */

export const LARGURA: number = desenhos.largura;
export const ALTURA: number = desenhos.altura;

/**
 * tranquila, atenta e preocupada: níveis do design system. confusa = "desconhecido" do JSON (Sem dado).
 * alerta, dormindo e desconectado: estados do Pet. procurando e timida: extras do app
 * (posição desconhecida; olhos fechados enquanto a pessoa digita a senha).
 */
export type Carinha =
  | 'tranquila'
  | 'atenta'
  | 'preocupada'
  | 'alerta'
  | 'confusa'
  | 'dormindo'
  | 'desconectado'
  | 'procurando'
  | 'timida';

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
  alerta: 'em alerta',
  confusa: 'confusa, sem dado',
  dormindo: 'dormindo',
  desconectado: 'sem conexão com o celular',
  procurando: 'procurando você',
  timida: 'de olhos fechados, sem olhar a sua senha',
};

// ---------- Leitura do JSON ----------

type Linhas = string[];

/** Linhas do JSON ('#' aceso, '.' apagado) → pixels acesos, com deslocamento e recorte na tela. */
function pixelsDe(linhas: Linhas, dx = 0, dy = 0): [number, number][] {
  const px: [number, number][] = [];
  linhas.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) {
      if (linha[x] !== '#') continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < LARGURA && ny >= 0 && ny < ALTURA) px.push([nx, ny]);
    }
  });
  return px;
}

const C = desenhos.carinhas;
const PISCANDO = desenhos.piscando;

function q(linhas: Linhas, ms: number, dx = 0, dy = 0): Quadro {
  return { pixels: pixelsDe(linhas, dx, dy), ms };
}

// ---------- Animações ----------

export const QUADROS: Record<Carinha, Quadro[]> = {
  // Respira devagar e pisca.
  tranquila: [
    q(C.tranquila, 1600),
    q(C.tranquila, 500, 0, -1),
    q(C.tranquila, 1200),
    q(PISCANDO.tranquila, 140),
    q(C.tranquila, 900),
  ],
  // Olha para um lado e para o outro, prestando atenção.
  atenta: [
    q(C.atenta, 900),
    q(C.atenta, 700, -1),
    q(C.atenta, 400),
    q(C.atenta, 700, 1),
    q(C.atenta, 500),
    q(PISCANDO.atenta, 140),
  ],
  // Treme rápido, para um pouco e treme de novo.
  preocupada: [
    q(C.preocupada, 90, -1),
    q(C.preocupada, 90, 1),
    q(C.preocupada, 90, -1),
    q(C.preocupada, 90, 1),
    q(C.preocupada, 1100),
  ],
  // Olhos arregalados e "!": pisca o ponto de exclamação.
  alerta: [q(C.alerta, 500), q(C.alerta, 300, 0, -1)],
  // Sem dado: o "?" balança. Nunca sorri (sem dado não é área tranquila).
  confusa: [q(C.desconhecido, 900), q(C.desconhecido, 500, 0, -1), q(C.desconhecido, 700), q(C.desconhecido, 500, 1)],
  // Respira bem devagar.
  dormindo: [q(C.dormindo, 1500), q(C.dormindo, 1500, 0, 1)],
  desconectado: [q(C.desconectado, 1200), q(C.desconectado, 1200, 0, 1)],
  // Procurando a posição: olha em volta.
  procurando: [
    q(C.atenta, 450, -1),
    q(C.atenta, 450, 1),
    q(C.atenta, 450, -1),
    q(C.atenta, 450, 1),
    q(PISCANDO.atenta, 140),
  ],
  // Enquanto a pessoa digita a senha: olhos fechados, só respira.
  timida: [q(PISCANDO.tranquila, 1600), q(PISCANDO.tranquila, 500, 0, -1)],
};
