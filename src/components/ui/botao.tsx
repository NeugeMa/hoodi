import { Pressable, StyleSheet, View } from 'react-native';

import type { Icon } from '@/components/icones';

import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Texto } from './texto';

type Props = {
  /** Verbo primeiro, até 4 palavras. */
  rotulo: string;
  onPress: () => void;
  /** primario: ação principal (um por tela). secundario: apoio. fantasma: "Agora não" e saídas. */
  variante?: 'primario' | 'secundario' | 'fantasma';
  icone?: Icon;
  desabilitado?: boolean;
  dica?: string;
};

export function Botao({
  rotulo,
  onPress,
  variante = 'primario',
  icone: Icone,
  desabilitado = false,
  dica,
}: Props) {
  const { cores } = useTema();

  const fundo =
    variante === 'primario'
      ? cores.grafite
      : variante === 'secundario'
        ? cores.papelRebaixado
        : 'transparent';
  const texto = variante === 'primario' ? cores.sobreGrafite : cores.grafite;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: fundo,
          opacity: desabilitado ? 0.4 : 1,
          // Toque: encolhe para 98%, sem ripple.
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}>
      <View style={styles.conteudo}>
        {Icone ? <Icone size={tamanho.icone} color={texto} weight="bold" /> : null}
        <Texto variante="corpoForte" style={{ color: texto }}>
          {rotulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tamanho.toquePrincipal,
    borderRadius: raio.md,
    paddingHorizontal: espaco[6],
    justifyContent: 'center',
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[2],
  },
});
