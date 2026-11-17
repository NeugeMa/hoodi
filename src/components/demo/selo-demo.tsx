import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/components/ui/texto';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Altura da faixa do selo: as telas descem isso no modo demonstração. */
const FAIXA = 26;

/**
 * Modo demonstração: uma faixa no topo com o selo "Demonstração · dados simulados", em toda tela
 * (e em todo print ou vídeo). As telas descem a altura da faixa, então o selo não cobre nada.
 * Também marca o relógio como configurado, para a demonstração. Fora do modo, não faz nada.
 */
export function MolduraDemo({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { atualizarCanais } = useTrajeto();

  useEffect(() => {
    if (MODO_DEMO) atualizarCanais({ relogio: true });
  }, [atualizarCanais]);

  if (!MODO_DEMO) return <>{children}</>;
  return (
    <SafeAreaInsetsContext.Provider value={{ ...insets, top: insets.top + FAIXA }}>
      {children}
      <View
        pointerEvents="none"
        accessible
        accessibilityLabel="Modo demonstração: dados simulados"
        style={[styles.faixa, { height: insets.top + FAIXA, paddingTop: insets.top, backgroundColor: cores.papel }]}>
        <View style={[styles.selo, { backgroundColor: cores.grafite }]}>
          <Texto variante="rotulo" style={{ color: cores.sobreGrafite }}>
            Demonstração · dados simulados
          </Texto>
        </View>
      </View>
    </SafeAreaInsetsContext.Provider>
  );
}

const styles = StyleSheet.create({
  faixa: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  selo: { paddingHorizontal: espaco[3], paddingVertical: 2, borderRadius: raio.total },
});
