import { Pressable, StyleSheet, View } from 'react-native';

import { Siren } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  contatosConfirmados: number;
  onPress: () => void;
};

/**
 * Pedir ajuda: única ação em vermelho capuz, fixa no Início.
 * Sempre abre uma confirmação com a prévia da mensagem (F09) antes de enviar.
 */
export function BotaoPedirAjuda({ contatosConfirmados, onPress }: Props) {
  const { cores } = useTema();
  const dica =
    contatosConfirmados === 0
      ? 'Você ainda não tem contatos confirmados.'
      : contatosConfirmados === 1
        ? 'Avisa seu contato confirmado. Abre uma confirmação antes de enviar.'
        : `Avisa seus ${contatosConfirmados} contatos confirmados. Abre uma confirmação antes de enviar.`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Pedir ajuda"
      accessibilityHint={dica}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: cores.capuz, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={styles.conteudo}>
        <Siren size={tamanho.icone} color={cores.sobreCapuz} weight="fill" />
        <Texto variante="corpoForte" style={{ color: cores.sobreCapuz }}>
          Pedir ajuda
        </Texto>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: tamanho.toquePrincipal,
    borderRadius: raio.md,
    justifyContent: 'center',
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[2],
  },
});
