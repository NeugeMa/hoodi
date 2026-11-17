import { cellToBoundary, isValidCell } from 'h3-js';

import type { NivelRisco } from '@/features/risco/nivel';

import type { CelulaGrade, Coordenada, FaixaHoraria, GradeRisco, VersaoGrade } from './tipos';

/**
 * Converte a grade da API (snapshot H3 v2, contrato v0.6) para o formato do app.
 *
 * CSV de /v1/risco/grade: h3_cell,faixa,faixa_nome,status,nivel,pontuacao_mensal,n_registros
 * - status com_dado: nível 0 a 3 (pelo menos 3 registros);
 * - status sem_dado: zero ou 1–2 registros suprimidos (k-anonimato). NUNCA vira nível 0;
 * - fora da grade: o app trata como "sem dado" (a célula não existe na lista).
 * Lógica pura (só usa o h3-js para o contorno do hexágono): testada em testes/grade-e-rotas-v06.test.mjs.
 */

export const CABECALHO_CSV = 'h3_cell,faixa,faixa_nome,status,nivel,pontuacao_mensal,n_registros';

/** Faixas do contrato v2, usadas se o manifesto não trouxer as suas. */
const FAIXAS_PADRAO: FaixaHoraria[] = [
  { id: '0', rotulo: '0h–6h', inicio: 0, fim: 6 },
  { id: '1', rotulo: '6h–12h', inicio: 6, fim: 12 },
  { id: '2', rotulo: '12h–18h', inicio: 12, fim: 18 },
  { id: '3', rotulo: '18h–21h', inicio: 18, fim: 21 },
  { id: '4', rotulo: '21h–24h', inicio: 21, fim: 24 },
];

/**
 * Nível da API (0 a 3) para o nível do app.
 * O app tem três níveis com dado (design system v3). O nível 3 da API ainda não tem nome
 * decidido pela equipe: até lá, aparece como Risco alto (nunca abaixo do que é).
 */
export function nivelDaApi(nivel: number): NivelRisco {
  if (nivel <= 0) return 'tranquila';
  if (nivel === 1) return 'medio';
  return 'alto';
}

/** "[18,21)" → início 18, fim 21. */
export function faixaDoIntervalo(id: number, intervalo: string): FaixaHoraria | null {
  const m = /^\[(\d{1,2}),(\d{1,2})\)$/.exec(intervalo.trim());
  if (!m) return null;
  const inicio = Number(m[1]);
  const fim = Number(m[2]);
  if (inicio < 0 || inicio > 23 || fim < 1 || fim > 24) return null;
  return { id: String(id), rotulo: `${inicio}h–${fim}h`, inicio, fim };
}

function faixasDoManifesto(v: VersaoGrade): FaixaHoraria[] {
  const faixas = (v.manifest?.faixas ?? [])
    .map((f) => faixaDoIntervalo(f.faixa, f.intervalo_horas))
    .filter((f): f is FaixaHoraria => f !== null);
  return faixas.length ? faixas : FAIXAS_PADRAO;
}

/** Contorno do hexágono e o retângulo que o envolve. */
function geometria(h3: string): Pick<CelulaGrade, 'contorno' | 'limites'> {
  const contorno: Coordenada[] = cellToBoundary(h3).map(([latitude, longitude]) => ({ latitude, longitude }));
  const lats = contorno.map((p) => p.latitude);
  const lngs = contorno.map((p) => p.longitude);
  return {
    contorno,
    limites: { norte: Math.max(...lats), sul: Math.min(...lats), leste: Math.max(...lngs), oeste: Math.min(...lngs) },
  };
}

export class CsvInvalido extends Error {}

/** Lê o CSV da API e monta a grade do app. Erro de formato: CsvInvalido (a grade anterior continua valendo). */
export function gradeDoCsv(csv: string, versao: VersaoGrade): GradeRisco {
  const linhas = csv.replace(/\r/g, '').split('\n').filter((l) => l.length > 0);
  if (linhas[0] !== CABECALHO_CSV) throw new CsvInvalido('cabeçalho');

  const celulas = new Map<string, CelulaGrade>();
  for (let i = 1; i < linhas.length; i++) {
    const [h3, faixa, , status, nivel] = linhas[i].split(',');
    if (!h3 || !isValidCell(h3) || !/^[0-4]$/.test(faixa ?? '')) throw new CsvInvalido(`linha ${i + 1}`);
    let celula = celulas.get(h3);
    if (!celula) {
      celula = { id: h3, referencia: '', niveis: {}, ...geometria(h3) };
      celulas.set(h3, celula);
    }
    if (status === 'com_dado') {
      const n = Number(nivel);
      if (!Number.isInteger(n) || n < 0 || n > 3) throw new CsvInvalido(`nível na linha ${i + 1}`);
      celula.niveis[faixa] = nivelDaApi(n);
    } else if (status === 'sem_dado') {
      celula.niveis[faixa] = 'sem-dado';
    } else {
      throw new CsvInvalido(`status na linha ${i + 1}`);
    }
  }
  if (celulas.size === 0) throw new CsvInvalido('vazio');

  const janela = versao.manifest?.janela_dados;
  return {
    versao: versao.versao,
    publicadoEm: versao.publicadoEm,
    fonte: versao.manifest?.fonte?.orgao || 'SSP-SP',
    periodo: janela ? { inicio: janela[0], fim: janela[1] } : undefined,
    faixas: faixasDoManifesto(versao),
    celulas: [...celulas.values()],
  };
}
