import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Info, SignOut, User, Users } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { LinkTexto } from '@/components/ui/link-texto';
import { Texto } from '@/components/ui/texto';
import { useConta } from '@/features/conta/conta-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Perfil (F08), versão provisória: mostra a conta, Contatos de segurança e o Sair (F08 CA6).
 * Sem conta, convida a entrar ou criar a conta. Preferências e Dados e privacidade entram no F08.
 */
export default function PerfilScreen() {
  const { cores } = useTema();
  const { usuario, estado, sair } = useConta();

  function confirmarSair() {
    // Ações que desligam algo sempre pedem confirmação (design system v3).
    Alert.alert('Sair da conta?', 'Você volta para a tela de entrar. O histórico continua neste celular.', [
      { text: 'Agora não', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await sair();
          router.push('/entrar');
        },
      },
    ]);
  }

  if (estado !== 'logado') {
    return (
      <SafeAreaView edges={['top']} style={[styles.tela, { backgroundColor: cores.papel }]}>
        <View style={styles.conteudo}>
          <View style={[styles.avatar, { backgroundColor: cores.papelRebaixado }]}>
            <User size={32} color={cores.grafite} weight="bold" />
          </View>
          <View style={styles.conta}>
            <Texto variante="titulo">Entre no Hoodi</Texto>
            <Texto variante="legenda">
              Com uma conta, você cadastra contatos de segurança e pode pedir ajuda a eles.
            </Texto>
            <Texto variante="legenda">O mapa, o Início e o Hoodi Pet funcionam sem conta.</Texto>
          </View>
          <Botao rotulo="Entrar" onPress={() => router.push('/entrar')} />
          <View style={styles.criar}>
            <Texto variante="legenda">Ainda não tem conta?</Texto>
            <LinkTexto rotulo="Criar conta" onPress={() => router.push('/criar-conta')} />
          </View>
        </View>
      </SafeAreaView>
    );
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
        <Botao rotulo="Contatos de segurança" variante="secundario" icone={Users} onPress={() => router.push('/contatos')} />
        <Botao rotulo="Sair" variante="secundario" icone={SignOut} onPress={confirmarSair} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: espaco[4], paddingTop: espaco[12], gap: espaco[6] },
  conta: { gap: espaco[1] },
  avatar: { width: 64, height: 64, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
  criar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco[1] },
});
