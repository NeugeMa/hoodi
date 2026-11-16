import { celulaEm, nivelNaFaixa } from '@/features/grade/recorte';
import type { Coordenada, FaixaHoraria, GradeRisco } from '@/features/grade/tipos';

import { decodificarPolyline } from './polyline';
import type { ResultadoRotas, RotaAvaliada } from './rotas-api';

/**
 * Regras da comparação (F04, QA v2), em lógica pura:
 * - CA1: rota normal (a mais rápida) x rota de menor risco registrado, diferença em minutos e uma frase.
 * - CA2: se QUALQUER trecho de qualquer rota não tem dado, o app diz que não sabe comparar e
 *   nunca chama uma rota de "menor risco" (mais rígido que a regra de 70% da API).
 * - CA3: nada de "rota segura". CA4: destino fora da área não compara.
 */

export type RotaVista = {
  id: string;
  minutos: number;
  metros: number;
  caminho: Coordenada[];
};

export type Comparacao =
  | {
      tipo: 'comparada';
      normal: RotaVista;
      menorRisco: RotaVista;
      /** A rota mais rápida já é a de menor risco registrado. */
      mesma: boolean;
      /** Minutos a mais da rota de menor risco (0 se for a mesma). */
      diferencaMin: number;
      frase: string;
    }
  | { tipo: 'sem-dado'; rotas: RotaVista[] }
  | { tipo: 'uma-rota'; rota: RotaVista }
  | { tipo: 'fora' }
  | { tipo: 'indisponivel' };

function vista(r: RotaAvaliada): RotaVista {
  let caminho: Coordenada[] = [];
  try {
    caminho = decodificarPolyline(r.geometriaCodificada);
  } catch {
    // Geometria inválida: a rota segue sem desenho.
  }
  return { id: r.rotaId, minutos: Math.max(1, Math.round(r.duracaoSegundos / 60)), metros: r.distanciaMetros, caminho };
}

/** Pontos do caminho mais os pontos do meio de cada trecho, para não pular células pequenas. */
function amostras(caminho: Coordenada[]) {
  const pontos: Coordenada[] = [];
  caminho.forEach((p, i) => {
    pontos.push(p);
    const q = caminho[i + 1];
    if (q) pontos.push({ latitude: (p.latitude + q.latitude) / 2, longitude: (p.longitude + q.longitude) / 2 });
  });
  return pontos;
}

/** Células por onde o caminho passa, por nível, na grade salva no aparelho. */
export function celulasDoCaminho(grade: GradeRisco, faixa: FaixaHoraria | null, caminho: Coordenada[]) {
  const alto = new Set<string>();
  const medio = new Set<string>();
  let semDado = false;
  for (const p of amostras(caminho)) {
    const celula = celulaEm(grade, p);
    if (!celula) {
      semDado = true;
      continue;
    }
    const nivel = nivelNaFaixa(celula, faixa);
    if (nivel === 'sem-dado') semDado = true;
    else if (nivel === 'alto') alto.add(celula.id);
    else if (nivel === 'medio') medio.add(celula.id);
  }
  return { alto: alto.size, medio: medio.size, semDado };
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

export function compararRotas(
  resultado: ResultadoRotas,
  grade: GradeRisco | null,
  faixa: FaixaHoraria | null,
): Comparacao {
  if (resultado.situacao === 'indisponivel' || resultado.rotas.length === 0) {
    return resultado.motivo === 'fora_territorio' ? { tipo: 'fora' } : { tipo: 'indisponivel' };
  }

  const rotas = resultado.rotas.map((r) => ({ api: r, vista: vista(r) }));
  const doGrade = grade ? rotas.map((r) => celulasDoCaminho(grade, faixa, r.vista.caminho)) : null;

  // CA2: qualquer trecho sem dado (pela API ou pela grade do aparelho) impede a comparação.
  const temTrechoSemDado =
    resultado.motivo === 'cobertura_insuficiente' ||
    rotas.some((r) => r.api.percentualSemEstimativa > 0 || r.api.exposicaoRelativa === null) ||
    (doGrade?.some((g) => g.semDado) ?? false);
  if (temTrechoSemDado) return { tipo: 'sem-dado', rotas: rotas.map((r) => r.vista) };

  if (rotas.length === 1) return { tipo: 'uma-rota', rota: rotas[0].vista };

  const normalIdx = rotas.reduce((m, r, i) => (r.api.duracaoSegundos < rotas[m].api.duracaoSegundos ? i : m), 0);
  // Menor exposição; no empate (a API dá a mesma posição), fica a mais rápida.
  const melhorPosicao = Math.min(...rotas.map((r) => r.api.posicao ?? Infinity));
  const empatadas = rotas.map((_, i) => i).filter((i) => (rotas[i].api.posicao ?? Infinity) === melhorPosicao);
  const menorIdx = empatadas.includes(normalIdx)
    ? normalIdx
    : empatadas.reduce((m, i) => ((rotas[i].api.exposicaoRelativa ?? Infinity) < (rotas[m].api.exposicaoRelativa ?? Infinity) ? i : m), empatadas[0]);

  const normal = rotas[normalIdx];
  const menor = rotas[menorIdx];
  if (normalIdx === menorIdx) {
    return {
      tipo: 'comparada',
      normal: normal.vista,
      menorRisco: menor.vista,
      mesma: true,
      diferencaMin: 0,
      frase: 'A rota mais rápida já é a de menor risco registrado.',
    };
  }

  let frase = 'Esta rota passa por trechos com menos risco registrado.';
  if (doGrade) {
    const evitaAlto = doGrade[normalIdx].alto - doGrade[menorIdx].alto;
    const evitaMedio = doGrade[normalIdx].medio - doGrade[menorIdx].medio;
    if (evitaAlto > 0) frase = `Esta rota evita ${plural(evitaAlto, 'célula', 'células')} de risco alto.`;
    else if (evitaMedio > 0) frase = `Esta rota evita ${plural(evitaMedio, 'célula', 'células')} de risco médio.`;
  } else if (normal.api.exposicaoRelativa && menor.api.exposicaoRelativa !== null) {
    const pct = Math.round((1 - menor.api.exposicaoRelativa / normal.api.exposicaoRelativa) * 100);
    if (pct > 0) frase = `Esta rota tem ${pct}% menos risco registrado no caminho.`;
  }

  return {
    tipo: 'comparada',
    normal: normal.vista,
    menorRisco: menor.vista,
    mesma: false,
    diferencaMin: Math.max(0, menor.vista.minutos - normal.vista.minutos),
    frase,
  };
}
