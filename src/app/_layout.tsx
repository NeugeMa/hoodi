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

  useEffect(() => {
    if (fontesCarregadas || erroFontes) SplashScreen.hideAsync();
  }, [fontesCarregadas, erroFontes]);

  // Se a fonte falhar, o app segue com a fonte do sistema (fallback do design system).
  if (!fontesCarregadas && !erroFontes) return null;

  const base = escuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: { ...base.colors, background: cores.papel, card: cores.papelElevado, text: cores.grafite, border: cores.linha, primary: cores.grafite },
  };

  return (
    <ThemeProvider value={tema}>
      <GradeProvider>
        <TrajetoProvider>
          <PetProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pet/parear" />
              <Stack.Screen name="pet/conectado" />
              <Stack.Screen name="relogio" />
            </Stack>
          </PetProvider>
        </TrajetoProvider>
      </GradeProvider>
      <StatusBar style={escuro ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
