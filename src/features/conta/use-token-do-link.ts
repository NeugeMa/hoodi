import { useLinkingURL } from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';

import { extrairToken } from './link-token';

/**
 * Token das telas abertas pelo link do e-mail.
 * O link vem com o token depois do "#" (hoodi://confirmar#token=...), que não vira parâmetro da rota;
 * por isso lê também a URL que abriu o app, desde que seja o link desta tela.
 * Quem cola o link manda o token como parâmetro.
 */
export function useTokenDoLink(acao: 'confirmar' | 'redefinir-senha') {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const url = useLinkingURL();
  const urlDestaTela = url && new RegExp(`[:/]${acao}(?=[#?/]|$)`).test(url) ? url : null;
  return extrairToken(token) ?? extrairToken(urlDestaTela);
}
