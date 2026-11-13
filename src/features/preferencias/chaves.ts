/**
 * Chaves das preferências salvas no aparelho (tabela preferencias).
 * Fica num arquivo próprio porque é usado pelas versões nativa e web do repositório.
 */
export const PREF = {
  /** A orientação do relógio já apareceu uma vez (F06 CA2). */
  relogioOrientacaoVista: 'relogio_orientacao_vista',
  /** A pessoa confirmou que configurou as notificações no relógio. */
  relogioConfigurado: 'relogio_configurado',
} as const;
