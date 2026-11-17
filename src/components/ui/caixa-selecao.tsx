import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Check } from '@/components/icones';
import { espaco, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Texto } from './texto';

type Props = {
  marcada: boolean;
  aoMudar: (marcada: boolean) => void;
  /** Texto lido pelo leitor de tela. */
  rotulo: string;
  /** Conteúdo visível; se não vier, mostra o rótulo. */
  children?: ReactNode;
};

/**
 * Caixa de seleção (design system v3): para 18 anos ou mais e o aceite do consentimento.
 * Nunca vem marcada: quem chama começa sempre com `marcada={false}`.
 */
export function CaixaSelecao({ marcada, aoMudar, rotulo, children }: Props) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: marcada }}
      onPress={() => aoMudar(!marcada)}
      style={({ pressed }) => [styles.linha, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <View
        style={[
          styles.caixa,
          { borderColor: cores.grafite, backgroundColor: marcada ? cores.grafite : 'transparent' },
        ]}>
        {marcada ? <Check size={16} color={cores.sobreGrafite} weight="bold" /> : null}
      </View>
      <View style={styles.texto}>{children ?? <Texto>{rotulo}</Texto>}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: tamanho.toqueMin },
  caixa: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1 },
});
