import { StyleSheet, View } from 'react-native';

import { ClockCounterClockwise } from '@/components/icones';
import { BlocoIcone } from '@/components/ui/bloco-icone';
import { Texto } from '@/components/ui/texto';
import { agruparPorDia, hora } from '@/features/historico/agrupar';
import type { AlertaSalvo } from '@/features/historico/tipos';
import { NIVEL } from '@/features/risco/nivel';
import { espaco } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Alertas agrupados por dia, do mais recente para o mais antigo (F10 CA1). */
export function ListaAlertas({ alertas }: { alertas: AlertaSalvo[] }) {
  const grupos = agruparPorDia(alertas);
  return (
    <View style={styles.lista}>
      {grupos.map((grupo) => (
        <View key={grupo.titulo} style={styles.grupo}>
          <Texto variante="rotulo" cor="grafiteSuave" accessibilityRole="header">
            {grupo.titulo}
          </Texto>
          <View>
            {grupo.alertas.map((alerta, i) => (
              <ItemAlerta key={alerta.id} alerta={alerta} ultimo={i === grupo.alertas.length - 1} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function ItemAlerta({ alerta, ultimo }: { alerta: AlertaSalvo; ultimo: boolean }) {
  const { cores } = useTema();
  const meta = NIVEL[alerta.nivel];
  const quando = hora(alerta.criadoEm);
  return (
    <View
      accessible
      accessibilityLabel={`${meta.nome} em ${alerta.trecho}, às ${quando}`}
      style={[styles.item, !ultimo && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.linha }]}>
      <BlocoIcone
        icone={meta.icone}
        fundo={alerta.nivel === 'alto' ? cores.capuz : cores[meta.fundo]}
        cor={alerta.nivel === 'alto' ? cores.sobreCapuz : cores[meta.texto]}
      />
      <View style={styles.textos}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {alerta.trecho}
        </Texto>
        <Texto variante="legenda">
          {meta.nome} · {quando}
        </Texto>
      </View>
    </View>
  );
}

/** Lista vazia (F10 CA4). */
export function SemAlertas() {
  const { cores } = useTema();
  return (
    <View style={styles.vazio}>
      <ClockCounterClockwise size={40} color={cores.grafiteApagado} weight="regular" />
      <Texto variante="corpoForte">Ainda não há alertas</Texto>
      <Texto variante="legenda" style={styles.centro}>
        Os alertas dos seus trajetos aparecem aqui.
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: espaco[6] },
  grupo: { gap: espaco[1] },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingVertical: espaco[3] },
  textos: { flex: 1 },
  vazio: { alignItems: 'center', gap: espaco[2], paddingVertical: espaco[8] },
  centro: { textAlign: 'center' },
});
