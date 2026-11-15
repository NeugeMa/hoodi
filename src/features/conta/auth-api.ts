import { chamarApi } from '@/features/api/cliente';

import { chamarAutenticado } from './sessao';
import type { TokensAuth } from './tipos';

/**
 * Rotas de autenticação da API (/v1/auth). O cadastro tem duas etapas:
 * 1. registrar(email): a API manda um link para o e-mail (hoodi://confirmar#token=...).
 *    A resposta é sempre 202, exista ou não uma conta com o e-mail (não revela quem tem conta).
 * 2. confirmarEmail(token, nome, senha): cria a conta. Depois disso, é só entrar.
 */

export function registrar(email: string) {
  return chamarApi<void>('/v1/auth/registrar', { metodo: 'POST', corpo: { email: email.trim() } });
}

export function confirmarEmail(token: string, nome: string, senha: string) {
  return chamarApi<void>('/v1/auth/confirmar-email', {
    metodo: 'POST',
    corpo: { token, nome: nome.trim(), senha },
  });
}

export function login(email: string, senha: string) {
  return chamarApi<TokensAuth>('/v1/auth/login', { metodo: 'POST', corpo: { email: email.trim(), senha } });
}

/** "Esqueci a senha": manda o link hoodi://redefinir-senha#token=... (sempre 202). */
export function solicitarRedefinicao(email: string) {
  return chamarApi<void>('/v1/auth/solicitar-redefinicao', { metodo: 'POST', corpo: { email: email.trim() } });
}

export function redefinirSenha(token: string, novaSenha: string) {
  return chamarApi<void>('/v1/auth/redefinir-senha', { metodo: 'POST', corpo: { token, novaSenha } });
}

/** Encerra a sessão no servidor e desativa o token de push desta instalação. */
export function sairNoServidor(instalacaoId: string) {
  return chamarAutenticado<void>('/v1/auth/sair', { metodo: 'POST', corpo: { instalacaoId } });
}
