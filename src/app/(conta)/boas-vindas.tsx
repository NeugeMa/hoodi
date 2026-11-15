import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Boas-vindas (F01, F02 CA1): o que o hoodi faz, numa frase, e de onde vem o risco.
 * Primeira tela de quem ainda não tem conta neste celular.
 */
export default function BoasVindasScreen() {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tela,
        { backgroundColor: cores.papel, paddingTop: insets.top + espaco[12], paddingBottom: insets.bottom + espaco[4] },
      ]}>
      <View style={styles.meio}>
        <Image
          source={
            escuro
              ? require('@/assets/images/logo-chapeuzinho-contorno.png')
              : require('@/assets/images/logo-chapeuzinho.png')
          }
          contentFit="contain"
          style={styles.logo}
          accessibilityLabel="Logo do hoodi"
        />
        <View style={styles.textos}>
          <Texto variante="display">hoodi</Texto>
          <Texto>
            O hoodi avisa no relógio e no hoodi Pet quando você entra numa área de risco maior no seu trajeto a pé.
            Assim o celular fica no bolso.
          </Texto>
          <Texto variante="legenda">
            O risco vem de registros da SSP-SP. É o melhor dado disponível no período e não garante segurança.
          </Texto>
        </View>
      </View>

      <View style={styles.botoes}>
        <Botao rotulo="Criar conta" onPress={() => router.push('/criar-conta')} />
        <Botao rotulo="Entrar" variante="secundario" onPress={() => router.push('/entrar')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, paddingHorizontal: espaco[4], justifyContent: 'space-between' },
  meio: { gap: espaco[8] },
  logo: { width: 96, height: 96 },
  textos: { gap: espaco[3] },
  botoes: { gap: espaco[3] },
});
