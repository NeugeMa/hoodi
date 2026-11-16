import { Alert, type AlertButton } from 'react-native';

/**
 * Confirmação do sistema ("Encerrar trajeto?", "Sair da conta?"…). No celular é o Alert nativo.
 * Existe uma versão .web.ts porque o Alert do React Native não aparece no navegador.
 */
export function perguntar(titulo: string, texto?: string, botoes?: AlertButton[]) {
  Alert.alert(titulo, texto, botoes);
}
