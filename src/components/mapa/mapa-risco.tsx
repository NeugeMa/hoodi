import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { GpsFix } from '@/components/icones';
import { cantos, nivelNaFaixa, trechosColoridos } from '@/features/grade/recorte';
import type { CelulaGrade, Coordenada, FaixaHoraria, GradeRisco } from '@/features/grade/tipos';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import { raio, sombra, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { ESTILO_CLARO, ESTILO_ESCURO } from './estilo-mapa';

/** Zoom de bairro: dá para ver as ruas e algumas quadras em volta. */
const DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

export type MapaRiscoProps = {
  grade: GradeRisco | null;
  faixa: FaixaHoraria | null;
  /** Onde a pessoa está; nulo enquanto a posição é desconhecida. */
  posicao: Coordenada | null;
  /** Centro usado quando a posição é desconhecida. */
  centroPadrao: Coordenada;
  caminho: Coordenada[];
  selecionadaId: string | null;
  onSelecionar: (celula: CelulaGrade | null) => void;
  /** Altura do bottom sheet, para o centro do mapa não ficar escondido atrás dele. */
  margemInferior: number;
  margemSuperior: number;
};

/** Hex #RRGGBB + transparência (0 a 1). */
function comAlfa(hex: string, alfa: number) {
  return `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Mapa real em cinza com o risco por cima (F03):
 * células translúcidas na cor do nível, a posição da pessoa e o trajeto colorido trecho a trecho.
 */
export function MapaRisco({
  grade,
  faixa,
  posicao,
  centroPadrao,
  caminho,
  selecionadaId,
  onSelecionar,
  margemInferior,
  margemSuperior,
}: MapaRiscoProps) {
  const { cores, escuro } = useTema();
  const mapa = useRef<MapView>(null);
  const centro = posicao ?? centroPadrao;

  // Quando a posição aparece pela primeira vez, leva o mapa até ela.
  const temPosicao = !!posicao;
  useEffect(() => {
    if (temPosicao && posicao) mapa.current?.animateToRegion({ ...posicao, ...DELTA }, 600);
    // Só reage quando a posição passa a existir; não persegue cada passo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temPosicao]);

  function corDoNivel(nivel: NivelRisco) {
    return nivel === 'sem-dado' ? cores.grafiteApagado : cores[NIVEL[nivel].cor];
  }

  const trechos = grade && caminho.length > 1 ? trechosColoridos(grade, caminho, faixa) : [];

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={escuro ? ESTILO_ESCURO : ESTILO_CLARO}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle={escuro ? 'dark' : 'light'}
        initialRegion={{ ...centro, ...DELTA }}
        mapPadding={{ top: margemSuperior, bottom: margemInferior, left: 0, right: 0 }}
        showsPointsOfInterests={false}
        showsBuildings={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onPress={() => onSelecionar(null)}>
        {grade?.celulas.map((celula) => {
          const nivel = nivelNaFaixa(celula, faixa);
          const cor = corDoNivel(nivel);
          const selecionada = celula.id === selecionadaId;
          return (
            <Polygon
              key={celula.id}
              coordinates={cantos(celula)}
              fillColor={comAlfa(cor, nivel === 'sem-dado' ? 0.18 : 0.28)}
              strokeColor={selecionada ? cores.foco : comAlfa(cor, 0.5)}
              strokeWidth={selecionada ? 3 : 1}
              tappable
              onPress={() => onSelecionar(celula)}
            />
          );
        })}

        {trechos.map((t, i) => (
          // Contorno embaixo de cada trecho, para a linha aparecer sobre qualquer cor.
          <Polyline
            key={`fundo-${i}`}
            coordinates={t.pontos}
            strokeColor={cores.papelElevado}
            strokeWidth={10}
            lineCap="round"
          />
        ))}
        {trechos.map((t, i) => (
          <Polyline
            key={`trecho-${i}`}
            coordinates={t.pontos}
            strokeColor={corDoNivel(t.nivel)}
            strokeWidth={6}
            lineCap="round"
          />
        ))}

        {posicao ? (
          <Marker coordinate={posicao} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} title="Você está aqui">
            <View style={[styles.halo, { backgroundColor: comAlfa(cores.foco, 0.18) }]}>
              <View style={[styles.ponto, { backgroundColor: cores.foco, borderColor: cores.papelElevado }]} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      {posicao ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Centralizar no lugar onde você está"
          onPress={() => mapa.current?.animateToRegion({ ...posicao, ...DELTA }, 500)}
          style={({ pressed }) => [
            styles.centralizar,
            sombra.suave,
            {
              top: margemSuperior + 8,
              backgroundColor: cores.papelElevado,
              borderColor: cores.linha,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}>
          <GpsFix size={22} color={cores.grafite} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ponto: { width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
  centralizar: {
    position: 'absolute',
    right: 16,
    width: tamanho.toqueMin,
    height: tamanho.toqueMin,
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
