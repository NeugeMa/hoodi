import { Pressable, StyleSheet, View } from 'react-native';

import { CheckCircle, Clock, type Icon } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  nome: string;
  /** confirmado: recebe os pedidos. aguardando: convite ainda não aceito. */
  situacao: 'confirmado' | 'aguardando';
  /** Texto de apoio (ex.: "Convite vale até 23:14"). */
  detalhe?: string;
  acao?: { rotulo: string; icone: Icon; onPress: () => void; dica?: string };
};

/**
 * Item de contato (design system v3): confirmado ou aguardando confirmação.
 * Cor nunca sozinha: o estado tem ícone e palavra.
 */
export function ItemContato({ nome, situacao, detalhe, acao }: Props) {
  const { cores } = useTema();
  const confirmado = situacao === 'confirmado';
  const IconeSituacao = confirmado ? CheckCircle : Clock;
  const textoSituacao = confirmado ? 'Confirmado' : 'Aguardando confirmação';
  const inicial = nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.linha}>
      <View
        accessible
        accessibilityLabel={`${nome}. ${textoSituacao}.${detalhe ? ` ${detalhe}.` : ''}`}
        style={styles.info}>
        <View style={[styles.avatar, { backgroundColor: cores.papelRebaixado }]}>
          <Texto variante="corpoForte">{inicial}</Texto>
        </View>
        <View style={styles.textos}>
          <Texto variante="corpoForte" numberOfLines={1}>
            {nome}
          </Texto>
          <View style={styles.situacao}>
            <IconeSituacao
              size={16}
              color={confirmado ? cores.seguroTexto : cores.grafiteSuave}
              weight="bold"
            />
            <Texto variante="legenda" cor={confirmado ? 'seguroTexto' : 'grafiteSuave'}>
              {textoSituacao}
            </Texto>
          </View>
          {detalhe ? <Texto variante="legenda">{detalhe}</Texto> : null}
        </View>
      </View>
      {acao ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${acao.rotulo}: ${nome}`}
          accessibilityHint={acao.dica}
          onPress={acao.onPress}
          style={({ pressed }) => [styles.acao, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <acao.icone size={20} color={cores.grafite} weight="bold" />
          <Texto variante="legenda" cor="grafite">
            {acao.rotulo}
          </Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: tamanho.toqueMin + espaco[4] },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  avatar: { width: 40, height: 40, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  situacao: { flexDirection: 'row', alignItems: 'center', gap: espaco[1] },
  acao: {
    minHeight: tamanho.toqueMin,
    minWidth: tamanho.toqueMin,
    paddingHorizontal: espaco[2],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
