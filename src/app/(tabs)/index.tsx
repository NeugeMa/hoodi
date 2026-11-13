import { AccessibilityInfo, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPedirAjuda } from '@/components/inicio/botao-pedir-ajuda';
import { CabecalhoInicio } from '@/components/inicio/cabecalho-inicio';
import { SecaoTrajeto } from '@/components/inicio/secao-trajeto';
import { StatusAtual } from '@/components/inicio/status-atual';
import { Texto } from '@/components/ui/texto';
import type { PosicaoAtual } from '@/features/trajeto/tipos';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Nome de tratamento: virá da conta (F01). Nulo até lá. */
const NOME_USUARIO: string | null = null;

function explicacao(posicao: PosicaoAtual | null) {
  if (!posicao) return 'Ainda não sabemos onde você está.';
  if (posicao.nivel === 'sem-dado') {
    return 'Não há registro utilizável para este lugar. Isso não quer dizer que a área é tranquila.';
  }
  return posicao.motivo;
}

function textoContatos(n: number) {
  if (n === 0) return 'Você ainda não tem contatos confirmados.';
  return n === 1 ? 'Avisa seu contato confirmado.' : `Avisa seus ${n} contatos confirmados.`;
}

/**
 * Início (F05 · Trajeto em andamento).
 * A telinha do hoodi Pet responde num relance como está onde você está;
 * abaixo, o trajeto e o Pedir ajuda. Sem dados, mostra os estados vazios.
 */
export default function InicioScreen() {
  const { cores } = useTema();
  const { posicao, trajeto, canais, contatosConfirmados, encerrarTrajeto } = useTrajeto();

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
    <SafeAreaView edges={['top']} style={[styles.tela, { backgroundColor: cores.papel }]}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <CabecalhoInicio
          nome={NOME_USUARIO}
          local={posicao?.local ?? null}
          canais={canais}
          onConectarPet={() => emProducao('Parear hoodi Pet', 'F06')}
        />

        <StatusAtual nivel={posicao?.nivel ?? null} explicacao={explicacao(posicao)} />

        <SecaoTrajeto
          trajeto={trajeto}
          onCompararRotas={() => emProducao('Comparar rotas', 'F04')}
          onEncerrar={confirmarEncerrar}
        />
      </ScrollView>

      {/* Pedir ajuda: fixo e sempre visível, fora da rolagem, ao alcance do polegar. */}
      <View style={[styles.rodape, { backgroundColor: cores.papel, borderTopColor: cores.linha }]}>
        <BotaoPedirAjuda
          contatosConfirmados={contatosConfirmados}
          onPress={() => emProducao('Pedir ajuda', 'F09')}
        />
        <Texto variante="legenda" style={styles.centro} accessible={false}>
          {textoContatos(contatosConfirmados)}
        </Texto>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    paddingHorizontal: espaco[4],
    paddingTop: espaco[3],
    paddingBottom: espaco[6],
    gap: espaco[6],
  },
  rodape: {
    paddingHorizontal: espaco[4],
    paddingTop: espaco[3],
    paddingBottom: espaco[3],
    gap: espaco[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  centro: { textAlign: 'center' },
});
