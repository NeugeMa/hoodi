import { Pressable, StyleSheet } from 'react-native';

import { tamanho } from '@/theme/tokens';

import { Texto } from './texto';

type Props = {
  rotulo: string;
  onPress: () => void;
  dica?: string;
  /** Alinhamento do link na linha. */
  alinhar?: 'inicio' | 'centro' | 'fim';
};

/**
 * Link em texto (ex.: "Esqueci a senha", "Criar conta"): sublinhado, com alvo de toque de 48px.
 * Para ações secundárias que não merecem um botão.
 */
export function LinkTexto({ rotulo, onPress, dica, alinhar = 'inicio' }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.link,
        { alignSelf: alinhar === 'centro' ? 'center' : alinhar === 'fim' ? 'flex-end' : 'flex-start', opacity: pressed ? 0.6 : 1 },
      ]}>
      <Texto variante="corpoForte" style={styles.texto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: tamanho.toqueMin, justifyContent: 'center' },
  texto: { textDecorationLine: 'underline' },
});
