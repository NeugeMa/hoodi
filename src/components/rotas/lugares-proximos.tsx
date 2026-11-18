import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { MapPin } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { NIVEL } from '@/features/risco/nivel';
import {
  CATEGORIAS,
  criarControleDePedidos,
  descricaoDoLugar,
  distanciaCurta,
  nivelDoLugar,
  textoSemLugares,
  type CategoriaLugar,
  type LugarRecomendado,
  type RespostaRecomendacao,
} from '@/features/lugares/lugares';
import type { Coordenada } from '@/features/grade/tipos';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Estado =
  | { tipo: 'ocioso' }
  | { tipo: 'buscando'; categoria: CategoriaLugar }
  | { tipo: 'pronto'; categoria: CategoriaLugar; resposta: RespostaRecomendacao }
  | { tipo: 'falha' };

type Props = {
  /** Busca a posição atual só quando a pessoa escolhe uma categoria; devolve null se não souber onde ela está. */
  obterPosicao: () => Promise<Coordenada | null>;
  buscar: (posicao: Coordenada, categoria: CategoriaLugar) => Promise<RespostaRecomendacao>;
  aoEscolher: (lugar: LugarRecomendado) => void;
};

/**
 * Lugares perto de você, do menor risco registrado para o maior (depois pela distância).
 * "Sem dado" e "fora da área" nunca aparecem como tranquilos e vêm depois dos que têm dado.
 * A posição vai ao servidor só quando a pessoa toca numa categoria, e nada fica guardado.
 */
export function LugaresProximos({ obterPosicao, buscar, aoEscolher }: Props) {
  const { cores } = useTema();
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' });
  const [pedidos] = useState(criarControleDePedidos);

  async function escolher(categoria: CategoriaLugar) {
    const vez = pedidos.proximo();
    setEstado({ tipo: 'buscando', categoria });
    try {
      const posicao = await obterPosicao();
      if (!pedidos.vale(vez)) return;
      if (!posicao) {
        setEstado({ tipo: 'falha' });
        return;
      }
      const resposta = await buscar(posicao, categoria);
      if (!pedidos.vale(vez)) return;
      setEstado({ tipo: 'pronto', categoria, resposta });
      AccessibilityInfo.announceForAccessibility(resposta.lugares.length ? 'Lugares encontrados.' : 'Nenhum lugar para mostrar.');
    } catch {
      if (pedidos.vale(vez)) setEstado({ tipo: 'falha' });
    }
  }

  const ativa = estado.tipo === 'buscando' || estado.tipo === 'pronto' ? estado.categoria : null;

  return (
    <View style={styles.bloco}>
      <Texto variante="corpoForte" accessibilityRole="header">
        Lugares perto de você
      </Texto>
      <Texto variante="legenda">Do menor risco registrado para o maior, na faixa de horário de agora.</Texto>
      <View style={styles.categorias} accessibilityRole="radiogroup">
        {CATEGORIAS.map((c) => {
          const marcada = ativa === c.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: marcada }}
              accessibilityLabel={c.rotulo}
              onPress={() => escolher(c.id)}
              style={[
                styles.chip,
                { backgroundColor: marcada ? cores.grafite : cores.papelRebaixado, borderColor: marcada ? cores.grafite : 'transparent' },
              ]}>
              <Texto variante="corpoForte" cor={marcada ? 'papel' : 'grafite'}>
                {c.rotulo}
              </Texto>
            </Pressable>
          );
        })}
      </View>

      {estado.tipo === 'buscando' ? (
        <View accessibilityLiveRegion="polite">
          <Texto variante="legenda">Buscando lugares.</Texto>
        </View>
      ) : null}
      {estado.tipo === 'falha' ? (
        <View accessibilityLiveRegion="polite">
          <Texto variante="legenda">Não deu para buscar lugares agora. Confira a localização e a internet e tente de novo.</Texto>
        </View>
      ) : null}
      {estado.tipo === 'pronto' && estado.resposta.lugares.length === 0 ? (
        <View accessibilityLiveRegion="polite">
          <Texto variante="legenda">{textoSemLugares(estado.resposta)}</Texto>
        </View>
      ) : null}
      {estado.tipo === 'pronto' && estado.resposta.lugares.length > 0 ? (
        <View style={[styles.lista, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]} accessibilityRole="list">
          {estado.resposta.lugares.map((l, i) => {
            const meta = NIVEL[nivelDoLugar(l)];
            const Icone = meta.icone;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="button"
                accessibilityLabel={descricaoDoLugar(l, meta.nome)}
                accessibilityHint="Usa este lugar como destino"
                onPress={() => aoEscolher(l)}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha } : null,
                  { opacity: pressed ? 0.7 : 1 },
                ]}>
                <MapPin size={20} color={cores.grafiteSuave} weight="bold" />
                <View style={styles.textos}>
                  <Texto variante="corpoForte" numberOfLines={2}>
                    {l.nome}
                  </Texto>
                  <Texto variante="legenda">
                    {l.contexto ? `${l.contexto} · ` : ''}
                    {distanciaCurta(l.distanciaMetros)}
                  </Texto>
                </View>
                <View style={[styles.nivel, { backgroundColor: cores[meta.fundo] }]}>
                  <Icone size={16} color={cores[meta.texto]} weight="bold" />
                  <Texto variante="legenda" cor={meta.texto}>
                    {l.situacao === 'fora_cobertura' ? 'Fora da área' : meta.curto}
                  </Texto>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {estado.tipo === 'pronto' && estado.resposta.lugares.length > 0 ? (
        <Texto variante="legenda">
          Risco histórico registrado na área do lugar, não uma previsão. Não indica que o lugar nem o caminho até ele sejam seguros. Sem dado não é área tranquila.
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espaco[2] },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] },
  chip: { minHeight: tamanho.toqueMin, paddingHorizontal: espaco[4], borderRadius: raio.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  lista: { borderRadius: raio.sm, borderWidth: 1, overflow: 'hidden' },
  item: { minHeight: tamanho.toqueMin, flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingHorizontal: espaco[4], paddingVertical: espaco[2] },
  textos: { flex: 1 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: espaco[1], paddingHorizontal: espaco[2], paddingVertical: espaco[1], borderRadius: raio.sm },
});
