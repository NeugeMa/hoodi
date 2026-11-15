/** Contratos de contatos da API (v0.5.2), em camelCase como a API devolve. */

/** Vínculo A → B: A (titular) pede ajuda, B (contato) recebe. Só existe depois do aceite. */
export type Vinculo = {
  id: string;
  titularId: string;
  contatoId: string;
  estado: 'aceito' | 'revogado';
  direcao: 'titular_para_contato';
  /** Nome atual do OUTRO participante, sem e-mail. */
  nomeExibicao: string;
  /** titular: a pessoa é quem pede ajuda. contato: a pessoa recebe os pedidos do outro. */
  papelDoSolicitante: 'titular' | 'contato';
};

/** Resposta de POST /v1/contatos/convites. O código só volta desta vez. */
export type NovoConvite = {
  conviteId: string;
  codigo: string;
  expiraEm: string;
  direcao: 'titular_para_contato';
};

export type ConvitePendente = {
  conviteId: string;
  expiraEm: string;
  estado: 'pendente';
  direcao: 'titular_para_contato';
};

/**
 * Limite do QA (F09 CA3): no máximo 5 contatos, contando os convites pendentes.
 * A API ainda não aplica esse limite; o app aplica.
 */
export const MAX_CONTATOS = 5;

export function linkDoConvite(codigo: string) {
  return `hoodi://convite#codigo=${codigo}`;
}
