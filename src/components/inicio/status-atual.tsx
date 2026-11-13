import { StyleSheet, View } from 'react-native';

import { TelaPet } from '@/components/pet/tela-pet';
import { Cartao } from '@/components/ui/cartao';
import { Texto } from '@/components/ui/texto';
import { carinhaDoNivel } from '@/features/pet/carinhas';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  /** Nulo enquanto a posição ainda não é conhecida. */
  nivel: NivelRisco | null;
  explicacao: string;
};

/**
 * Status de onde a pessoa está agora: a telinha do hoodi Pet, o nível e o motivo.
 * Cor nunca sozinha: moldura e selo na cor do nível + ícone + palavra + carinha.
 * "Sem dado" e "Localizando" ficam em cinza, nunca em verde.
 */
export function StatusAtual({ nivel, explicacao }: Props) {
  const { cores } = useTema();
  const meta = nivel ? NIVEL[nivel] : null;
  const semCor = nivel === null || nivel === 'sem-dado';
  const corMoldura = semCor ? cores.grafiteApagado : cores[meta!.cor];
  const titulo = meta?.nome ?? 'Localizando você';

  return (
    <Cartao destaque style={styles.cartao}>
      <TelaPet carinha={carinhaDoNivel(nivel)} corMoldura={corMoldura} />

      <View
        accessible
        // F05 CA5: o leitor de tela anuncia o nome do nível, sem depender da cor.
        accessibilityLabel={`Onde você está agora: ${titulo}. ${explicacao}`}
        accessibilityLiveRegion="polite"
        style={styles.textos}>
        <Texto variante="rotulo" cor="grafiteSuave">
          Onde você está agora
        </Texto>
        <View style={styles.titulo}>
          <Texto variante="titulo" accessibilityRole="text" style={styles.textoTitulo}>
            {titulo}
          </Texto>
          {meta ? (
            <View style={[styles.selo, { backgroundColor: cores[meta.fundo] }]}>
              <meta.icone size={18} color={cores[meta.texto]} weight="bold" />
            </View>
          ) : null}
        </View>
        <Texto variante="legenda">{explicacao}</Texto>
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: espaco[3], gap: espaco[4] },
  textos: { gap: espaco[1], paddingHorizontal: espaco[2], paddingBottom: espaco[2] },
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2] },
  textoTitulo: { flexShrink: 1 },
  selo: { width: 32, height: 32, borderRadius: raio.total, alignItems: 'center', justifyContent: 'center' },
});
