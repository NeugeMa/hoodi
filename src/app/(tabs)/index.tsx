import { router } from 'expo-router';

import {AccessibilityInfo, Linking, Platform, ScrollView, StyleSheet, View} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoPedirAjuda } from '@/components/inicio/botao-pedir-ajuda';
import { SugestaoTema } from '@/components/inicio/sugestao-tema';
import { HeroiInicio } from '@/components/inicio/heroi-inicio';
import { SecaoTrajeto } from '@/components/inicio/secao-trajeto';
import { MapPin } from '@/components/icones';
import { OndeEstou } from '@/components/risco/onde-estou';
import { Aviso } from '@/components/ui/aviso';
import { Texto } from '@/components/ui/texto';
import { perguntar } from '@/components/ui/perguntar';
import { useAcompanhamento } from '@/features/alerta/acompanhamento-context';
import { useConta } from '@/features/conta/conta-context';
import { usePet } from '@/features/pet/pet-context';
import { explicacaoDaPosicao } from '@/features/trajeto/textos';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Pré-visualização no navegador (expo start --web). */
const NO_NAVEGADOR = Platform.OS === 'web';

function textoContatos(n: number) {
  if (n === 0) return 'Você ainda não tem contatos confirmados.';
  return n === 1 ? 'Avisa seu contato confirmado.' : `Avisa seus ${n} contatos confirmados.`;
}

/**
 * Início (F05 · Trajeto em andamento), no mesmo estilo do Mapa:
 * em cima, chip com saudação e bairro, a telinha do hoodi Pet e os canais;
 * embaixo, um painel com onde você está, o trajeto e o Pedir ajuda fixo.
 */
export default function InicioScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { posicao, trajeto, canais, contatosConfirmados, encerrarTrajeto } = useTrajeto();
  const petPareado = !!usePet().pareado;
  const { permissao, pedirLocalizacao } = useAcompanhamento();
  // Sem conta, o Pet fica dormindo: ainda não está cuidando de ninguém.
  const semConta = useConta().estado !== 'logado';

  // Sem posição ou fora da área coberta: nenhum nível (carinha "procurando").
  const nivel = posicao?.celulaId ? posicao.nivel : null;


  function confirmarEncerrar() {
    // Ações que desligam algo sempre pedem confirmação (design system v3).
    perguntar(
      'Encerrar trajeto?',
      'O relógio e o Hoodi Pet deixam de receber alertas deste trajeto.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => {
            encerrarTrajeto();
            AccessibilityInfo.announceForAccessibility('Trajeto encerrado.');
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={styles.topo}>
        <HeroiInicio
          nivel={nivel}
          canais={canais}
          onConectarPet={() => router.push(petPareado ? '/pet/conectado' : '/pet/parear')}
          onConfigurarRelogio={() => router.push('/relogio')}
          dormindo={semConta}
        />
      </View>

      {/* Painel inferior, igual ao do Mapa. */}
      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView contentContainerStyle={styles.conteudoPainel} showsVerticalScrollIndicator={false}>
          {/* Depois das 18h, sugere o tema escuro (F02 CA5). */}
          <SugestaoTema />
          <OndeEstou nivel={nivel} local={posicao?.local ?? null} explicacao={explicacaoDaPosicao(posicao)} />
          {permissao !== 'concedida' ? (
            <Aviso
              icone={MapPin}
              titulo={permissao === 'negada' ? 'Localização desligada' : 'Permita a localização'}
              texto={
                permissao === 'negada' && NO_NAVEGADOR
                  ? 'O Hoodi usa sua posição só no aparelho. Para ligar, permita a localização para este site no cadeado ao lado do endereço e toque em Tentar de novo.'
                  : 'O Hoodi usa sua posição só no aparelho, para mostrar o risco onde você está e avisar quando ele sobe.'
              }
              acao={
                permissao !== 'negada'
                  ? { rotulo: 'Permitir localização', onPress: pedirLocalizacao }
                  : NO_NAVEGADOR
                    ? // O navegador não tem "configurações do app" para abrir (Linking.openSettings não existe na web).
                      { rotulo: 'Tentar de novo', onPress: pedirLocalizacao }
                    : { rotulo: 'Abrir configurações', onPress: () => Linking.openSettings() }
              }
            />
          ) : null}
          <View style={[styles.divisor, { backgroundColor: cores.linha }]} />
          <SecaoTrajeto
            trajeto={trajeto}
            onCompararRotas={() => router.push('/comparar-rotas')}
            onEncerrar={confirmarEncerrar}
          />
        </ScrollView>

        {/* Pedir ajuda: fixo e sempre visível, ao alcance do polegar. */}
        <View style={[styles.rodape, { borderTopColor: cores.linha }]}>
          <BotaoPedirAjuda
            contatosConfirmados={contatosConfirmados}
            onPress={() => router.push('/pedir-ajuda')}
          />
          <Texto variante="legenda" style={styles.centro} accessible={false}>
            {textoContatos(contatosConfirmados)}
          </Texto>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: { paddingHorizontal: espaco[4], paddingBottom: espaco[6] },
  painel: {
    flex: 1,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: espaco[2] },
  conteudoPainel: { paddingHorizontal: espaco[4], paddingTop: espaco[3], paddingBottom: espaco[4], gap: espaco[4] },
  divisor: { height: StyleSheet.hairlineWidth },
  rodape: {
    paddingHorizontal: espaco[4],
    paddingTop: espaco[3],
    paddingBottom: espaco[3],
    gap: espaco[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  centro: { textAlign: 'center' },
});
