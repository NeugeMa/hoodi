import { router } from 'expo-router';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Info, Watch } from '@/components/icones';
import { CabecalhoVoltar } from '@/components/pet/cabecalho-voltar';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

const PASSOS = [
  'Ative as notificações do Hoodi.',
  'Escolha o háptico forte para elas.',
  'Coloque o Hoodi como exceção no modo Foco ou Não Perturbe.',
];

const OBSERVACAO =
  Platform.OS === 'ios'
    ? 'No iPhone, o aviso chega ao relógio só com o celular bloqueado.'
    : 'No Android, o aviso chega pelo app do relógio (Wear OS ou do fabricante do relógio).';

/**
 * Configurar o relógio (F06 CA1, CA2): orienta a ativar as notificações do hoodi
 * no relógio. Aparece uma vez no primeiro acesso e pode ser reaberta depois.
 */
export default function RelogioScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { definirRelogio } = useTrajeto();

  async function terminar(configurou: boolean) {
    await salvarPreferencia(PREF.relogioOrientacaoVista, '1');
    if (configurou) {
      await definirRelogio(true);
      AccessibilityInfo.announceForAccessibility('Relógio configurado.');
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={styles.topo}>
        <CabecalhoVoltar titulo="Configurar o relógio" />
        <View style={[styles.icone, { backgroundColor: cores.papelRebaixado }]}>
          <Watch size={32} color={cores.grafite} weight="bold" />
        </View>
        <View style={styles.textos}>
          <Texto variante="titulo">Receba o aviso no pulso</Texto>
          <Texto variante="legenda">
            O relógio mostra as notificações do Hoodi. Faça isto uma vez no app do relógio:
          </Texto>
        </View>
      </View>

      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View accessibilityRole="list" style={styles.passos}>
            {PASSOS.map((passo, i) => (
              <View key={passo} accessible accessibilityLabel={`Passo ${i + 1}: ${passo}`} style={styles.passo}>
                <View style={[styles.numero, { backgroundColor: cores.grafite }]}>
                  <Texto variante="rotulo" style={{ color: cores.sobreGrafite }}>
                    {i + 1}
                  </Texto>
                </View>
                <Texto style={styles.textoPasso}>{passo}</Texto>
              </View>
            ))}
          </View>
          <Aviso icone={Info} titulo="Bom saber" texto={`${OBSERVACAO} Você pode rever estes passos no Perfil.`} />
        </ScrollView>

        <View style={[styles.rodape, { borderTopColor: cores.linha }]}>
          <Botao rotulo="Concluí" onPress={() => terminar(true)} dica="Marca o relógio como canal de aviso" />
          <Botao rotulo="Fazer depois" variante="fantasma" onPress={() => terminar(false)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: { paddingHorizontal: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  icone: { width: 64, height: 64, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
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
  passos: { gap: espaco[4] },
  passo: { flexDirection: 'row', gap: espaco[3], alignItems: 'flex-start' },
  numero: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  textoPasso: { flex: 1 },
  rodape: { paddingHorizontal: espaco[4], paddingVertical: espaco[3], gap: espaco[1], borderTopWidth: StyleSheet.hairlineWidth },
});
