import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoVoltar } from '@/components/pet/cabecalho-voltar';
import { Texto } from '@/components/ui/texto';
import { espaco, raio, sombra } from '@/theme/tokens';
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
};

/**
 * Molde das telas de conta (F01), no mesmo estilo do resto do app:
 * em cima, o título; embaixo, um painel arredondado com os campos e os botões no rodapé.
 * O teclado empurra o painel para cima, sem esconder o campo nem o botão.
 */
export function TelaConta({ titulo, subtitulo, voltar = true, children, rodape }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={styles.topo}>
        {voltar ? <CabecalhoVoltar titulo={titulo} /> : null}
        <View style={styles.textos}>
          <Texto variante="titulo">{titulo}</Texto>
          {subtitulo ? <Texto variante="legenda">{subtitulo}</Texto> : null}
        </View>
      </View>

      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {rodape ? (
          <View style={[styles.rodape, { borderTopColor: cores.linha, paddingBottom: insets.bottom + espaco[3] }]}>
            {rodape}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
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
