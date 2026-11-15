/** Contratos de autenticação da API (v0.5.x), em camelCase como a API devolve. */

export type UsuarioResumo = { id: string; nome: string; email: string };

/** Resposta de /v1/auth/login e /v1/auth/renovar. */
export type TokensAuth = {
  accessToken: string;
  tokenType: string;
  expiraEm: string;
  usuario: UsuarioResumo;
  refreshToken: string;
  expiraRefreshEm: string;
};

/** O que o app guarda da sessão (no SecureStore). */
export type Sessao = {
  accessToken: string;
  /** Data ISO em que o access token expira (60 min). */
  expiraEm: string;
  refreshToken: string;
  expiraRefreshEm: string;
  usuario: UsuarioResumo;
};

export function sessaoDeTokens(t: TokensAuth): Sessao {
  return {
    accessToken: t.accessToken,
    expiraEm: t.expiraEm,
    refreshToken: t.refreshToken,
    expiraRefreshEm: t.expiraRefreshEm,
    usuario: t.usuario,
  };
}

/** Regra de senha da API: de 10 a 128 caracteres. */
export const SENHA_MIN = 10;
export const NOME_MIN = 2;

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
