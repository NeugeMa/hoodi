import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {AccessibilityInfo, ScrollView, StyleSheet, View} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListaAlertas, SemAlertas } from '@/components/historico/lista-alertas';
import { Lock, Trash } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { perguntar } from '@/components/ui/perguntar';
import { resumoDaSemana } from '@/features/historico/agrupar';
import { ouvirHistorico } from '@/features/historico/historico-eventos';
import { apagarHistorico, listarAlertas } from '@/features/historico/historico-repo';
import type { AlertaSalvo } from '@/features/historico/tipos';
import { NIVEL } from '@/features/risco/nivel';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Histórico local de alertas (F10): os alertas recebidos nos trajetos,
 * guardados só no aparelho e disponíveis sem internet.
 */
export default function HistoricoScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const [alertas, setAlertas] = useState<AlertaSalvo[] | null>(null);

  // Recarrega sempre que a aba ganha foco: novos alertas chegam durante o trajeto.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarAlertas().then((lista) => {
        if (ativo) setAlertas(lista);
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  // Alerta novo com a aba aberta (ex.: durante o trajeto): atualiza na hora.
  useEffect(
    () =>
      ouvirHistorico(() => {
        listarAlertas().then(setAlertas);
      }),
    [],
  );

  function confirmarApagar() {
    // Ações que apagam algo sempre pedem confirmação (design system v3, F10 CA3).
    perguntar('Apagar histórico?', 'Todos os alertas guardados neste aparelho serão apagados.', [
      { text: 'Agora não', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await apagarHistorico();
          setAlertas([]);
          AccessibilityInfo.announceForAccessibility('Histórico apagado.');
        },
      },
    ]);
  }

  const resumo = resumoDaSemana(alertas ?? []);
  const temAlertas = !!alertas && alertas.length > 0;

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={styles.topo}>
        {temAlertas ? (
          <View
            accessible
            accessibilityLabel={`Últimos 7 dias: ${resumo.total} alertas, ${resumo.medio} de risco médio e ${resumo.alto} de risco alto.`}
            style={styles.resumo}>
            <View style={styles.total}>
              <Texto variante="display">{resumo.total}</Texto>
              <Texto variante="legenda">
                {resumo.total === 1 ? 'alerta' : 'alertas'}
                {'\n'}nos últimos 7 dias
              </Texto>
            </View>
            <View style={styles.contagens}>
              <Contagem nivel="medio" quantidade={resumo.medio} />
              <Contagem nivel="alto" quantidade={resumo.alto} />
            </View>
          </View>
        ) : null}

        <Aviso
          icone={Lock}
          titulo="Guardado só neste aparelho"
          texto="O histórico não é enviado para ninguém e abre mesmo sem internet."
        />
      </View>

      {/* Painel inferior, igual ao do Início e do Mapa. */}
      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView contentContainerStyle={styles.conteudoPainel} showsVerticalScrollIndicator={false}>
          {alertas === null ? null : temAlertas ? <ListaAlertas alertas={alertas} /> : <SemAlertas />}
        </ScrollView>
        {temAlertas ? (
          <View style={[styles.rodape, { borderTopColor: cores.linha }]}>
            <Botao rotulo="Apagar histórico" variante="fantasma" icone={Trash} onPress={confirmarApagar} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Contagem({ nivel, quantidade }: { nivel: 'medio' | 'alto'; quantidade: number }) {
  const { cores } = useTema();
  const meta = NIVEL[nivel];
  return (
    <View style={[styles.contagem, { backgroundColor: cores[meta.fundo] }]}>
      <meta.icone size={16} color={cores[meta.texto]} weight="bold" />
      <Texto variante="corpoForte" cor={meta.texto}>
        {quantidade}
      </Texto>
      <Texto variante="rotulo" cor={meta.texto}>
        {meta.curto}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: { paddingHorizontal: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  resumo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  contagens: { flexDirection: 'row', gap: espaco[2] },
  contagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[1],
    paddingHorizontal: espaco[3],
    paddingVertical: espaco[2],
    borderRadius: raio.total,
  },
  painel: {
    flex: 1,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: espaco[2] },
  conteudoPainel: { paddingHorizontal: espaco[4], paddingTop: espaco[4], paddingBottom: espaco[6] },
  rodape: { paddingHorizontal: espaco[4], paddingVertical: espaco[2], borderTopWidth: StyleSheet.hairlineWidth },
});
