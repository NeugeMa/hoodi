import { celulaEm, nivelNaFaixa } from '@/features/grade/recorte';
import type { Coordenada, FaixaHoraria, GradeRisco } from '@/features/grade/tipos';

import type { ResultadoRotas, RotaAvaliada } from './rotas-api';

/**
 * Regras da comparação (F04, QA v2), em lógica pura:
 * - CA1: rota normal (a mais rápida) x rota de menor risco registrado, diferença em minutos e uma frase.
 * - CA2 (decisão da equipe, 16/11, igual ao contrato da API): compara quando TODAS as rotas têm
 *   pelo menos 70% do caminho com dado. Abaixo disso, o app diz que não sabe comparar e nunca chama
 *   uma rota de "menor risco". Acima, cada cartão mostra quanto do caminho está sem dado
 *   ("10% do caminho sem dado"): sem dado nunca é apresentado como área tranquila.
 * - CA3: nada de "rota segura". CA4: destino fora da área não compara.
 */

/** Cobertura mínima para comparar (a mesma da API: abaixo de 70% de cobertura, dado insuficiente). */
export const COBERTURA_MINIMA = 70;

export type RotaVista = {
  id: string;
  minutos: number;
  metros: number;
  caminho: Coordenada[];
  /** Parte do caminho (%) sem dado de risco; o cartão mostra quando for maior que zero. */
  semDadoPct: number;
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
  const p = r.pontuacao;
  return {
    id: r.rotaId,
    minutos: Math.max(1, Math.round(r.duracaoSegundos / 60)),
    metros: p.metrosTotal,
    caminho: r.geometria ?? [],
    // Sem dado + fora da grade, medidos de verdade (mesmo que a API conte "sem dado" como coberto).
    semDadoPct: Math.round(p.percentualSemDado + p.percentualForaCobertura),
  };
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
  const pontos = amostras(caminho);
  let semDado = 0;
  for (const p of pontos) {
    const celula = celulaEm(grade, p);
    if (!celula) {
      semDado++;
      continue;
    }
    const nivel = nivelNaFaixa(celula, faixa);
    if (nivel === 'sem-dado') semDado++;
    else if (nivel === 'alto') alto.add(celula.id);
    else if (nivel === 'medio') medio.add(celula.id);
  }
  // Parte do caminho sem dado (aproximada pelos pontos amostrados), em %.
  const semDadoPct = pontos.length ? Math.round((semDado / pontos.length) * 100) : 0;
  return { alto: alto.size, medio: medio.size, semDadoPct };
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
  // Inconclusiva por outro motivo que não cobertura ou rota única: não há base para ranquear.
  if (resultado.situacao === 'inconclusiva' && resultado.motivo !== 'cobertura_insuficiente' && resultado.motivo !== 'apenas_uma_rota' && resultado.rotas.length > 1) {
    return { tipo: 'indisponivel' };
  }
  // A API ordenou com outra versão da grade: a grade local não vale para cobertura e frase.
  if (grade && resultado.versaoGrade && grade.versao !== resultado.versaoGrade) grade = null;

  const rotas = resultado.rotas.map((r) => ({ api: r, vista: vista(r) }));
  const doGrade = grade ? rotas.map((r) => celulasDoCaminho(grade, faixa, r.vista.caminho)) : null;
  // A parte sem dado de cada rota: a maior entre a da API e a da grade salva no aparelho.
  rotas.forEach((r, i) => {
    r.vista.semDadoPct = Math.max(r.vista.semDadoPct, doGrade?.[i].semDadoPct ?? 0);
  });

  // CA2: alguma rota com menos de 70% do caminho com dado impede a comparação.
  const coberturaInsuficiente =
    resultado.motivo === 'cobertura_insuficiente' ||
    rotas.some((r) => r.api.pontuacao.dadoInsuficiente || r.vista.semDadoPct > 100 - COBERTURA_MINIMA);
  if (coberturaInsuficiente) return { tipo: 'sem-dado', rotas: rotas.map((r) => r.vista) };

  if (rotas.length === 1) return { tipo: 'uma-rota', rota: rotas[0].vista };

  const normalIdx = rotas.reduce((m, r, i) => (r.api.duracaoSegundos < rotas[m].api.duracaoSegundos ? i : m), 0);
  // Posição 1 da API = menor risco acumulado. Sem posição (ex.: empate), vale a menor pontuação; empatou, fica a mais rápida.
  const melhorPosicao = Math.min(...rotas.map((r) => r.api.posicao ?? Infinity));
  const empatadas = rotas.map((_, i) => i).filter((i) => (rotas[i].api.posicao ?? Infinity) === melhorPosicao);
  const menorIdx = empatadas.includes(normalIdx)
    ? normalIdx
    : empatadas.reduce((m, i) => (rotas[i].api.pontuacao.acumulada < rotas[m].api.pontuacao.acumulada ? i : m), empatadas[0]);

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
  } else if (normal.api.pontuacao.acumulada > 0) {
    const pct = Math.round((1 - menor.api.pontuacao.acumulada / normal.api.pontuacao.acumulada) * 100);
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
