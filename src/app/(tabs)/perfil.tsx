import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Bluetooth,
  Database,
  Moon,
  Ruler,
  SignOut,
  SpeakerHigh,
  User,
  Users,
  Vibrate,
  Watch,
} from '@/components/icones';
import { Botao } from '@/components/ui/botao';
import { GrupoLista, ItemLista } from '@/components/ui/item-lista';
import { LinkTexto } from '@/components/ui/link-texto';
import { Seletor } from '@/components/ui/seletor';
import { Texto } from '@/components/ui/texto';
import { useConta } from '@/features/conta/conta-context';
import { useContatos } from '@/features/contatos/contatos-context';
import { usePet } from '@/features/pet/pet-context';
import {
  OPCOES_ANTECEDENCIA,
  OPCOES_HORARIO,
  OPCOES_VIBRACAO,
  rotuloDe,
} from '@/features/preferencias/alertas';
import { usePreferencias } from '@/features/preferencias/preferencias-context';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Escolha = 'vibracao' | 'antecedencia' | 'horario' | null;

/**
 * Perfil (F08 CA1, CA2, CA6 · F06 CA2): preferências de alerta com o valor escolhido na linha,
 * canais de aviso (relógio e Hoodi Pet), contatos de segurança, dados e privacidade e a conta.
 * As preferências ficam no aparelho e valem com ou sem conta.
 */
export default function PerfilScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { usuario, estado, sair } = useConta();
  const { meusContatos } = useContatos();
  const { canais } = useTrajeto();
  const { pareado, conectado } = usePet();
  const { alertas, mudarAlertas, consentimentoEm } = usePreferencias();
  const [escolha, setEscolha] = useState<Escolha>(null);
  const logado = estado === 'logado';

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

  const textoPet = !pareado ? 'Não pareado' : conectado ? 'Conectado' : 'Desconectado';

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel }]}>
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingTop: insets.top + espaco[6] }]}
        showsVerticalScrollIndicator={false}>
        {logado ? (
          <View style={styles.cabecalho}>
            <View style={[styles.avatar, { backgroundColor: cores.papelRebaixado }]}>
              <Texto variante="titulo">{(usuario?.nome ?? '?').trim().charAt(0).toUpperCase()}</Texto>
            </View>
            <View style={styles.textos}>
              <Texto variante="titulo" numberOfLines={1}>
                {usuario?.nome ?? 'Sua conta'}
              </Texto>
              {usuario?.email ? <Texto variante="legenda">{usuario.email}</Texto> : null}
            </View>
          </View>
        ) : (
          <View style={[styles.convite, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
            <View style={[styles.avatar, { backgroundColor: cores.papelRebaixado }]}>
              <User size={28} color={cores.grafite} weight="bold" />
            </View>
            <View style={styles.textosConvite}>
              <Texto variante="subtitulo">Entre no Hoodi</Texto>
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
        )}

        {!consentimentoEm ? (
          <View style={[styles.aviso, { backgroundColor: cores.atencaoFundo }]}>
            <Texto variante="corpoForte">Alertas desligados</Texto>
            <Texto variante="legenda" cor="grafite">
              Sem o seu consentimento, o Hoodi não avisa no relógio nem no Pet. Veja em Dados e privacidade.
            </Texto>
          </View>
        ) : null}

        <GrupoLista titulo="Alertas">
          <ItemLista
            icone={Vibrate}
            rotulo="Vibração do Hoodi Pet"
            valor={rotuloDe(OPCOES_VIBRACAO, alertas.vibracao)}
            onPress={() => setEscolha('vibracao')}
          />
          <ItemLista
            icone={SpeakerHigh}
            rotulo="Som no celular"
            detalhe={alertas.som ? 'A notificação toca o som do celular' : 'Só vibra, sem som'}
            interruptor={{ ligado: alertas.som, aoMudar: (som) => mudarAlertas({ som }) }}
          />
          <ItemLista
            icone={Ruler}
            rotulo="Antecedência do aviso"
            detalhe="Distância do próximo trecho de maior risco"
            valor={rotuloDe(OPCOES_ANTECEDENCIA, alertas.antecedencia)}
            onPress={() => setEscolha('antecedencia')}
          />
          <ItemLista
            icone={Moon}
            rotulo="Horário dos alertas"
            valor={rotuloDe(OPCOES_HORARIO, alertas.horario)}
            onPress={() => setEscolha('horario')}
          />
        </GrupoLista>

        <GrupoLista titulo="Canais de aviso">
          <ItemLista
            icone={Watch}
            rotulo="Relógio"
            detalhe="Ver de novo como configurar"
            valor={canais.relogio ? 'Configurado' : 'Não configurado'}
            onPress={() => router.push('/relogio')}
          />
          <ItemLista
            icone={Bluetooth}
            rotulo="Hoodi Pet"
            valor={textoPet}
            onPress={() => router.push(pareado ? '/pet/conectado' : '/pet/parear')}
          />
        </GrupoLista>

        <GrupoLista titulo="Segurança e dados">
          <ItemLista
            icone={Users}
            rotulo="Contatos de segurança"
            valor={logado ? `${meusContatos.length} confirmado${meusContatos.length === 1 ? '' : 's'}` : 'Precisa de conta'}
            onPress={() => router.push('/contatos')}
          />
          <ItemLista
            icone={Database}
            rotulo="Dados e privacidade"
            detalhe="O que fica no aparelho, consentimento e conta"
            onPress={() => router.push('/privacidade')}
          />
        </GrupoLista>

        {logado ? <Botao rotulo="Sair" variante="secundario" icone={SignOut} onPress={confirmarSair} /> : null}
      </ScrollView>

      <Seletor
        visivel={escolha === 'vibracao'}
        titulo="Vibração do Hoodi Pet"
        opcoes={OPCOES_VIBRACAO}
        valor={alertas.vibracao}
        aoEscolher={(vibracao) => mudarAlertas({ vibracao })}
        aoFechar={() => setEscolha(null)}
      />
      <Seletor
        visivel={escolha === 'antecedencia'}
        titulo="Antecedência do aviso"
        opcoes={OPCOES_ANTECEDENCIA}
        valor={alertas.antecedencia}
        aoEscolher={(antecedencia) => mudarAlertas({ antecedencia })}
        aoFechar={() => setEscolha(null)}
      />
      <Seletor
        visivel={escolha === 'horario'}
        titulo="Horário dos alertas"
        opcoes={OPCOES_HORARIO}
        valor={alertas.horario}
        aoEscolher={(horario) => mudarAlertas({ horario })}
        aoFechar={() => setEscolha(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: espaco[4], paddingBottom: espaco[8], gap: espaco[6] },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco[4] },
  avatar: { width: 64, height: 64, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: espaco[1] },
  textosConvite: { gap: espaco[1] },
  convite: { borderRadius: raio.lg, borderWidth: StyleSheet.hairlineWidth, padding: espaco[6], gap: espaco[4] },
  criar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco[1] },
  aviso: { borderRadius: raio.md, padding: espaco[4], gap: espaco[1] },
});
