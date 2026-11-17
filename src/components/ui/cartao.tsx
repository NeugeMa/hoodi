import { StyleSheet, View, type ViewProps } from 'react-native';

import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = ViewProps & {
  /** Card de destaque (raio-lg). */
  destaque?: boolean;
};

/** Card em papel-elevado com borda de 1px e sombra sutil. Sem gradiente. */
export function Cartao({ destaque = false, style, ...rest }: Props) {
  const { cores } = useTema();
  return (
    <View
      style={[
        styles.base,
        sombra.suave,
        destaque && styles.destaque,
        { backgroundColor: cores.papelElevado, borderColor: cores.linha },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: raio.md, padding: espaco[4], borderWidth: StyleSheet.hairlineWidth },
  destaque: { borderRadius: raio.lg },
});
