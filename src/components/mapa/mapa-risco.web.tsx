import { useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Polyline, Rect } from 'react-native-svg';

import { MapTrifold } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { nivelNaFaixa, trechosColoridos } from '@/features/grade/recorte';
import type { Coordenada } from '@/features/grade/tipos';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import type { MapaRiscoProps } from './mapa-risco';

/** Hex #RRGGBB + transparência (0 a 1). */
function comAlfa(hex: string, alfa: number) {
  return `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Versão web (pré-visualização e vídeo no localhost): o mapa nativo (react-native-maps) não roda
 * no navegador. Aqui a grade é desenhada em SVG, num mapa esquemático (sem ruas), com as mesmas
 * cores, a posição e o trajeto colorido trecho a trecho. No celular aparece o mapa de verdade.
 */
export function MapaRisco({
  grade,
  faixa,
  posicao,
  caminho,
  selecionadaId,
  onSelecionar,
  margemInferior,
  margemSuperior,
}: MapaRiscoProps) {
  const { cores, escuro } = useTema();
  const [area, setArea] = useState({ largura: 0, altura: 0 });

  if (!grade || grade.celulas.length === 0) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.vazio,
          { backgroundColor: cores.papelRebaixado, paddingTop: margemSuperior, paddingBottom: margemInferior },
        ]}>
        <MapTrifold size={40} color={cores.grafiteApagado} weight="regular" />
        <Texto variante="legenda" style={styles.centro}>
          Sem dados de risco para desenhar.{'\n'}No celular aparece o mapa de verdade.
        </Texto>
      </View>
    );
  }

  // Área desenhada: a grade inteira, com uma folga.
  const norte = Math.max(...grade.celulas.map((c) => c.limites.norte));
  const sul = Math.min(...grade.celulas.map((c) => c.limites.sul));
  const leste = Math.max(...grade.celulas.map((c) => c.limites.leste));
  const oeste = Math.min(...grade.celulas.map((c) => c.limites.oeste));
  const cosLat = Math.cos((((norte + sul) / 2) * Math.PI) / 180);
  const larguraGraus = (leste - oeste) * cosLat;
  const alturaGraus = norte - sul;
  const ESCALA = 1000 / Math.max(larguraGraus, alturaGraus);
  const folga = 40;
  const W = larguraGraus * ESCALA + folga * 2;
  const H = alturaGraus * ESCALA + folga * 2;
  const x = (lng: number) => folga + (lng - oeste) * cosLat * ESCALA;
  const y = (lat: number) => folga + (norte - lat) * ESCALA;
  const ponto = (c: Coordenada) => `${x(c.longitude)},${y(c.latitude)}`;

  const corDoNivel = (nivel: NivelRisco) => (nivel === 'sem-dado' ? cores.grafiteApagado : cores[NIVEL[nivel].cor]);
  const trechos = caminho.length > 1 ? trechosColoridos(grade, caminho, faixa) : [];
  const linhaRua = escuro ? '#2A2A30' : '#E4E2DC';

  /**
   * Toque no mapa: converte o ponto tocado para a área do desenho e acha a célula.
   * (Uma camada de toque por cima, porque o onPress nas formas SVG gera avisos no navegador.)
   */
  function tocar(e: GestureResponderEvent) {
    const { locationX, locationY } = e.nativeEvent;
    const escala = Math.min(area.largura / W, area.altura / H);
    if (!escala) return;
    const vx = (locationX - (area.largura - W * escala) / 2) / escala;
    const vy = (locationY - (area.altura - H * escala) / 2) / escala;
    const lng = oeste + (vx - folga) / (cosLat * ESCALA);
    const lat = norte - (vy - folga) / ESCALA;
    const celula = grade!.celulas.find(
      (c) => lat <= c.limites.norte && lat >= c.limites.sul && lng <= c.limites.leste && lng >= c.limites.oeste,
    );
    onSelecionar(celula ?? null);
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: cores.papel, paddingTop: margemSuperior, paddingBottom: margemInferior }]}>
      <View
        style={styles.area}
        onLayout={(e) => setArea({ largura: e.nativeEvent.layout.width, altura: e.nativeEvent.layout.height })}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          {/* Sem dado: hachura diagonal (design system v3), nunca a cor de área tranquila. */}
          <Pattern id="hachura" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Line x1={0} y1={0} x2={0} y2={14} stroke={cores.grafiteApagado} strokeWidth={4} strokeOpacity={0.45} />
          </Pattern>
        </Defs>

        {/* "Ruas" esquemáticas ao fundo, só para dar ideia de cidade. */}
        <Rect x={0} y={0} width={W} height={H} fill={escuro ? '#18181C' : '#EFEDE8'} />
        {Array.from({ length: 12 }, (_, i) => (
          <Line key={`v${i}`} x1={(W / 12) * i + 30} y1={0} x2={(W / 12) * i - 10} y2={H} stroke={linhaRua} strokeWidth={6} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <Line key={`h${i}`} x1={0} y1={(H / 9) * i + 20} x2={W} y2={(H / 9) * i + 5} stroke={linhaRua} strokeWidth={6} />
        ))}

        {grade.celulas.map((celula) => {
          const nivel = nivelNaFaixa(celula, faixa);
          const cor = corDoNivel(nivel);
          const selecionada = celula.id === selecionadaId;
          const l = celula.limites;
          const props = {
            x: x(l.oeste) + 1,
            y: y(l.norte) + 1,
            width: (l.leste - l.oeste) * cosLat * ESCALA - 2,
            height: (l.norte - l.sul) * ESCALA - 2,
            rx: 6,
          };
          return (
            <Rect
              key={celula.id}
              {...props}
              fill={nivel === 'sem-dado' ? 'url(#hachura)' : comAlfa(cor, 0.32)}
              stroke={selecionada ? cores.foco : comAlfa(cor, 0.6)}
              strokeWidth={selecionada ? 5 : 1.5}
            />
          );
        })}

        {trechos.map((t, i) => (
          <Polyline key={`f${i}`} points={t.pontos.map(ponto).join(' ')} stroke={cores.papelElevado} strokeWidth={16} strokeLinecap="round" fill="none" />
        ))}
        {trechos.map((t, i) => (
          <Polyline key={`t${i}`} points={t.pontos.map(ponto).join(' ')} stroke={corDoNivel(t.nivel)} strokeWidth={9} strokeLinecap="round" fill="none" />
        ))}

        {posicao ? (
          <>
            <Circle cx={x(posicao.longitude)} cy={y(posicao.latitude)} r={30} fill={comAlfa(cores.foco, 0.18)} />
            <Circle cx={x(posicao.longitude)} cy={y(posicao.latitude)} r={14} fill={cores.foco} stroke={cores.papelElevado} strokeWidth={5} />
          </>
        ) : null}
        {/* Destino do trajeto. */}
        {caminho.length > 1 ? (
          <>
            <Circle
              cx={x(caminho[caminho.length - 1].longitude)}
              cy={y(caminho[caminho.length - 1].latitude)}
              r={16}
              fill={cores.papelElevado}
              stroke={cores.grafite}
              strokeWidth={6}
            />
            <Circle cx={x(caminho[caminho.length - 1].longitude)} cy={y(caminho[caminho.length - 1].latitude)} r={6} fill={cores.grafite} />
          </>
        ) : null}
      </Svg>
        <Pressable
          accessibilityLabel="Mapa de risco. Toque numa área para ver o detalhe."
          onPress={tocar}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: { alignItems: 'center', justifyContent: 'center', gap: espaco[2] },
  centro: { textAlign: 'center' },
  area: { flex: 1 },
});
