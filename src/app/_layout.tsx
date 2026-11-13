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
      <TrajetoProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </TrajetoProvider>
      <StatusBar style={escuro ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
