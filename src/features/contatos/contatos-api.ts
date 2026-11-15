import { chamarAutenticado } from '@/features/conta/sessao';

import type { ConvitePendente, NovoConvite, Vinculo } from './tipos';

/**
 * Contatos de segurança (/v1/contatos). Funciona por convite entre contas do hoodi:
 * 1. Quem pede ajuda cria um convite e manda o link hoodi://convite#codigo=... para a pessoa.
 * 2. A pessoa abre o link no hoodi dela e aceita (ou recusa).
 * 3. Com o aceite, nasce o vínculo e ela passa a receber os pedidos de ajuda.
 */

export function listarVinculos() {
  return chamarAutenticado<Vinculo[]>('/v1/contatos');
}

export function listarConvitesPendentes() {
  return chamarAutenticado<ConvitePendente[]>('/v1/contatos/convites');
}

export function criarConvite() {
  return chamarAutenticado<NovoConvite>('/v1/contatos/convites', { metodo: 'POST' });
}

export function cancelarConvite(conviteId: string) {
  return chamarAutenticado<void>(`/v1/contatos/convites/${encodeURIComponent(conviteId)}`, { metodo: 'DELETE' });
}

/**
 * Aceitar devolve o vínculo (200). Recusar não devolve nada (204).
 * Erros: 409 = convite expirado, usado ou vínculo que já existe; 422 VINCULO_PROPRIO = convite seu.
 */
export function responderConvite(codigo: string, decisao: 'aceitar' | 'rejeitar') {
  return chamarAutenticado<Vinculo | undefined>('/v1/contatos/convites/resgatar', {
    metodo: 'POST',
    corpo: { codigo, decisao },
  });
}

/** Desfaz o vínculo, de qualquer um dos lados (F09 CA9: o contato pode sair). */
export function removerVinculo(vinculoId: string) {
  return chamarAutenticado<void>(`/v1/contatos/${encodeURIComponent(vinculoId)}`, { metodo: 'DELETE' });
}
