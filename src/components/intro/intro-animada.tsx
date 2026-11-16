import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { Texto } from '@/components/ui/texto';
import { useReduzirMovimento } from '@/hooks/use-reduzir-movimento';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  /** Chamado quando a animação termina; aí o app mostra o Início. */
  aoTerminar: () => void;
};

/**
 * Introdução ao abrir o app: a logo da Chapeuzinho aparece (a mesma da splash, então a troca não pisca),
 * o nome "Hoodi" sobe, a frase do app aparece e tudo some, revelando o Início. ~2 s.
 * Com "Reduzir movimento" ligado no celular, só aparece e some, sem movimento.
 */
export function IntroAnimada({ aoTerminar }: Props) {
  const { cores, escuro } = useTema();
  const reduzir = useReduzirMovimento();
  const [logo] = useState(() => new Animated.Value(0));
  const [nome] = useState(() => new Animated.Value(0));
  const [frase] = useState(() => new Animated.Value(0));
  const [tela] = useState(() => new Animated.Value(1));
  const terminar = useRef(aoTerminar);

  useEffect(() => {
    terminar.current = aoTerminar;
  });

  useEffect(() => {
    const suave = Easing.out(Easing.cubic);
    const animacao = Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: reduzir ? 200 : 550, easing: suave, useNativeDriver: true }),
      Animated.timing(nome, { toValue: 1, duration: reduzir ? 150 : 420, easing: suave, useNativeDriver: true }),
      Animated.timing(frase, { toValue: 1, duration: reduzir ? 150 : 320, easing: suave, useNativeDriver: true }),
      Animated.delay(reduzir ? 400 : 650),
      Animated.timing(tela, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    animacao.start(({ finished }) => {
      if (finished) terminar.current();
    });
    return () => animacao.stop();
  }, [logo, nome, frase, tela, reduzir]);

  return (
    <Animated.View
      accessible
      accessibilityLabel="Hoodi. Alerta de risco sem tirar o celular do bolso."
      style={[styles.tela, { backgroundColor: cores.papel, opacity: tela }]}>
      <Animated.View
        style={{
          opacity: logo,
          transform: reduzir ? [] : [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        }}>
        <Image
          source={
            escuro
              ? require('@/assets/images/logo-chapeuzinho-contorno.png')
              : require('@/assets/images/logo-chapeuzinho.png')
          }
          contentFit="contain"
          style={styles.logo}
        />
      </Animated.View>
      <Animated.View
        style={{
          opacity: nome,
          transform: reduzir ? [] : [{ translateY: nome.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}>
        <Texto variante="display" style={styles.nome}>
          Hoodi
        </Texto>
      </Animated.View>
      <Animated.View style={{ opacity: frase }}>
        <Texto variante="legenda">Alerta de risco sem tirar o celular do bolso.</Texto>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tela: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: espaco[3] },
  logo: { width: 160, height: 160 },
  nome: { fontSize: 44, lineHeight: 50 },
});
