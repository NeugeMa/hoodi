import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Texto } from './texto';

type Props = {
  titulo: string;
  /** Feature do Azure Boards que esta tela atende. Ex.: "F03". */
  feature: string;
};

/** Tela provisória para as abas que ainda não foram construídas. */
export function EmProducao({ titulo, feature }: Props) {
  const { cores } = useTema();
  return (
    <SafeAreaView edges={['top']} style={[styles.tela, { backgroundColor: cores.papel }]}>
      <View style={styles.conteudo}>
        <Texto variante="titulo">{titulo}</Texto>
        <Texto cor="grafiteSuave">Esta tela ainda está em produção ({feature}).</Texto>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: espaco[4], paddingTop: espaco[12], gap: espaco[2] },
});
