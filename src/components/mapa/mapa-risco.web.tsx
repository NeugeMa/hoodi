import { StyleSheet, View } from 'react-native';

import { MapTrifold } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import type { MapaRiscoProps } from './mapa-risco';

/**
 * Versão web, só para a pré-visualização no navegador: o mapa nativo
 * (react-native-maps) não roda na web. No celular aparece o mapa de verdade.
 */
export function MapaRisco({ margemInferior, margemSuperior }: MapaRiscoProps) {
  const { cores } = useTema();
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.fundo,
        { backgroundColor: cores.papelRebaixado, paddingTop: margemSuperior, paddingBottom: margemInferior },
      ]}>
      <MapTrifold size={40} color={cores.grafiteApagado} weight="regular" />
      <Texto variante="legenda" style={styles.texto}>
        O mapa aparece no celular (Expo Go).{'\n'}No navegador, só o painel funciona.
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: { alignItems: 'center', justifyContent: 'center', gap: espaco[2] },
  texto: { textAlign: 'center' },
});
