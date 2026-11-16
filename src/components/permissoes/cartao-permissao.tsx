import { StyleSheet, View } from 'react-native';

import { CheckCircle, Clock, Prohibit, Question, type Icon } from '@/components/icones';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import type { EstadoPermissao } from '@/features/permissoes/permissoes';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  icone: Icon;
  titulo: string;
  /** Por que o Hoodi pede esta permissão (F02 CA2), mostrado antes do pedido do sistema. */
  motivo: string;
  estado: EstadoPermissao;
  /** O que deixa de funcionar quando a pessoa nega (F02 CA3, CA4). */
  seNegar: string;
  /** Texto quando a permissão não existe aqui (Expo Go, navegador). */
  seIndisponivel?: string;
  acao?: { rotulo: string; onPress: () => void };
};

const SITUACAO: Record<EstadoPermissao, { texto: string; icone: Icon }> = {
  permitida: { texto: 'Permitida', icone: CheckCircle },
  negada: { texto: 'Não permitida', icone: Prohibit },
  'nao-pedida': { texto: 'Ainda não pedida', icone: Clock },
  indisponivel: { texto: 'Indisponível aqui', icone: Question },
};

/** Uma permissão: motivo, situação com ícone e palavra (nunca só cor) e a ação. */
export function CartaoPermissao({ icone: Icone, titulo, motivo, estado, seNegar, seIndisponivel, acao }: Props) {
  const { cores } = useTema();
  const situacao = SITUACAO[estado];
  const corSituacao = estado === 'permitida' ? 'seguroTexto' : estado === 'negada' ? 'atencaoTexto' : 'grafiteSuave';

  return (
    <View
      style={[styles.cartao, { backgroundColor: cores.papelRebaixado }]}
      accessible={!acao}
      accessibilityLabel={`${titulo}. ${situacao.texto}. ${motivo}`}>
      <View style={styles.cabecalho}>
        <View style={[styles.icone, { backgroundColor: cores.papelElevado }]}>
          <Icone size={22} color={cores.grafite} weight="bold" />
        </View>
        <View style={styles.textos}>
          <Texto variante="corpoForte">{titulo}</Texto>
          <View style={styles.situacao}>
            <situacao.icone size={16} color={cores[corSituacao]} weight="bold" />
            <Texto variante="legenda" cor={corSituacao}>
              {situacao.texto}
            </Texto>
          </View>
        </View>
      </View>
      <Texto variante="legenda" cor="grafite">
        {motivo}
      </Texto>
      {estado === 'negada' ? <Texto variante="legenda">{seNegar}</Texto> : null}
      {estado === 'indisponivel' && seIndisponivel ? <Texto variante="legenda">{seIndisponivel}</Texto> : null}
      {acao ? <Botao rotulo={acao.rotulo} variante="secundario" onPress={acao.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { borderRadius: raio.md, padding: espaco[4], gap: espaco[3] },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  icone: { width: 44, height: 44, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  situacao: { flexDirection: 'row', alignItems: 'center', gap: espaco[1] },
});
