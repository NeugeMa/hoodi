import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudSlash, WarningCircle } from '@/components/icones';
import { LegendaMapa } from '@/components/mapa/legenda-mapa';
import { MapaRisco } from '@/components/mapa/mapa-risco';
import { DetalheCelula, PainelMapa } from '@/components/mapa/painel-mapa';
import { OndeEstou } from '@/components/risco/onde-estou';
import { Aviso } from '@/components/ui/aviso';
import { Texto } from '@/components/ui/texto';
import type { FalhaDownload } from '@/features/grade/grade-api';
import { useGrade } from '@/features/grade/grade-context';
import { diaMes, diaMesAno, diaPorExtenso } from '@/features/grade/datas';
import { CENTRO_PERIMETRO, faixaAtual, nivelNaFaixa } from '@/features/grade/recorte';
import type { CelulaGrade } from '@/features/grade/tipos';
import { explicacaoDaPosicao } from '@/features/trajeto/textos';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Textos quando ainda não há nenhuma grade salva no aparelho. */
const SEM_GRADE: Record<FalhaDownload, { titulo: string; texto: string }> = {
  'sem-internet': {
    titulo: 'Precisa de internet uma vez',
    texto: 'Conecte-se para baixar os dados de risco. Depois, o mapa funciona sem internet.',
  },
  'sem-servidor': {
    titulo: 'Dados de risco indisponíveis',
    texto: 'O servidor de dados ainda não está configurado neste app.',
  },
  'checksum-invalido': {
    titulo: 'Dados recusados',
    texto: 'O arquivo recebido não passou na verificação e não foi usado.',
  },
  erro: {
    titulo: 'Não deu para baixar os dados',
    texto: 'O servidor respondeu de um jeito inesperado.',
  },
};

/**
 * Mapa (F03): mapa real em cinza com as células de risco por cima, a posição da pessoa
 * e o trajeto colorido trecho a trecho. O painel embaixo mostra onde você está ou
 * o detalhe da célula tocada. Funciona sem internet com a grade salva no aparelho.
 */
export default function MapaScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { grade, carregando, falha, atualizar } = useGrade();
  const { posicao, trajeto } = useTrajeto();
  const [selecionada, setSelecionada] = useState<CelulaGrade | null>(null);
  const [alturaPainel, setAlturaPainel] = useState(0);

  const faixa = grade ? faixaAtual(grade.faixas) : null;
  const topo = insets.top + espaco[3];

  const avisos = grade ? (
    <>
      {falha === 'sem-internet' ? (
        <Aviso
          icone={CloudSlash}
          titulo="Você está sem internet"
          texto={`Usando os dados salvos de ${diaPorExtenso(grade.publicadoEm)}.`}
        />
      ) : null}
      {falha === 'checksum-invalido' ? (
        <Aviso
          icone={WarningCircle}
          tom="atencao"
          titulo="Atualização recusada"
          texto={`Os dados novos não passaram na verificação. O mapa segue com os de ${diaPorExtenso(grade.publicadoEm)}.`}
          acao={{ rotulo: 'Tentar de novo', onPress: atualizar }}
        />
      ) : null}
    </>
  ) : null;

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel }]}>
      <MapaRisco
        grade={grade}
        faixa={faixa}
        posicao={posicao?.coordenada ?? null}
        centroPadrao={CENTRO_PERIMETRO}
        caminho={trajeto?.caminho ?? []}
        selecionadaId={selecionada?.id ?? null}
        onSelecionar={setSelecionada}
        margemInferior={alturaPainel}
        margemSuperior={topo + 48}
      />

      {/* Título e data flutuando sobre o mapa. */}
      <View style={[styles.cabecalho, { top: topo }]} pointerEvents="box-none">
        <View style={[styles.chip, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
          <Texto variante="subtitulo" accessibilityRole="header">
            Mapa
          </Texto>
          {grade ? (
            <Texto variante="legenda">
              · Dados de {diaMes(grade.publicadoEm)}
              {faixa ? `, ${faixa.rotulo}` : ''}
            </Texto>
          ) : null}
        </View>
      </View>

      <PainelMapa avisos={avisos} onAltura={setAlturaPainel}>
        {!grade ? (
          carregando ? (
            <Texto cor="grafiteSuave">Buscando os dados de risco…</Texto>
          ) : (
            <Aviso
              icone={falha === 'sem-internet' ? CloudSlash : WarningCircle}
              titulo={SEM_GRADE[falha ?? 'erro'].titulo}
              texto={SEM_GRADE[falha ?? 'erro'].texto}
              acao={{ rotulo: 'Tentar de novo', onPress: atualizar }}
            />
          )
        ) : selecionada ? (
          <DetalheCelula
            referencia={selecionada.referencia}
            nivel={nivelNaFaixa(selecionada, faixa)}
            faixa={faixa?.rotulo ?? '—'}
            fonte={grade.fonte}
            dadosDe={diaMesAno(grade.publicadoEm)}
            onFechar={() => setSelecionada(null)}
          />
        ) : (
          <>
            <OndeEstou
              nivel={posicao?.celulaId ? posicao.nivel : null}
              local={posicao?.local ?? null}
              explicacao={explicacaoDaPosicao(posicao)}
            />
            <LegendaMapa />
            <Texto variante="legenda">Toque numa área colorida para ver o detalhe.</Texto>
          </>
        )}
      </PainelMapa>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: { position: 'absolute', left: espaco[4], right: espaco[4], flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco[1],
    paddingHorizontal: espaco[4],
    paddingVertical: espaco[2],
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
