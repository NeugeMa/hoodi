/**
 * Tira o token de um link do e-mail (hoodi://confirmar#token=... ou hoodi://redefinir-senha#token=...).
 * Aceita também o token puro, para quem colar só ele.
 */
export function extrairToken(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const limpo = texto.trim();
  const achado = /[#?&]token=([^&\s]+)/.exec(limpo);
  if (achado) {
    try {
      return decodeURIComponent(achado[1]);
    } catch {
      return achado[1];
    }
  }
  // Token puro: sem espaços e com o tamanho mínimo da API.
  return /^[^\s:/#?]{32,512}$/.test(limpo) ? limpo : null;
}
