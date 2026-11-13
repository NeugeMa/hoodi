import { Pressable, StyleSheet, View } from 'react-native';

import { Bell, Clock, Path, type Icon } from '@/components/icones';
import { BlocoIcone } from '@/components/ui/bloco-icone';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { NIVEL } from '@/features/risco/nivel';
import type { Trajeto } from '@/features/trajeto/tipos';
import type { Cores } from '@/theme/tokens';
import { espaco, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  trajeto: Trajeto | null;
  onCompararRotas: () => void;
  onEncerrar: () => void;
};

/**
 * "Seu trajeto" dentro do painel do Início (F05 CA1), em linhas de lista sem cards.
 * Com trajeto: tempo até o destino, alertas e próximo trecho de maior risco.
 * Sem trajeto: convite para comparar rotas.
 */
export function SecaoTrajeto({ trajeto, onCompararRotas, onEncerrar }: Props) {
  return (
    <View style={styles.secao}>
      <View style={styles.cabecalho}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Seu trajeto
        </Texto>
        {trajeto ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Encerrar trajeto"
            accessibilityHint="Pede confirmação antes de encerrar"
            onPress={onEncerrar}
            hitSlop={12}
            style={styles.link}>
            <Texto variante="legenda" cor="grafite" style={styles.sublinhado}>
              Encerrar
            </Texto>
          </Pressable>
        ) : null}
      </View>

      {trajeto ? <ListaTrajeto trajeto={trajeto} /> : <SemTrajeto onCompararRotas={onCompararRotas} />}
    </View>
  );
}

function ListaTrajeto({ trajeto }: { trajeto: Trajeto }) {
  const trecho = trajeto.proximoTrecho;
  const metaTrecho = trecho ? NIVEL[trecho.nivel] : null;
  const alertas = trajeto.alertasRecebidos === 1 ? '1 alerta' : `${trajeto.alertasRecebidos} alertas`;

  return (
    <View>
      <Linha
        icone={Clock}
        rotulo={`Até ${trajeto.destino}`}
        valor={`${trajeto.minutosAteDestino} min`}
        a11y={`Faltam ${trajeto.minutosAteDestino} minutos até ${trajeto.destino}`}
      />
      <Linha icone={Bell} rotulo="Neste trajeto" valor={alertas} a11y={`${alertas} neste trajeto`} />
      {trecho && metaTrecho ? (
        <Linha
          icone={metaTrecho.icone}
          corIcone={metaTrecho.texto}
          fundoIcone={metaTrecho.fundo}
          rotulo={`Em ${trecho.distanciaMetros} m · ${metaTrecho.nome}`}
          valor={trecho.rua}
          corValor={metaTrecho.texto}
          a11y={`Em ${trecho.distanciaMetros} metros, ${trecho.rua}: ${metaTrecho.nome}.`}
          ultima
        />
      ) : null}
    </View>
  );
}

type LinhaProps = {
  icone: Icon;
  rotulo: string;
  valor: string;
  a11y: string;
  corIcone?: keyof Cores;
  fundoIcone?: keyof Cores;
  corValor?: keyof Cores;
  ultima?: boolean;
};

function Linha({ icone, rotulo, valor, a11y, corIcone, fundoIcone, corValor, ultima }: LinhaProps) {
  const { cores } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={a11y}
      style={[styles.linha, !ultima && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.linha }]}>
      <BlocoIcone icone={icone} fundo={cores[fundoIcone ?? 'papelRebaixado']} cor={cores[corIcone ?? 'grafite']} />
      <View style={styles.textos}>
        <Texto variante="legenda" numberOfLines={1}>
          {rotulo}
        </Texto>
        <Texto variante="corpoForte" cor={corValor} numberOfLines={1}>
          {valor}
        </Texto>
      </View>
    </View>
  );
}

function SemTrajeto({ onCompararRotas }: { onCompararRotas: () => void }) {
  const { cores } = useTema();
  return (
    <View style={styles.vazio}>
      <View style={styles.vazioTopo}>
        <BlocoIcone icone={Path} fundo={cores.papelRebaixado} cor={cores.grafite} />
        <View style={styles.textos}>
          <Texto variante="corpoForte">Nenhum trajeto agora</Texto>
          <Texto variante="legenda">Compare rotas e escolha a de menor risco registrado.</Texto>
        </View>
      </View>
      <Botao rotulo="Comparar rotas" variante="secundario" icone={Path} onPress={onCompararRotas} />
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: espaco[2] },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: tamanho.toqueMin, justifyContent: 'center' },
  sublinhado: { textDecorationLine: 'underline' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingVertical: espaco[3] },
  textos: { flex: 1 },
  vazio: { gap: espaco[3] },
  vazioTopo: { flexDirection: 'row', gap: espaco[3], alignItems: 'center' },
});
