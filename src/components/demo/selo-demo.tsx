import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/components/ui/texto';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Selo fixo do modo demonstração: deixa claro em toda tela (e em todo print ou vídeo)
 * que os dados são simulados. Também marca o relógio como configurado, para a demonstração.
 */
export function SeloDemo() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { atualizarCanais } = useTrajeto();

  useEffect(() => {
    if (MODO_DEMO) atualizarCanais({ relogio: true });
  }, [atualizarCanais]);

  if (!MODO_DEMO) return null;
  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel="Modo demonstração: dados simulados"
      style={[styles.selo, { top: insets.top + 2, backgroundColor: cores.grafite }]}>
      <Texto variante="rotulo" style={{ color: cores.sobreGrafite }}>
        Demonstração · dados simulados
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: espaco[3],
    paddingVertical: 2,
    borderRadius: raio.total,
    opacity: 0.85,
  },
});
