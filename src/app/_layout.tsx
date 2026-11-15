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
import { usePushPedidosAjuda } from '@/features/ajuda/push';
import { AcompanhamentoProvider } from '@/features/alerta/acompanhamento-context';
import { ContaProvider, useConta } from '@/features/conta/conta-context';
import { ContatosProvider } from '@/features/contatos/contatos-context';
import { GradeProvider } from '@/features/grade/grade-context';
import { PetProvider } from '@/features/pet/pet-context';
import { PreferenciasProvider } from '@/features/preferencias/preferencias-context';
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
        <PreferenciasProvider>
          <GradeProvider>
            <TrajetoProvider>
              <ContatosProvider>
                <PetProvider>
                  <AcompanhamentoProvider>
                    <Navegacao />
                    {/* Alerta de risco por cima de qualquer tela (F07). */}
                    <AvisoRisco />
                  </AcompanhamentoProvider>
                </PetProvider>
              </ContatosProvider>
            </TrajetoProvider>
          </GradeProvider>
        </PreferenciasProvider>
      </ContaProvider>
      <StatusBar style={escuro ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

/**
 * O app abre sempre no Início. Sem conta, dá para usar Início, Mapa, Histórico e o hoodi Pet;
 * Contatos e Pedir ajuda pedem para entrar (F01). O Stack.Protected cuida dos desvios.
 */
function Navegacao() {
  const { estado } = useConta();
  const logado = estado === 'logado';
  // Push dos pedidos de ajuda (F09): registra o aparelho e abre o pedido ao tocar no aviso.
  usePushPedidosAjuda(logado);

  useEffect(() => {
    if (estado !== 'carregando') SplashScreen.hideAsync();
  }, [estado]);

  // Enquanto lê a sessão salva, a splash continua na tela.
  if (estado === 'carregando') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* O app abre sempre no Início, com ou sem conta. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pet/parear" />
      <Stack.Screen name="pet/conectado" />
      <Stack.Screen name="relogio" />
      <Stack.Screen name="privacidade" />
      {/* Só o que depende da conta pede login: contatos e pedido de ajuda (F09) e rotas (F04, a API exige conta). */}
      <Stack.Protected guard={logado} redirectTo="/entrar">
        <Stack.Screen name="comparar-rotas" />
        <Stack.Screen name="contatos" />
        <Stack.Screen name="pedir-ajuda" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ajuda/[id]" />
      </Stack.Protected>
      {/* Telas de conta só sem conta; ao entrar, saem sozinhas e o app volta para onde estava. */}
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="(conta)" />
      </Stack.Protected>
      {/* Fora das proteções para o link do convite não se perder sem conta (a tela explica). */}
      <Stack.Screen name="convite" />
    </Stack>
  );
}
