import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Path, Warning, WarningCircle, X } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { useAcompanhamento } from '@/features/alerta/acompanhamento-context';
import { espaco, raio, sombra, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Alerta de risco na tela (F07, design system v3 "Alerta de risco").
 * Risco alto: fundo vermelho, "Ver desvio", fica até a pessoa agir ou sair da área (CA6).
 * Risco médio: fundo âmbar claro, sem ação obrigatória; some sozinho.
 * Entra deslizando de cima, sobre qualquer tela.
 */
export function AvisoRisco() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { alertaAtivo, dispensarAlerta } = useAcompanhamento();
  if (!alertaAtivo) return null;

  const alto = alertaAtivo.nivel === 'alto';
  const fundo = alto ? cores.capuz : cores.atencaoFundo;
  const texto = alto ? cores.sobreCapuz : cores.grafite;
  const Icone = alto ? Warning : WarningCircle;

  function verDesvio() {
    // Comparar rotas (F04) ainda está em produção.
    Alert.alert('Ver desvio', 'A comparação de rotas ainda está em produção (F04).');
    dispensarAlerta();
  }

  return (
    <View pointerEvents="box-none" style={[styles.camada, { top: insets.top + espaco[2] }]}>
      <Animated.View
        entering={SlideInUp.duration(260)}
        exiting={SlideOutUp.duration(200)}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={[styles.cartao, sombra.suave, { backgroundColor: fundo }]}>
        <View style={styles.linha}>
          <Icone size={26} color={alto ? cores.sobreCapuz : cores.atencaoTexto} weight="bold" />
          <View style={styles.textos}>
            <Texto variante="subtitulo" style={{ color: texto }}>
              {alertaAtivo.titulo}
            </Texto>
            <Texto style={{ color: texto }}>{alertaAtivo.texto}</Texto>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
            onPress={dispensarAlerta}
            hitSlop={8}
            style={styles.fechar}>
            <X size={20} color={texto} weight="bold" />
          </Pressable>
        </View>

        {alto ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver desvio"
            onPress={verDesvio}
            style={({ pressed }) => [
              styles.acao,
              { backgroundColor: cores.papelElevado, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}>
            <Path size={20} color={cores.grafite} weight="bold" />
            <Texto variante="corpoForte">Ver desvio</Texto>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  camada: { position: 'absolute', left: espaco[4], right: espaco[4], zIndex: 10 },
  cartao: { borderRadius: raio.lg, padding: espaco[4], gap: espaco[3] },
  linha: { flexDirection: 'row', gap: espaco[3], alignItems: 'flex-start' },
  textos: { flex: 1, gap: 2 },
  fechar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  acao: {
    minHeight: tamanho.toqueMin,
    borderRadius: raio.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[2],
  },
});
