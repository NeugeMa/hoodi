import { Question, ShieldCheck, Warning, WarningCircle, type Icon } from '@/components/icones';
import type { Cores } from '@/theme/tokens';

/** "sem-dado" nunca é tratado como tranquilo (F03 CA4, F07 CA5). */
export type NivelRisco = 'tranquila' | 'medio' | 'alto' | 'sem-dado';

type MetaNivel = {
  /** Nome fixo do estado (design system: "Nomes fixos dos estados"). */
  nome: string;
  /** Rótulo curto. */
  curto: string;
  icone: Icon;
  /** Cor de preenchimento (moldura, mapa). */
  cor: keyof Cores;
  /** Cor do texto do nível sobre papel-elevado. */
  texto: keyof Cores;
  /** Fundo suave do indicador. */
  fundo: keyof Cores;
};

export const NIVEL: Record<NivelRisco, MetaNivel> = {
  tranquila: {
    nome: 'Área tranquila',
    curto: 'Tranquila',
    icone: ShieldCheck,
    cor: 'seguro',
    texto: 'seguroTexto',
    fundo: 'seguroFundo',
  },
  medio: {
    nome: 'Risco médio',
    curto: 'Médio',
    icone: WarningCircle,
    cor: 'atencao',
    texto: 'atencaoTexto',
    fundo: 'atencaoFundo',
  },
  alto: {
    nome: 'Risco alto',
    curto: 'Alto',
    icone: Warning,
    cor: 'capuz',
    texto: 'perigoTexto',
    fundo: 'perigoFundo',
  },
  'sem-dado': {
    nome: 'Sem dado',
    curto: 'Sem dado',
    icone: Question,
    cor: 'papelRebaixado',
    texto: 'grafiteSuave',
    fundo: 'papelRebaixado',
  },
};
