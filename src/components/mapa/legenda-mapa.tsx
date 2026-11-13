import { StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Sempre na mesma ordem (design system v3). */
const ORDEM: NivelRisco[] = ['tranquila', 'medio', 'alto', 'sem-dado'];

/** Legenda compacta do mapa, numa linha: as mesmas cores das células e do trajeto. */
export function LegendaMapa() {
  const { cores } = useTema();
  return (
    <View style={styles.legenda} accessibilityRole="list">
      {ORDEM.map((n) => (
        <View key={n} style={styles.item} accessible accessibilityLabel={NIVEL[n].nome}>
          <View
            style={[styles.amostra, { backgroundColor: n === 'sem-dado' ? cores.grafiteApagado : cores[NIVEL[n].cor] }]}
          />
          <Texto variante="rotulo" cor="grafiteSuave">
            {NIVEL[n].curto}
          </Texto>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: espaco[2] },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco[1] },
  amostra: { width: 10, height: 10, borderRadius: 5 },
});
