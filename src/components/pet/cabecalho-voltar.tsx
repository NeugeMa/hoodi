import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { CaretLeft } from '@/components/icones';
import { espaco, raio, sombra, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Botão redondo de voltar, no topo das telas que não são abas.
 * Sem título visível; o leitor de tela anuncia para onde ele volta.
 */
export function CabecalhoVoltar({ titulo }: { titulo: string }) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voltar. Você está em ${titulo}`}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => [
        styles.voltar,
        sombra.suave,
        { backgroundColor: cores.papelElevado, borderColor: cores.linha, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}>
      <CaretLeft size={20} color={cores.grafite} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  voltar: {
    alignSelf: 'flex-start',
    width: tamanho.toqueMin,
    height: tamanho.toqueMin,
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco[1],
  },
});
