import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Diz se o teclado está na tela. No iPhone avisa antes de ele subir ("will"), para a tela
 * se ajustar junto; no Android, depois ("did"), que é o único evento disponível.
 */
export function useTecladoAberto() {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const abrir = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setAberto(true));
    const fechar = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setAberto(false));
    return () => {
      abrir.remove();
      fechar.remove();
    };
  }, []);
  return aberto;
}
