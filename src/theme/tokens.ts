/**
 * Tokens do hoodi · design system v2.
 * Nomes iguais aos do PDF do design system para facilitar a conferência.
 */

export const cores = {
  claro: {
    papel: '#F5F4F1',
    papelElevado: '#FFFFFF',
    papelRebaixado: '#ECEAE5',
    linha: '#E2E0DA',
    grafite: '#1C1C21',
    grafiteSuave: '#5E5E66',
    grafiteApagado: '#8A8A92',
    sobreGrafite: '#FFFFFF',
    capuz: '#E5020E',
    sobreCapuz: '#FFFFFF',
    perigoTexto: '#B3000B',
    perigoFundo: '#FCE8E8',
    atencao: '#E8A317',
    sobreAtencao: '#1C1C21',
    atencaoTexto: '#8A5A00',
    atencaoFundo: '#FBF0D9',
    seguro: '#1F7A6B',
    sobreSeguro: '#FFFFFF',
    seguroTexto: '#17604F',
    seguroFundo: '#E3F1EE',
    foco: '#1C1C21',
  },
  escuro: {
    papel: '#121215',
    papelElevado: '#1C1C21',
    papelRebaixado: '#26262C',
    linha: '#2E2E35',
    grafite: '#F2F1EE',
    grafiteSuave: '#A3A3AB',
    grafiteApagado: '#7A7A83',
    sobreGrafite: '#121215',
    capuz: '#E5020E',
    sobreCapuz: '#FFFFFF',
    perigoTexto: '#FF6B6B',
    perigoFundo: '#3A1416',
    atencao: '#F0B43A',
    sobreAtencao: '#1C1C21',
    atencaoTexto: '#F0B43A',
    atencaoFundo: '#352810',
    seguro: '#3FB39D',
    sobreSeguro: '#0D1F1B',
    seguroTexto: '#5FC7B1',
    seguroFundo: '#12302A',
    foco: '#F2F1EE',
  },
} as const;

export type Cores = { [K in keyof typeof cores.claro]: string };

/** Grade de 4px. */
export const espaco = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const;

export const raio = {
  sm: 8,
  md: 16,
  lg: 24,
  total: 999,
} as const;

export const tamanho = {
  toqueMin: 48,
  toquePrincipal: 56,
  icone: 24,
} as const;

/**
 * Sombra sutil + borda limpa (sem gradientes). No tema escuro a sombra quase não aparece,
 * então a borda de 1px em `linha` é quem separa o card do fundo.
 */
export const sombra = {
  suave: {
    shadowColor: '#1C1C21',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const fontes = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/** Estilos de texto. O tracking do PDF está em em; aqui já convertido em px. */
export const tipografia = {
  display: { fontFamily: fontes.bold, fontSize: 32, lineHeight: 36, letterSpacing: -0.96 },
  titulo: { fontFamily: fontes.bold, fontSize: 24, lineHeight: 28, letterSpacing: -0.48 },
  subtitulo: { fontFamily: fontes.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.18 },
  corpo: { fontFamily: fontes.regular, fontSize: 16, lineHeight: 24 },
  corpoForte: { fontFamily: fontes.semibold, fontSize: 16, lineHeight: 24 },
  legenda: { fontFamily: fontes.medium, fontSize: 14, lineHeight: 20 },
  rotulo: { fontFamily: fontes.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
} as const;

export type VarianteTexto = keyof typeof tipografia;
