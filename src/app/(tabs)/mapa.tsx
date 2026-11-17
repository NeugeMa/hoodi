import { useEffect, useState } from 'react';
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
import { diaMes, diaMesAno, diaPorExtenso, periodoMeses } from '@/features/grade/datas';
import { CENTRO_PERIMETRO, faixaAtual, nivelNaFaixa } from '@/features/grade/recorte';
import { preencherReferencia } from '@/features/grade/referencia';
import type { CelulaGrade } from '@/features/grade/tipos';
import { explicacaoDaPosicao } from '@/features/trajeto/textos';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco } from '@/theme/tokens';
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
  'nao-publicada': {
    titulo: 'Dados de risco ainda não publicados',
    texto: 'O servidor do Hoodi está no ar, mas ainda não tem a grade de risco. O mapa mostra as células assim que ela for publicada.',
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
  // Nome da rua da célula tocada (a grade da API só traz o código H3: o celular procura).
  const [nomeAchado, setNomeAchado] = useState<{ id: string; nome: string } | null>(null);
  const referenciaSelecionada =
    selecionada?.referencia || (nomeAchado && nomeAchado.id === selecionada?.id ? nomeAchado.nome : '');

  useEffect(() => {
    if (!selecionada || selecionada.referencia) return;
    let ativo = true;
    preencherReferencia(selecionada).then((nome) => {
      if (ativo && nome) setNomeAchado({ id: selecionada.id, nome });
    });
    return () => {
      ativo = false;
    };
  }, [selecionada]);

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
        margemSuperior={topo}
      />

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
            referencia={referenciaSelecionada || 'Área selecionada'}
            nivel={nivelNaFaixa(selecionada, faixa)}
            faixa={faixa?.rotulo ?? '—'}
            fonte={grade.fonte}
            dadosDe={grade.periodo ? periodoMeses(grade.periodo.inicio, grade.periodo.fim) : diaMesAno(grade.publicadoEm)}
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
            <Texto variante="legenda">
              {grade.periodo
                ? `Registros de ${periodoMeses(grade.periodo.inicio, grade.periodo.fim)}`
                : `Dados de ${diaMes(grade.publicadoEm)}`}
              {faixa ? `, faixa de ${faixa.rotulo}` : ''}. Toque numa área colorida para ver o detalhe.
            </Texto>
          </>
        )}
      </PainelMapa>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
});
