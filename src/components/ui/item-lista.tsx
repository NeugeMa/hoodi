import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { CaretRight, type Icon } from '@/components/icones';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Texto } from './texto';

type Base = {
  icone: Icon;
  rotulo: string;
  /** Linha de apoio abaixo do rótulo. */
  detalhe?: string;
};

type ComValor = Base & {
  /** Valor escolhido, mostrado à direita (F08 CA1: "o valor aparece na linha do Perfil"). */
  valor?: string;
  onPress: () => void;
  interruptor?: undefined;
};

type ComInterruptor = Base & {
  interruptor: { ligado: boolean; aoMudar: (ligado: boolean) => void };
  valor?: undefined;
  onPress?: undefined;
};

/** Linha de lista do Perfil: ícone, rótulo, valor e seta, ou um interruptor. Alvo de 56px. */
export function ItemLista(props: ComValor | ComInterruptor) {
  const { cores } = useTema();
  const { icone: Icone, rotulo, detalhe } = props;

  const conteudo = (
    <>
      <View style={[styles.icone, { backgroundColor: cores.papelRebaixado }]}>
        <Icone size={20} color={cores.grafite} weight="bold" />
      </View>
      <View style={styles.textos}>
        <Texto variante="corpoForte">{rotulo}</Texto>
        {detalhe ? <Texto variante="legenda">{detalhe}</Texto> : null}
      </View>
    </>
  );

  if (props.interruptor) {
    const { ligado, aoMudar } = props.interruptor;
    return (
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={rotulo}
        accessibilityHint={detalhe}
        accessibilityState={{ checked: ligado }}
        onPress={() => aoMudar(!ligado)}
        style={styles.linha}>
        {conteudo}
        <Switch
          value={ligado}
          onValueChange={aoMudar}
          trackColor={{ true: cores.grafite, false: cores.papelRebaixado }}
          thumbColor={cores.papelElevado}
          ios_backgroundColor={cores.papelRebaixado}
          accessible={false}
          importantForAccessibility="no"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.valor ? `${rotulo}: ${props.valor}` : rotulo}
      accessibilityHint={detalhe}
      onPress={props.onPress}
      style={({ pressed }) => [styles.linha, { opacity: pressed ? 0.7 : 1 }]}>
      {conteudo}
      {props.valor ? (
        <Texto variante="legenda" cor="grafite" style={styles.valor} numberOfLines={1}>
          {props.valor}
        </Texto>
      ) : null}
      <CaretRight size={18} color={cores.grafiteSuave} weight="bold" />
    </Pressable>
  );
}

/** Grupo de linhas num cartão, com título de seção. */
export function GrupoLista({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={styles.grupo}>
      <Texto variante="rotulo" cor="grafiteSuave" accessibilityRole="header" style={styles.tituloGrupo}>
        {titulo}
      </Texto>
      <View style={[styles.cartao, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    minHeight: tamanho.toquePrincipal + espaco[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    paddingHorizontal: espaco[4],
    paddingVertical: espaco[2],
  },
  icone: { width: 36, height: 36, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  valor: { maxWidth: '40%' },
  grupo: { gap: espaco[2] },
  tituloGrupo: { paddingHorizontal: espaco[1] },
  cartao: { borderRadius: raio.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
