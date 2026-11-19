/**
 * Chaves das preferências salvas no aparelho (tabela preferencias).
 * Fica num arquivo próprio porque é usado pelas versões nativa e web do repositório.
 */
export const PREF = {
  /** A orientação do relógio já apareceu uma vez (F06 CA2). */
  relogioOrientacaoVista: 'relogio_orientacao_vista',
  /** A pessoa confirmou que configurou as notificações no relógio. */
  relogioConfigurado: 'relogio_configurado',
  /** A tela de Permissões já apareceu uma vez (F02). */
  permissoesVistas: 'permissoes_vistas',
  /** O Bluetooth já foi pedido ao sistema (no iPhone, só sabemos o estado depois do pedido). */
  bluetoothPedido: 'bluetooth_pedido',
  /** Tema do app: sistema, claro ou escuro (F02 CA5). */
  tema: 'tema',
  /** Dia (AAAA-MM-DD) em que a sugestão do tema escuro foi dispensada. */
  sugestaoTemaDispensadaEm: 'sugestao_tema_dispensada_em',
  /** E-mail do cadastro em andamento (aguardando o link do e-mail). Usado para entrar depois. */
  cadastroEmail: 'cadastro_email',
  /** Nome do cadastro em andamento, para preencher a confirmação se o app for fechado no meio. */
  cadastroNome: 'cadastro_nome',
  /** Último e-mail que entrou, para preencher o campo de Entrar. */
  ultimoEmail: 'ultimo_email',
  /** Data ISO em que a pessoa confirmou ter 18 anos ou mais (F01 CA1, CA6). */
  maioridadeConfirmadaEm: 'maioridade_confirmada_em',
  /** Data ISO em que a pessoa aceitou o consentimento LGPD (F01 CA1, CA5). */
  consentimentoEm: 'consentimento_em',
  /** Identificador desta instalação do app (sair e token de push). */
  instalacaoId: 'instalacao_id',
  /** Horários (ISO, JSON) dos pedidos de ajuda da última hora, para o limite de 3 por hora (F09 CA7). */
  pedidosAjuda: 'pedidos_ajuda',
  /** A pessoa ligou o alerta em segundo plano (localização com a tela apagada). Valor '1'. */
  segundoPlano: 'segundo_plano',
  /** Preferências de alerta do Perfil (F08 CA1, CA2), em JSON: vibração, som, antecedência e horário. */
  alertas: 'preferencias_alertas',
} as const;
