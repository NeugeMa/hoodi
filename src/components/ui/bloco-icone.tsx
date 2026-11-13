import { StyleSheet, View } from 'react-native';

import type { Icon } from '@/components/icones';
import { raio } from '@/theme/tokens';

type Props = {
  icone: Icon;
  fundo: string;
  cor: string;
  tamanho?: number;
};

/** Quadrado arredondado com um ícone no centro, usado no início das linhas de lista. */
export function BlocoIcone({ icone: Icone, fundo, cor, tamanho = 40 }: Props) {
  return (
    <View
      style={[styles.bloco, { width: tamanho, height: tamanho, backgroundColor: fundo }]}
      accessible={false}>
      <Icone size={tamanho * 0.5} color={cor} weight="bold" />
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { borderRadius: raio.sm + 4, alignItems: 'center', justifyContent: 'center' },
});
