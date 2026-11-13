import LottieView, { type AnimationObject } from 'lottie-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useReduzirMovimento } from '@/hooks/use-reduzir-movimento';
import { useTema } from '@/theme/use-tema';

/**
 * Radar de busca do hoodi Pet (Lottie).
 * Animação: "Radar" de Debashish Nabajja (LottieFiles, Lottie Simple License).
 * As expressões do arquivo original foram convertidas em quadros-chave, porque o
 * Lottie nativo não executa expressões. As cores são trocadas pelas do tema.
 */
const RADAR = require('@/assets/animacoes/busca-radar.json') as Record<string, unknown>;

/** Cinza das linhas e branco do miolo, no arquivo original. */
const CINZA_ORIGINAL = 0.36;

function hexParaLottie(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

/** Copia o JSON trocando o cinza pela cor das linhas e o branco pela cor do miolo. */
function recolorir(json: unknown, linha: number[], miolo: number[]): unknown {
  if (Array.isArray(json)) return json.map((v) => recolorir(v, linha, miolo));
  if (!json || typeof json !== 'object') return json;
  const o = json as Record<string, unknown>;
  const copia: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) copia[k] = recolorir(v, linha, miolo);
  if ((o.ty === 'st' || o.ty === 'fl') && o.c && typeof o.c === 'object') {
    const atual = (o.c as { k: unknown }).k;
    if (Array.isArray(atual) && typeof atual[0] === 'number') {
      const cinza = Math.abs(atual[0] - CINZA_ORIGINAL) < 0.01;
      copia.c = { ...(o.c as object), k: cinza ? linha : miolo };
    }
  }
  return copia;
}

type Props = {
  /** Roda enquanto a busca está acontecendo; parado no resto do tempo. */
  ativo: boolean;
};

export function AnimacaoBusca({ ativo }: Props) {
  const { cores } = useTema();
  const reduzir = useReduzirMovimento();
  const ref = useRef<LottieView>(null);

  const fonte = useMemo(
    () => recolorir(RADAR, hexParaLottie(cores.grafite), hexParaLottie(cores.papelElevado)),
    [cores.grafite, cores.papelElevado],
  );

  useEffect(() => {
    if (ativo && !reduzir) ref.current?.play();
    else ref.current?.pause();
  }, [ativo, reduzir]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={ativo ? 'Procurando o hoodi Pet' : 'Busca parada'}
      style={styles.caixa}>
      <LottieView ref={ref} source={fonte as AnimationObject} autoPlay={ativo && !reduzir} loop style={styles.animacao} />
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { aspectRatio: 1, width: '100%' },
  animacao: { width: '100%', height: '100%' },
});
