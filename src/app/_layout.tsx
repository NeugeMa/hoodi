import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AvisoRisco } from '@/components/alerta/aviso-risco';
import { AcompanhamentoProvider } from '@/features/alerta/acompanhamento-context';
import { ContaProvider, useConta } from '@/features/conta/conta-context';
import { GradeProvider } from '@/features/grade/grade-context';
import { PetProvider } from '@/features/pet/pet-context';
import { TrajetoProvider } from '@/features/trajeto/trajeto-context';
import { useTema } from '@/theme/use-tema';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { cores, escuro } = useTema();
  const [fontesCarregadas, erroFontes] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Se a fonte falhar, o app segue com a fonte do sistema (fallback do design system).
  if (!fontesCarregadas && !erroFontes) return null;

  const base = escuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: { ...base.colors, background: cores.papel, card: cores.papelElevado, text: cores.grafite, border: cores.linha, primary: cores.grafite },
  };

  return (
    <ThemeProvider value={tema}>
      <ContaProvider>
        <GradeProvider>
          <TrajetoProvider>
            <PetProvider>
              <AcompanhamentoProvider>
                <Navegacao />
                {/* Alerta de risco por cima de qualquer tela (F07). */}
                <AvisoRisco />
              </AcompanhamentoProvider>
            </PetProvider>
          </TrajetoProvider>
        </GradeProvider>
      </ContaProvider>
      <StatusBar style={escuro ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

/**
 * Sem conta: só as telas de conta (F01). Com conta: o app.
 * Ao entrar ou sair, o Stack.Protected troca de grupo sozinho e apaga o histórico do outro.
 */
function Navegacao() {
  const { estado } = useConta();
  const logado = estado === 'logado';

  useEffect(() => {
    if (estado !== 'carregando') SplashScreen.hideAsync();
  }, [estado]);

  // Enquanto lê a sessão salva, a splash continua na tela.
  if (estado === 'carregando') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={logado} redirectTo="/boas-vindas">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pet/parear" />
        <Stack.Screen name="pet/conectado" />
        <Stack.Screen name="relogio" />
      </Stack.Protected>
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="(conta)" />
      </Stack.Protected>
    </Stack>
  );
}
