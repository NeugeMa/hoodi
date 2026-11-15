import { Pressable, StyleSheet, View } from 'react-native';

import { CheckCircle, Path, ShieldCheck } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  titulo: string;
  minutos: number;
  metros: number;
  /** Frase de explicação (só na rota de menor risco registrado). */
  frase?: string;
  /** Destaque da rota de menor risco registrado (nunca "rota segura", CA3). */
  menorRisco?: boolean;
  selecionada: boolean;
  aoEscolher: () => void;
};

function distancia(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(m / 10) * 10} m`;
}

/** Card de rota (design system v3): tempo, distância e, na de menor risco, a frase que explica. */
export function CartaoRota({ titulo, minutos, metros, frase, menorRisco, selecionada, aoEscolher }: Props) {
  const { cores } = useTema();
  const Icone = menorRisco ? ShieldCheck : Path;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: selecionada }}
      accessibilityLabel={`${titulo}. ${minutos} minutos, ${distancia(metros)}.${frase ? ` ${frase}` : ''}`}
      onPress={aoEscolher}
      style={({ pressed }) => [
        styles.cartao,
        {
          backgroundColor: cores.papelRebaixado,
          borderColor: selecionada ? cores.grafite : 'transparent',
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}>
      <View style={styles.linha}>
        <Icone size={22} color={menorRisco ? cores.seguroTexto : cores.grafite} weight="bold" />
        <Texto variante="corpoForte" style={styles.titulo}>
          {titulo}
        </Texto>
        {selecionada ? <CheckCircle size={22} color={cores.grafite} weight="fill" /> : null}
      </View>
      <Texto variante="subtitulo">
        {minutos} min <Texto variante="legenda">· {distancia(metros)}</Texto>
      </Texto>
      {frase ? (
        <Texto variante="legenda" cor={menorRisco ? 'seguroTexto' : 'grafiteSuave'}>
          {frase}
        </Texto>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: { borderRadius: raio.md, borderWidth: 2, padding: espaco[4], gap: espaco[2] },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  titulo: { flex: 1 },
});
