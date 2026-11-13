import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { ALTURA, LARGURA, NOME_CARINHA, QUADROS, type Carinha } from '@/features/pet/carinhas';
import { espaco, raio } from '@/theme/tokens';

/** Tinta da tela OLED do Pet: igual nos dois temas, como um aparelho de verdade. */
const FUNDO_TELA = '#111114';
const PIXEL = '#F2F1EE';

type Props = {
  carinha: Carinha;
  /** Cor da moldura: a cor do nível de risco (cor + carinha + palavra). */
  corMoldura: string;
};

/** Respeita "Reduzir movimento" do sistema: sem animação, fica no primeiro quadro. */
function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzir);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => sub.remove();
  }, []);
  return reduzir;
}

function useQuadroAtual(carinha: Carinha, parado: boolean) {
  const [indice, setIndice] = useState(0);
  const quadros = QUADROS[carinha];

  // Volta ao primeiro quadro quando a carinha muda.
  const [carinhaAnterior, setCarinhaAnterior] = useState(carinha);
  if (carinhaAnterior !== carinha) {
    setCarinhaAnterior(carinha);
    setIndice(0);
  }

  useEffect(() => {
    if (parado) return;
    const t = setTimeout(() => setIndice((i) => (i + 1) % quadros.length), quadros[indice].ms);
    return () => clearTimeout(t);
  }, [indice, quadros, parado]);

  return quadros[parado ? 0 : indice % quadros.length];
}

/**
 * Telinha do hoodi Pet: a mesma carinha que aparece no Pet, animada em pixel art.
 * tranquila → sorri e respira · atenta → olha em volta · preocupada → treme ·
 * confusa (Sem dado) → interrogação · procurando → pontinhos carregando.
 */
export function TelaPet({ carinha, corMoldura }: Props) {
  const reduzir = useReduzirMovimento();
  const quadro = useQuadroAtual(carinha, reduzir);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Carinha do hoodi Pet: ${NOME_CARINHA[carinha]}`}
      style={[styles.moldura, { borderColor: corMoldura }]}>
      <View style={styles.tela}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
          <Defs>
            {/* Pixels apagados bem fraquinhos, como numa tela de LCD. */}
            <Pattern id="pixels-apagados" width={1} height={1} patternUnits="userSpaceOnUse">
              <Rect x={0.06} y={0.06} width={0.88} height={0.88} fill={PIXEL} opacity={0.035} />
            </Pattern>
          </Defs>
          <Rect width={LARGURA} height={ALTURA} fill={FUNDO_TELA} />
          <Rect width={LARGURA} height={ALTURA} fill="url(#pixels-apagados)" />
          {quadro.pixels.map(([x, y]) => (
            <Rect key={`${x}-${y}`} x={x + 0.03} y={y + 0.03} width={0.94} height={0.94} fill={PIXEL} />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moldura: {
    borderWidth: 3,
    borderRadius: raio.lg,
    padding: espaco[3],
    backgroundColor: FUNDO_TELA,
  },
  tela: {
    width: '100%',
    aspectRatio: LARGURA / ALTURA,
  },
});
