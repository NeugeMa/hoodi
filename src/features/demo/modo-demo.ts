import { Platform } from 'react-native';

/**
 * Modo demonstração: o app roda com dados SIMULADOS, sem API, sem GPS e sem Bluetooth.
 * Serve para gravar o vídeo e tirar prints no navegador (localhost), onde a API não é acessível
 * (sem CORS) e não há GPS nem Bluetooth de verdade.
 *
 * Como ligar:
 * - no navegador: abra http://localhost:8081/?demo=1 (fica ligado até abrir com ?demo=0);
 * - em qualquer lugar: EXPO_PUBLIC_DEMO=1 no .env.
 * Quando ligado, a tela mostra o selo "Demonstração · dados simulados" (nada se passa por real).
 */

const CHAVE = 'hoodi:demo';

function lerDaWeb(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    const parametro = new URLSearchParams(window.location.search).get('demo');
    if (parametro === '1') window.localStorage.setItem(CHAVE, '1');
    if (parametro === '0') window.localStorage.removeItem(CHAVE);
    return window.localStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
}

export const MODO_DEMO: boolean = process.env.EXPO_PUBLIC_DEMO === '1' || lerDaWeb();
