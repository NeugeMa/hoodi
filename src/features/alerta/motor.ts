import { celulaEm, nivelNaFaixa } from '@/features/grade/recorte';
import type { CelulaGrade, Coordenada, FaixaHoraria, GradeRisco } from '@/features/grade/tipos';
import type { NivelRisco } from '@/features/risco/nivel';

import { distanciaAteRetanguloM, distanciaM } from './geo';

/**
 * Motor do alerta de risco (F07), em lógica pura: recebe a posição e o estado anterior
 * e devolve o novo estado e, quando for o caso, o alerta. Não mexe em tela nem em GPS.
 *
 * Regras (QA v2, F07):
 * - CA1/CA2: alerta só quando o nível SOBE em relação ao último nível conhecido.
 * - CA3: no mínimo 2 minutos entre dois alertas.
 * - CA4: margem de 30 m na divisa; só troca de célula depois de entrar 30 m na nova.
 * - CA5: "Sem dado" nunca alerta e não conta como nível conhecido.
 */

export const INTERVALO_MINIMO_MS = 2 * 60 * 1000;
export const MARGEM_DIVISA_M = 30;

/** Ordem para comparar níveis. "Sem dado" fica de fora. */
const ORDEM: Record<Exclude<NivelRisco, 'sem-dado'>, number> = { tranquila: 0, medio: 1, alto: 2 };

export type EstadoMotor = {
  /** Célula considerada atual (depois da margem da divisa). */
  celulaId: string | null;
  /** Último nível com dado por onde a pessoa passou. */
  ultimoNivelConhecido: Exclude<NivelRisco, 'sem-dado'> | null;
  /** Momento do último alerta (ms). */
  ultimoAlertaEm: number | null;
};

export const ESTADO_INICIAL: EstadoMotor = { celulaId: null, ultimoNivelConhecido: null, ultimoAlertaEm: null };

export type Alerta = {
  nivel: 'medio' | 'alto';
  /** Rua ou referência da célula. */
  trecho: string;
  /** o quê */
  titulo: string;
  /** onde + o que fazer. Sem ponto de exclamação e sem caixa alta (CA7). */
  texto: string;
};

export type ResultadoMotor = {
  estado: EstadoMotor;
  /** Célula onde a pessoa está; nula se fora da área coberta (F03 CA9). */
  celula: CelulaGrade | null;
  nivel: NivelRisco | null;
  /** Presente só quando deve alertar agora. */
  alerta: Alerta | null;
};

/** Texto do alerta: o quê + onde + o que fazer (F07 CA7). */
export function montarAlerta(nivel: 'medio' | 'alto', trecho: string): Alerta {
  if (nivel === 'alto') {
    return {
      nivel,
      trecho,
      titulo: 'Risco alto nesta área',
      texto: `${trecho}. Mantenha o celular guardado e siga por ruas movimentadas.`,
    };
  }
  return {
    nivel,
    trecho,
    titulo: 'Risco médio nesta área',
    texto: `${trecho}. Seu relógio e o hoodi Pet avisam se o risco subir.`,
  };
}

/** Escolhe a célula atual aplicando a margem da divisa (CA4). */
function celulaComMargem(grade: GradeRisco, p: Coordenada, anteriorId: string | null) {
  const nova = celulaEm(grade, p);
  if (!anteriorId || nova?.id === anteriorId) return nova;
  const anterior = grade.celulas.find((c) => c.id === anteriorId);
  // Ainda a menos de 30 m da célula anterior: continua nela, sem alertar de novo.
  if (anterior && distanciaAteRetanguloM(p, anterior.limites) < MARGEM_DIVISA_M) return anterior;
  return nova;
}

export function processarPosicao(
  grade: GradeRisco,
  faixa: FaixaHoraria | null,
  p: Coordenada,
  anterior: EstadoMotor,
  agora: number,
  emTrajeto: boolean,
): ResultadoMotor {
  const celula = celulaComMargem(grade, p, anterior.celulaId);
  if (!celula) {
    return { estado: { ...anterior, celulaId: null }, celula: null, nivel: null, alerta: null };
  }

  const nivel = nivelNaFaixa(celula, faixa);
  const estado: EstadoMotor = { ...anterior, celulaId: celula.id };
  if (nivel === 'sem-dado') return { estado, celula, nivel, alerta: null };

  const subiu =
    anterior.ultimoNivelConhecido !== null && ORDEM[nivel] > ORDEM[anterior.ultimoNivelConhecido];
  estado.ultimoNivelConhecido = nivel;

  const podeAlertar =
    emTrajeto &&
    subiu &&
    nivel !== 'tranquila' &&
    (anterior.ultimoAlertaEm === null || agora - anterior.ultimoAlertaEm >= INTERVALO_MINIMO_MS);

  if (!podeAlertar) return { estado, celula, nivel, alerta: null };
  estado.ultimoAlertaEm = agora;
  return { estado, celula, nivel, alerta: montarAlerta(nivel as 'medio' | 'alto', celula.referencia) };
}

/** Motivo curto para "Onde você está agora". */
export function motivoDoNivel(nivel: NivelRisco, faixa: FaixaHoraria | null) {
  const quando = faixa ? ` entre ${faixa.rotulo.replace('–', ' e ')}` : '';
  if (nivel === 'alto') return `Muitas ocorrências registradas na SSP-SP${quando}.`;
  if (nivel === 'medio') return `Mais ocorrências registradas na SSP-SP${quando}.`;
  if (nivel === 'tranquila') return `Poucas ocorrências registradas na SSP-SP${quando}.`;
  return '';
}

/**
 * Próximo trecho de maior risco no caminho do trajeto (F05 CA1):
 * a primeira célula de Risco alto à frente (ou de Risco médio, se não houver alto).
 */
export function proximoTrechoDeRisco(
  grade: GradeRisco,
  faixa: FaixaHoraria | null,
  caminho: Coordenada[],
  posicao: Coordenada,
): { rua: string; nivel: 'medio' | 'alto'; distanciaMetros: number } | null {
  if (caminho.length < 2) return null;
  // Ponto do caminho mais perto de onde a pessoa está.
  let inicio = 0;
  let menor = Infinity;
  caminho.forEach((pt, i) => {
    const d = distanciaM(pt, posicao);
    if (d < menor) {
      menor = d;
      inicio = i;
    }
  });

  let percorrido = 0;
  let medio: { rua: string; nivel: 'medio'; distanciaMetros: number } | null = null;
  const atual = celulaEm(grade, posicao)?.id;
  for (let i = inicio + 1; i < caminho.length; i++) {
    percorrido += distanciaM(caminho[i - 1], caminho[i]);
    const c = celulaEm(grade, caminho[i]);
    if (!c || c.id === atual) continue;
    const n = nivelNaFaixa(c, faixa);
    const distanciaMetros = Math.round(percorrido / 10) * 10;
    if (n === 'alto') return { rua: c.referencia, nivel: 'alto', distanciaMetros };
    if (n === 'medio' && !medio) medio = { rua: c.referencia, nivel: 'medio', distanciaMetros };
  }
  return medio;
}
