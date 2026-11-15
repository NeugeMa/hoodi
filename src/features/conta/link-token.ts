/**
 * Tira um valor do "#" de um link do hoodi:
 * - token: hoodi://confirmar#token=... e hoodi://redefinir-senha#token=... (e-mail)
 * - codigo: hoodi://convite#codigo=... (convite de contato, F09)
 * Aceita também o valor puro, para quem colar só ele.
 */
function extrairDoLink(texto: string | null | undefined, chave: string, puro: RegExp): string | null {
  if (!texto) return null;
  const limpo = texto.trim();
  const achado = new RegExp(`[#?&]${chave}=([^&\\s]+)`).exec(limpo);
  if (achado) {
    try {
      return decodeURIComponent(achado[1]);
    } catch {
      return achado[1];
    }
  }
  return puro.test(limpo) ? limpo : null;
}

/** Token do e-mail: sem espaços e com o tamanho mínimo da API. */
export function extrairToken(texto: string | null | undefined) {
  return extrairDoLink(texto, 'token', /^[^\s:/#?]{32,512}$/);
}

/** Código do convite: 64 caracteres hexadecimais (a API normaliza para maiúsculas). */
export function extrairCodigoConvite(texto: string | null | undefined) {
  const codigo = extrairDoLink(texto, 'codigo', /^[0-9A-Fa-f]{64}$/);
  return codigo && /^[0-9A-Fa-f]{64}$/.test(codigo) ? codigo.toUpperCase() : null;
}
