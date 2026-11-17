import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Moon, X } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { usePreferencias } from '@/features/preferencias/preferencias-context';
import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function eNoite(d = new Date()) {
  const h = d.getHours();
  return h >= 18 || h < 6;
}

/**
 * Depois das 18h, o Início sugere o tema escuro (F02 CA5), se o app estiver claro.
 * "Usar tema escuro" troca na hora; o X dispensa a sugestão até o dia seguinte.
 */
export function SugestaoTema() {
  const { cores, escuro } = useTema();
  const { mudarTema, carregado } = usePreferencias();
  const [dispensadaHoje, setDispensadaHoje] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    lerPreferencia(PREF.sugestaoTemaDispensadaEm).then((dia) => {
      if (ativo) setDispensadaHoje(dia === hojeISO());
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!carregado || escuro || dispensadaHoje !== false || !eNoite()) return null;

  async function dispensar() {
    setDispensadaHoje(true);
    await salvarPreferencia(PREF.sugestaoTemaDispensadaEm, hojeISO());
  }

  return (
    <View style={[styles.cartao, { backgroundColor: cores.papelRebaixado }]}>
      <Moon size={22} color={cores.grafite} weight="bold" />
      <View style={styles.textos}>
        <Texto variante="corpoForte">Já é noite</Texto>
        <Texto variante="legenda" cor="grafite">
          O tema escuro cansa menos a vista e chama menos atenção na rua.
        </Texto>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Usar tema escuro"
          onPress={() => mudarTema('escuro')}
          style={({ pressed }) => [styles.usar, { opacity: pressed ? 0.6 : 1 }]}>
          <Texto variante="corpoForte" style={styles.sublinhado}>
            Usar tema escuro
          </Texto>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agora não"
        accessibilityHint="Esconde a sugestão até amanhã"
        onPress={dispensar}
        hitSlop={8}
        style={styles.fechar}>
        <X size={20} color={cores.grafiteSuave} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: espaco[3], padding: espaco[4], borderRadius: raio.md, alignItems: 'flex-start' },
  textos: { flex: 1, gap: 2 },
  usar: { minHeight: tamanho.toqueMin, justifyContent: 'center', alignSelf: 'flex-start' },
  sublinhado: { textDecorationLine: 'underline' },
  fechar: { minWidth: tamanho.toqueMin, minHeight: tamanho.toqueMin, alignItems: 'center', justifyContent: 'center', marginTop: -espaco[3], marginRight: -espaco[3] },
});
