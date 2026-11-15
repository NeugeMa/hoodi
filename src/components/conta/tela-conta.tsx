import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoVoltar } from '@/components/pet/cabecalho-voltar';
import { TelaPet } from '@/components/pet/tela-pet';
import { Texto } from '@/components/ui/texto';
import type { Carinha } from '@/features/pet/carinhas';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTecladoAberto } from '@/hooks/use-teclado-aberto';
import { useTema } from '@/theme/use-tema';

type Props = {
  /** Título da tela (também é o que o botão de voltar anuncia). */
  titulo: string;
  subtitulo?: string;
  /** Mostra o botão de voltar. */
  voltar?: boolean;
  /** Campos e textos do meio. */
  children: ReactNode;
  /** Botões do rodapé, ao alcance do polegar (no máximo um primário). */
  rodape?: ReactNode;
  /**
   * Telas de entrada (Entrar, Criar conta): o hoodi Pet no topo, como mascote, com o título centralizado.
   * A carinha reage ao que a pessoa faz (ex.: fecha os olhos enquanto ela digita a senha).
   */
  carinha?: Carinha;
  /** Não mostra o título na tela (o leitor de tela continua anunciando). Ex.: Entrar. */
  ocultarTitulo?: boolean;
};

/**
 * Molde das telas de conta (F01), no mesmo estilo do resto do app:
 * em cima, o título; embaixo, um painel arredondado com os campos e os botões no rodapé.
 *
 * Com o teclado aberto, a tela abre espaço para o que está sendo escrito:
 * o Pet encolhe e vai para o lado da marca, a frase some e os botões do rodapé saem
 * (voltam quando o teclado fecha; o "ir" do teclado também envia).
 * No iPhone, a lista rola sozinha para o campo com foco ficar acima do teclado.
 */
export function TelaConta({ titulo, subtitulo, voltar = true, children, rodape, carinha, ocultarTitulo }: Props) {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const teclado = useTecladoAberto();
  const ios = Platform.OS === 'ios';
  const paddingRodape = { paddingBottom: insets.bottom + espaco[3] };

  if (carinha) {
    return (
      <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
        <View style={[styles.topoMascote, teclado ? styles.topoCompacto : null]}>
          {/* Mesma marca em todas as telas de conta: logo e "hoodi", com o voltar ao lado quando há. */}
          <View style={styles.barra}>
            {voltar ? <CabecalhoVoltar titulo={titulo} /> : null}
            <View style={styles.marca} accessible accessibilityRole="header" accessibilityLabel="Hoodi">
              <Image
                source={
                  escuro
                    ? require('@/assets/images/logo-chapeuzinho-contorno.png')
                    : require('@/assets/images/logo-chapeuzinho.png')
                }
                contentFit="contain"
                style={styles.logo}
              />
              <Texto variante="subtitulo">Hoodi</Texto>
            </View>
            {teclado ? (
              <View style={styles.mascotePequeno}>
                <TelaPet carinha={carinha} corMoldura={cores.grafiteApagado} compacta />
              </View>
            ) : null}
          </View>
          {!teclado ? (
            <View style={styles.mascote}>
              <TelaPet carinha={carinha} corMoldura={cores.grafiteApagado} />
            </View>
          ) : null}
          <View style={[styles.textosCentro, teclado ? styles.oculto : null]}>
            {ocultarTitulo ? (
              <Texto variante="titulo" style={styles.oculto}>
                {titulo}
              </Texto>
            ) : (
              <Texto variante="titulo" style={styles.centro}>
                {titulo}
              </Texto>
            )}
            {subtitulo ? (
              <Texto variante="legenda" style={styles.centro}>
                {subtitulo}
              </Texto>
            ) : null}
          </View>
        </View>

        <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
          <ScrollView
            contentContainerStyle={[styles.conteudo, styles.conteudoMascote]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={ios ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets={ios}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {rodape && !teclado ? <View style={[styles.rodapeMascote, paddingRodape]}>{rodape}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={[styles.topo, teclado ? styles.topoCompacto : null]}>
        {voltar ? <CabecalhoVoltar titulo={titulo} /> : null}
        <View style={styles.textos}>
          <Texto variante="titulo">{titulo}</Texto>
          {subtitulo && !teclado ? <Texto variante="legenda">{subtitulo}</Texto> : null}
        </View>
      </View>

      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={ios ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={ios}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {rodape && !teclado ? (
          <View style={[styles.rodape, paddingRodape, { borderTopColor: cores.linha }]}>{rodape}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topoMascote: { paddingHorizontal: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  barra: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  logo: { width: 32, height: 32 },
  mascote: { alignSelf: 'center', width: 168 },
  // Teclado aberto: o Pet vai para a direita da marca, pequeno, e o topo encolhe.
  mascotePequeno: { marginLeft: 'auto', width: 76 },
  topoCompacto: { paddingBottom: espaco[3], gap: 0 },
  textosCentro: { gap: espaco[1], alignItems: 'center' },
  centro: { textAlign: 'center' },
  // Fora da tela, mas lido pelo leitor de tela como cabeçalho.
  oculto: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  conteudoMascote: { paddingTop: espaco[6], gap: espaco[4] },
  rodapeMascote: { paddingHorizontal: espaco[4], paddingTop: espaco[2], gap: espaco[2] },
  topo: { paddingHorizontal: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  textos: { gap: espaco[1] },
  painel: {
    flex: 1,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: espaco[2] },
  conteudo: { paddingHorizontal: espaco[4], paddingTop: espaco[4], paddingBottom: espaco[6], gap: espaco[6] },
  rodape: { paddingHorizontal: espaco[4], paddingTop: espaco[3], gap: espaco[1], borderTopWidth: StyleSheet.hairlineWidth },
});
