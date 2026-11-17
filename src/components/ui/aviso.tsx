import { Pressable, StyleSheet, View } from 'react-native';

import type { Icon } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  icone: Icon;
  titulo: string;
  texto: string;
  /** neutro: sem internet, fora da área. atencao: algo não funcionou. sucesso: deu certo. */
  tom?: 'neutro' | 'atencao' | 'sucesso';
  acao?: { rotulo: string; onPress: () => void };
};

/**
 * Aviso de estado do sistema (design system v3): sem internet, fora da área,
 * pedido enviado ou não enviado. Nunca vermelho.
 */
export function Aviso({ icone: Icone, titulo, texto, tom = 'neutro', acao }: Props) {
  const { cores } = useTema();
  const fundo = tom === 'atencao' ? cores.atencaoFundo : tom === 'sucesso' ? cores.seguroFundo : cores.papelRebaixado;
  const corIcone = tom === 'atencao' ? cores.atencaoTexto : tom === 'sucesso' ? cores.seguroTexto : cores.grafite;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.aviso, { backgroundColor: fundo }]}>
      <View style={styles.linha}>
        <Icone size={22} color={corIcone} weight="bold" />
        <View style={styles.textos}>
          <Texto variante="corpoForte">{titulo}</Texto>
          <Texto variante="legenda">{texto}</Texto>
        </View>
      </View>
      {acao ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={acao.rotulo}
          onPress={acao.onPress}
          style={({ pressed }) => [
            styles.acao,
            {
              backgroundColor: cores.papelElevado,
              borderColor: cores.linha,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}>
          <Texto variante="corpoForte">{acao.rotulo}</Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: { borderRadius: raio.md, padding: espaco[4], gap: espaco[3] },
  linha: { flexDirection: 'row', gap: espaco[3] },
  textos: { flex: 1, gap: 2 },
  acao: {
    alignSelf: 'flex-start',
    marginLeft: 22 + espaco[3],
    minHeight: tamanho.toqueMin,
    paddingHorizontal: espaco[4],
    borderRadius: raio.sm + 4,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
});
