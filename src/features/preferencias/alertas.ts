/**
 * Preferências de alerta do Perfil (F08 CA1): como a pessoa quer receber os avisos.
 * Ficam no aparelho (tabela preferencias) e valem depois de fechar e abrir o app (CA2).
 */

export type Antecedencia = 100 | 300 | 600;
/** sempre: em qualquer horário. noite: só entre 18h e 6h, quando o risco do trajeto a pé é maior. */
export type HorarioAlertas = 'sempre' | 'noite';

export type PreferenciasAlerta = {
  /**
   * Avisar no celular também: o celular vibra junto com o Hoodi Pet em todo alerta
   * (para quem leva o Pet na mochila). Sem o Pet conectado, o celular vibra de qualquer jeito.
   */
  avisarNoCelular: boolean;
  /** Som na notificação do celular (o relógio segue o próprio aparelho). */
  som: boolean;
  /** Com quantos metros de antecedência avisar do próximo trecho de maior risco. */
  antecedencia: Antecedencia;
  horario: HorarioAlertas;
};

/** Padrão discreto: vibra, sem som (o aviso é para o celular continuar no bolso). */
export const PREFERENCIAS_PADRAO: PreferenciasAlerta = {
  avisarNoCelular: false,
  som: false,
  antecedencia: 300,
  horario: 'sempre',
};

export const OPCOES_ANTECEDENCIA: { valor: Antecedencia; rotulo: string; detalhe: string }[] = [
  { valor: 100, rotulo: '100 m', detalhe: 'Cerca de 1 minuto a pé' },
  { valor: 300, rotulo: '300 m', detalhe: 'Cerca de 4 minutos a pé' },
  { valor: 600, rotulo: '600 m', detalhe: 'Cerca de 8 minutos a pé' },
];

export const OPCOES_HORARIO: { valor: HorarioAlertas; rotulo: string; detalhe: string }[] = [
  { valor: 'sempre', rotulo: 'Sempre', detalhe: 'Avisa em qualquer horário do trajeto' },
  { valor: 'noite', rotulo: 'Só à noite', detalhe: 'Entre 18h e 6h' },
];

export function rotuloDe<T>(opcoes: { valor: T; rotulo: string }[], valor: T) {
  return opcoes.find((o) => o.valor === valor)?.rotulo ?? '';
}

/** O horário escolhido permite alertar agora? */
export function horarioPermite(horario: HorarioAlertas, agora = new Date()) {
  if (horario === 'sempre') return true;
  const h = agora.getHours();
  return h >= 18 || h < 6;
}

export function lerPreferenciasDeTexto(texto: string | null): PreferenciasAlerta {
  if (!texto) return PREFERENCIAS_PADRAO;
  try {
    return { ...PREFERENCIAS_PADRAO, ...(JSON.parse(texto) as Partial<PreferenciasAlerta>) };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}
