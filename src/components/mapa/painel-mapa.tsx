import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { X } from '@/components/icones';
import { SeloNivel } from '@/components/risco/onde-estou';
import { Texto } from '@/components/ui/texto';
import type { NivelRisco } from '@/features/risco/nivel';
import { espaco, raio, sombra, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  /** Avisos do sistema (sem internet, fora da área...) mostrados no topo do painel. */
  avisos?: ReactNode;
  children: ReactNode;
  onAltura: (altura: number) => void;
};

/** Bottom sheet fixo do Mapa: arredondado em cima, sobre o mapa. */
export function PainelMapa({ avisos, children, onAltura }: Props) {
  const { cores } = useTema();
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => onAltura(e.nativeEvent.layout.height)}
      style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
      <View style={[styles.alca, { backgroundColor: cores.linha }]} />
      {avisos}
      {children}
    </View>
  );
}

type DetalheProps = {
  referencia: string;
  nivel: NivelRisco;
  faixa: string;
  fonte: string;
  dadosDe: string;
  onFechar: () => void;
};

/**
 * Detalhe da célula tocada (F03 CA5): nível, faixa horária, fonte SSP-SP, data
 * e "Melhor dado disponível no período".
 */
export function DetalheCelula({ referencia, nivel, faixa, fonte, dadosDe, onFechar }: DetalheProps) {
  const { cores } = useTema();
  return (
    <View style={styles.bloco}>
      <View style={styles.topo}>
        <SeloNivel nivel={nivel} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar detalhe e voltar para onde você está"
          onPress={onFechar}
          hitSlop={8}
          style={styles.fechar}>
          <X size={20} color={cores.grafiteSuave} weight="bold" />
        </Pressable>
      </View>
      <Texto variante="titulo">{referencia}</Texto>
      {nivel === 'sem-dado' ? (
        <Texto variante="legenda">
          Não há dado utilizável para este local. Isso não quer dizer que a área é tranquila.
        </Texto>
      ) : null}
      <View>
        <Linha rotulo="Faixa horária" valor={faixa} />
        <Linha rotulo="Fonte" valor={fonte} />
        <Linha rotulo="Dados de" valor={dadosDe} ultima />
      </View>
      <Texto variante="legenda">Melhor dado disponível no período.</Texto>
    </View>
  );
}

function Linha({ rotulo, valor, ultima }: { rotulo: string; valor: string; ultima?: boolean }) {
  const { cores } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`${rotulo}: ${valor}`}
      style={[styles.linha, !ultima && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.linha }]}>
      <Texto cor="grafiteSuave">{rotulo}</Texto>
      <Texto variante="corpoForte">{valor}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  painel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: espaco[4],
    paddingTop: espaco[2],
    paddingBottom: espaco[4],
    gap: espaco[3],
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  bloco: { gap: espaco[1] },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[1],
    paddingHorizontal: espaco[2],
    paddingVertical: espaco[1],
    borderRadius: raio.sm,
  },
  fechar: { width: tamanho.toqueMin, height: tamanho.toqueMin, alignItems: 'flex-end', justifyContent: 'center' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: tamanho.toqueMin },
});
