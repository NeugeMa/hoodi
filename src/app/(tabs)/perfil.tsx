import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Info, SignOut } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { useConta } from '@/features/conta/conta-context';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Perfil (F08), versão provisória: mostra a conta e o Sair (F08 CA6).
 * Preferências, canais de aviso e Dados e privacidade entram na branch do F08.
 */
export default function PerfilScreen() {
  const { cores } = useTema();
  const { usuario, sair } = useConta();

  function confirmarSair() {
    // Ações que desligam algo sempre pedem confirmação (design system v3).
    Alert.alert('Sair da conta?', 'Você volta para a tela de entrar. O histórico continua neste celular.', [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.tela, { backgroundColor: cores.papel }]}>
      <View style={styles.conteudo}>
        <View style={styles.conta}>
          <Texto variante="titulo">{usuario?.nome ?? 'Sua conta'}</Texto>
          {usuario?.email ? <Texto variante="legenda">{usuario.email}</Texto> : null}
        </View>
        <Aviso
          icone={Info}
          titulo="Perfil em produção"
          texto="Preferências, canais de aviso e Dados e privacidade chegam em breve (F08)."
        />
        <Botao rotulo="Sair" variante="secundario" icone={SignOut} onPress={confirmarSair} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: espaco[4], paddingTop: espaco[12], gap: espaco[6] },
  conta: { gap: espaco[1] },
});
