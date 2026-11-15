import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Check } from '@/components/icones';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Botao } from './botao';
import { Texto } from './texto';

type Opcao<T> = { valor: T; rotulo: string; detalhe?: string };

type Props<T> = {
  visivel: boolean;
  titulo: string;
  opcoes: Opcao<T>[];
  valor: T;
  aoEscolher: (valor: T) => void;
  aoFechar: () => void;
};

/** Folha de baixo para escolher uma opção (preferências do Perfil). Escolher já salva e fecha. */
export function Seletor<T extends string | number>({ visivel, titulo, opcoes, valor, aoEscolher, aoFechar }: Props<T>) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar}>
      <Pressable accessibilityLabel="Fechar" style={styles.fundo} onPress={aoFechar} />
      <View style={[styles.folha, { backgroundColor: cores.papelElevado, paddingBottom: insets.bottom + espaco[3] }]}>
        <Texto variante="subtitulo" accessibilityRole="header">
          {titulo}
        </Texto>
        <View accessibilityRole="radiogroup">
          {opcoes.map((o) => {
            const marcada = o.valor === valor;
            return (
              <Pressable
                key={String(o.valor)}
                accessibilityRole="radio"
                accessibilityLabel={o.detalhe ? `${o.rotulo}. ${o.detalhe}` : o.rotulo}
                accessibilityState={{ selected: marcada }}
                onPress={() => {
                  aoEscolher(o.valor);
                  aoFechar();
                }}
                style={({ pressed }) => [styles.opcao, { borderBottomColor: cores.linha, opacity: pressed ? 0.7 : 1 }]}>
                <View style={styles.textos}>
                  <Texto variante="corpoForte">{o.rotulo}</Texto>
                  {o.detalhe ? <Texto variante="legenda">{o.detalhe}</Texto> : null}
                </View>
                {marcada ? <Check size={22} color={cores.grafite} weight="bold" /> : null}
              </Pressable>
            );
          })}
        </View>
        <Botao rotulo="Fechar" variante="fantasma" onPress={aoFechar} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    paddingHorizontal: espaco[4],
    paddingTop: espaco[6],
    gap: espaco[3],
  },
  opcao: {
    minHeight: tamanho.toquePrincipal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    paddingVertical: espaco[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textos: { flex: 1, gap: 2 },
});
