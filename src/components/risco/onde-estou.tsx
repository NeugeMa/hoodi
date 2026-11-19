import { StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Selo do nível: ícone + nome sobre a cor do nível. */
export function SeloNivel({ nivel }: { nivel: NivelRisco }) {
  const { cores } = useTema();
  const meta = NIVEL[nivel];
  const fundo = nivel === 'sem-dado' ? cores.papelRebaixado : cores[meta.cor];
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      <meta.icone size={14} color={cores[meta.sobre]} weight="bold" />
      <Texto variante="rotulo" style={{ color: cores[meta.sobre] }}>
        {meta.nome}
      </Texto>
    </View>
  );
}

type OndeEstouProps = {
  nivel: NivelRisco | null;
  local: string | null;
  explicacao: string;
};

/** Conteúdo padrão: onde você está agora. */
export function OndeEstou({ nivel, local, explicacao }: OndeEstouProps) {
  // Local vazio (ex.: posição sem grade) cai no nome do nível, para o título nunca ficar em branco.
  const titulo = nivel ? local || NIVEL[nivel].nome : 'Localizando você';
  return (
    <View
      accessible
      accessibilityLabel={`Onde você está agora: ${nivel ? `${NIVEL[nivel].nome}${local ? `, ${local}` : ''}` : 'localizando'}. ${explicacao}`}
      accessibilityLiveRegion="polite"
      style={styles.bloco}>
      <View style={styles.topo}>
        <Texto variante="rotulo" cor="grafiteSuave">
          Onde você está agora
        </Texto>
        {nivel ? <SeloNivel nivel={nivel} /> : null}
      </View>
      <Texto variante="titulo" accessibilityRole="text">
        {titulo}
      </Texto>
      <Texto variante="legenda">{explicacao}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espaco[1] },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[1],
    paddingHorizontal: espaco[2],
    paddingVertical: espaco[1],
    borderRadius: raio.sm,
  },
});
