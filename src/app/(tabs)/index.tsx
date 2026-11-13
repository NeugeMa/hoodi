import { AccessibilityInfo, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoPedirAjuda } from '@/components/inicio/botao-pedir-ajuda';
import { HeroiInicio } from '@/components/inicio/heroi-inicio';
import { SecaoTrajeto } from '@/components/inicio/secao-trajeto';
import { OndeEstou } from '@/components/risco/onde-estou';
import { Texto } from '@/components/ui/texto';
import { explicacaoDaPosicao } from '@/features/trajeto/textos';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Nome de tratamento: virá da conta (F01). Nulo até lá. */
const NOME_USUARIO: string | null = null;

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
  // Sem posição ou fora da área coberta: nenhum nível (carinha "procurando").
  const nivel = posicao?.celulaId ? posicao.nivel : null;

  function emProducao(tela: string, feature: string) {
    Alert.alert(tela, `Esta tela ainda está em produção (${feature}).`);
  }

  function confirmarEncerrar() {
    // Ações que desligam algo sempre pedem confirmação (design system v3).
    Alert.alert(
      'Encerrar trajeto?',
      'O relógio e o hoodi Pet deixam de receber alertas deste trajeto.',
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
          nome={NOME_USUARIO}
          local={posicao?.local ?? null}
          nivel={nivel}
          canais={canais}
          onConectarPet={() => emProducao('Parear hoodi Pet', 'F06')}
        />
      </View>

      {/* Painel inferior, igual ao do Mapa. */}
      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView contentContainerStyle={styles.conteudoPainel} showsVerticalScrollIndicator={false}>
          <OndeEstou nivel={nivel} local={posicao?.local ?? null} explicacao={explicacaoDaPosicao(posicao)} />
          <View style={[styles.divisor, { backgroundColor: cores.linha }]} />
          <SecaoTrajeto
            trajeto={trajeto}
            onCompararRotas={() => emProducao('Comparar rotas', 'F04')}
            onEncerrar={confirmarEncerrar}
          />
        </ScrollView>

        {/* Pedir ajuda: fixo e sempre visível, ao alcance do polegar. */}
        <View style={[styles.rodape, { borderTopColor: cores.linha }]}>
          <BotaoPedirAjuda
            contatosConfirmados={contatosConfirmados}
            onPress={() => emProducao('Pedir ajuda', 'F09')}
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
