import type { AlertButton } from 'react-native';

/**
 * Versão web (pré-visualização e vídeo no localhost): o Alert do React Native não aparece no navegador,
 * então usa a confirmação do próprio navegador. OK = a ação (o botão que não é "cancel"); Cancelar = nada.
 */
export function perguntar(titulo: string, texto?: string, botoes?: AlertButton[]) {
  const mensagem = texto ? `${titulo}\n\n${texto}` : titulo;
  const acoes = (botoes ?? []).filter((b) => b.style !== 'cancel');
  if (acoes.length === 0) {
    window.alert(mensagem);
    botoes?.[0]?.onPress?.();
    return;
  }
  const acao = acoes[acoes.length - 1];
  if (window.confirm(`${mensagem}\n\n(OK = ${acao.text})`)) acao.onPress?.();
}
