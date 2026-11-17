import { celulaEm, nivelNaFaixa } from '@/features/grade/recorte';
import type { CelulaGrade, Coordenada, FaixaHoraria, GradeRisco } from '@/features/grade/tipos';
import type { NivelRisco } from '@/features/risco/nivel';

import { distanciaAteCelulaM, distanciaM } from './geo';

/**
 * Motor do alerta de risco (F07), em lógica pura: recebe a posição e o estado anterior
 * e devolve o novo estado e, quando for o caso, o alerta. Não mexe em tela nem em GPS.
 *
 * Regras (QA v2, F07):
 * - CA1/CA2: alerta só quando o nível SOBE em relação ao último nível conhecido.
 * - CA3: no mínimo 2 minutos entre dois alertas. Subida bloqueada pelo intervalo fica pendente
 *   e alerta quando o intervalo acaba, se a pessoa ainda estiver acima do nível do último alerta.
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
  /** Nível do último alerta, para o pendente saber se ainda vale. */
  nivelUltimoAlerta: 'medio' | 'alto' | null;
  /** O nível subiu dentro dos 2 minutos: alerta quando o intervalo acabar (CA3). */
  pendente: boolean;
};

export const ESTADO_INICIAL: EstadoMotor = {
  celulaId: null,
  ultimoNivelConhecido: null,
  ultimoAlertaEm: null,
  nivelUltimoAlerta: null,
  pendente: false,
};

export type Alerta = {
  nivel: 'medio' | 'alto';
  /** Rua ou referência da célula. */
  trecho: string;
  /** o quê */
  titulo: string;
  /** onde + o que fazer. Sem ponto de exclamação e sem caixa alta (CA7). */
  texto: string;
  /**
   * Aviso antecipado do próximo trecho de maior risco (antecedência do Perfil, F08 CA1).
   * A pessoa ainda não entrou na área: o aviso some sozinho e não conta como alerta no histórico.
   */
  antecipado?: boolean;
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
      texto: `${trecho ? `${trecho}. ` : ''}Mantenha o celular guardado e siga por ruas movimentadas.`,
    };
  }
  return {
    nivel,
    trecho,
    titulo: 'Risco médio nesta área',
    texto: `${trecho ? `${trecho}. ` : ''}Seu relógio e o Hoodi Pet avisam se o risco subir.`,
  };
}

/** Escolhe a célula atual aplicando a margem da divisa (CA4). */
function celulaComMargem(grade: GradeRisco, p: Coordenada, anteriorId: string | null) {
  const nova = celulaEm(grade, p);
  if (!anteriorId || nova?.id === anteriorId) return nova;
  const anterior = grade.celulas.find((c) => c.id === anteriorId);
  // Ainda a menos de 30 m da célula anterior: continua nela, sem alertar de novo.
  if (anterior && distanciaAteCelulaM(p, anterior) < MARGEM_DIVISA_M) return anterior;
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

  if (!emTrajeto || nivel === 'tranquila') {
    estado.pendente = false;
    return { estado, celula, nivel, alerta: null };
  }

  const intervaloOk = anterior.ultimoAlertaEm === null || agora - anterior.ultimoAlertaEm >= INTERVALO_MINIMO_MS;
  // Voltou ao nível do último alerta (ou abaixo): o pendente perde o sentido.
  if (estado.pendente && estado.nivelUltimoAlerta !== null && ORDEM[nivel] <= ORDEM[estado.nivelUltimoAlerta]) {
    estado.pendente = false;
  }

  const deveAlertar = (subiu || estado.pendente) && intervaloOk;
  if (!deveAlertar) {
    if (subiu) estado.pendente = true; // bloqueado pelo intervalo (CA3): fica para depois
    return { estado, celula, nivel, alerta: null };
  }
  estado.ultimoAlertaEm = agora;
  estado.nivelUltimoAlerta = nivel;
  estado.pendente = false;
  return { estado, celula, nivel, alerta: montarAlerta(nivel, celula.referencia) };
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
): ProximoTrecho | null {
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
  let medio: ProximoTrecho | null = null;
  const atual = celulaEm(grade, posicao)?.id;
  for (let i = inicio + 1; i < caminho.length; i++) {
    percorrido += distanciaM(caminho[i - 1], caminho[i]);
    const c = celulaEm(grade, caminho[i]);
    if (!c || c.id === atual) continue;
    const n = nivelNaFaixa(c, faixa);
    const distanciaMetros = Math.round(percorrido / 10) * 10;
    if (n === 'alto') return { rua: c.referencia, nivel: 'alto', distanciaMetros, celulaId: c.id };
    if (n === 'medio' && !medio) medio = { rua: c.referencia, nivel: 'medio', distanciaMetros, celulaId: c.id };
  }
  return medio;
}

export type ProximoTrecho = {
  rua: string;
  nivel: 'medio' | 'alto';
  distanciaMetros: number;
  /** Célula do trecho: um aviso por célula, mesmo quando a grade não traz o nome da rua. */
  celulaId?: string;
};

/** Aviso antecipado: o quê + onde + o que fazer, com a distância em metros (design system v3). */
export function montarAvisoAntecipado(trecho: ProximoTrecho): Alerta {
  const nome = trecho.nivel === 'alto' ? 'Risco alto' : 'Risco médio';
  const fazer =
    trecho.nivel === 'alto' ? 'Mantenha o celular guardado e siga por ruas movimentadas.' : 'Fique atento ao caminho.';
  return {
    nivel: trecho.nivel,
    trecho: trecho.rua,
    titulo: `${nome} à frente`,
    texto: `${trecho.rua ? `${trecho.rua}, em` : 'Em'} ${trecho.distanciaMetros} m. ${fazer}`,
    antecipado: true,
  };
}

/**
 * Avisa uma vez por trecho quando o próximo trecho de maior risco fica a menos da antecedência
 * escolhida no Perfil (100, 300 ou 600 m) e é mais arriscado que onde a pessoa está agora.
 * `avisados` guarda os trechos já avisados neste trajeto.
 */
export function avaliarAvisoAntecipado(
  proximo: ProximoTrecho | null,
  nivelAtual: NivelRisco | null,
  antecedenciaM: number,
  avisados: Set<string>,
): Alerta | null {
  if (!proximo || proximo.distanciaMetros <= 0 || proximo.distanciaMetros > antecedenciaM) return null;
  const atual = nivelAtual && nivelAtual !== 'sem-dado' ? ORDEM[nivelAtual] : -1;
  if (ORDEM[proximo.nivel] <= atual) return null;
  const chave = `${proximo.celulaId ?? proximo.rua}|${proximo.nivel}`;
  if (avisados.has(chave)) return null;
  avisados.add(chave);
  return montarAvisoAntecipado(proximo);
}
