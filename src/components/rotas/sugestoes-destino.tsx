import { Pressable, StyleSheet, View } from 'react-native';

import { MapPin } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import type { Sugestao } from '@/features/lugares/lugares';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

export type EstadoSugestoes = 'ocioso' | 'carregando' | 'ok' | 'vazio' | 'indisponivel';

type Props = {
  estado: EstadoSugestoes;
  sugestoes: Sugestao[];
  aoEscolher: (s: Sugestao) => void;
};

/**
 * Sugestões de destino abaixo do campo (design system v3). Não rouba o foco do teclado.
 * Se a busca falhar, avisa e o campo continua valendo: a pessoa pode escrever o endereço completo.
 */
export function SugestoesDestino({ estado, sugestoes, aoEscolher }: Props) {
  const { cores } = useTema();
  if (estado === 'ocioso') return null;

  if (estado === 'carregando' || estado === 'vazio' || estado === 'indisponivel') {
    const texto =
      estado === 'carregando'
        ? 'Buscando endereços.'
        : estado === 'vazio'
          ? 'Nenhum endereço encontrado. Tente com rua e número, ou o nome do lugar.'
          : 'Sugestões indisponíveis agora. Você ainda pode escrever o endereço completo.';
    return (
      <View accessibilityLiveRegion="polite">
        <Texto variante="legenda">{texto}</Texto>
      </View>
    );
  }

  return (
    <View accessibilityRole="list" style={[styles.lista, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
      {sugestoes.map((s, i) => (
        <Pressable
          key={s.id}
          accessibilityRole="button"
          accessibilityLabel={s.contexto ? `${s.rotulo}, ${s.contexto}` : s.rotulo}
          accessibilityHint="Usa este endereço como destino"
          onPress={() => aoEscolher(s)}
          style={({ pressed }) => [
            styles.item,
            i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha } : null,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <MapPin size={20} color={cores.grafiteSuave} weight="bold" />
          <View style={styles.textos}>
            <Texto variante="corpoForte" numberOfLines={2}>
              {s.rotulo}
            </Texto>
            {s.contexto ? <Texto variante="legenda">{s.contexto}</Texto> : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { borderRadius: raio.sm, borderWidth: 1, overflow: 'hidden' },
  item: { minHeight: tamanho.toqueMin, flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingHorizontal: espaco[4], paddingVertical: espaco[2] },
  textos: { flex: 1 },
});
