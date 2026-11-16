import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bluetooth, BluetoothSlash, Lock, WarningCircle } from '@/components/icones';
import { AnimacaoBusca } from '@/components/pet/animacao-busca';
import { CabecalhoVoltar } from '@/components/pet/cabecalho-voltar';
import { ItemPet } from '@/components/pet/item-pet';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { usePet } from '@/features/pet/pet-context';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Parear hoodi Pet (F06): busca os Pets por perto, lista com o sinal e pareia.
 * Depois de pareado, só este celular comanda o Pet (CA9).
 */
export default function ParearPetScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const pet = usePet();
  const { suporte, bluetooth, buscando, encontrados, pareandoId, erro, iniciarBusca, pararBusca, parear } = pet;
  const podeBuscar = suporte === 'ok' && bluetooth === 'ligado';

  // Começa a buscar ao abrir a tela (com o Bluetooth ligado) e para ao sair (F06 CA3).
  useFocusEffect(
    useCallback(() => {
      if (podeBuscar) iniciarBusca();
      return pararBusca;
    }, [podeBuscar, iniciarBusca, pararBusca]),
  );

  async function aoParear(id: string) {
    const encontrado = encontrados.find((p) => p.id === id);
    if (encontrado && (await parear(encontrado))) router.replace('/pet/conectado');
  }

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={styles.topo}>
        <CabecalhoVoltar titulo="Conectar Hoodi Pet" />
        {/* Radar de busca (Lottie): roda enquanto procura o Pet. */}
        <View style={styles.animacao}>
          <AnimacaoBusca ativo={buscando} />
        </View>
        <View style={styles.textos}>
          <Texto variante="titulo" style={styles.centro}>
            Aproxime o Hoodi Pet
          </Texto>
          <Texto variante="legenda" style={styles.centro}>
            Deixe o Pet ligado e perto do celular.
          </Texto>
        </View>
      </View>

      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <EstadoBusca />

          {podeBuscar && (encontrados.length > 0 || buscando) ? (
            <View>
              <Texto variante="rotulo" cor="grafiteSuave">
                Pets encontrados
              </Texto>
              {encontrados.map((p, i) => (
                <ItemPet
                  key={p.id}
                  pet={p}
                  pareando={pareandoId === p.id}
                  desabilitado={!!pareandoId}
                  ultimo={i === encontrados.length - 1}
                  onParear={() => aoParear(p.id)}
                />
              ))}
              {buscando ? (
                <Texto variante="legenda" style={styles.procurando}>
                  Procurando outros Pets…
                </Texto>
              ) : null}
            </View>
          ) : null}

          {/* Protocolo v1: o pareamento é o do sistema, com o código que aparece na tela do Pet. */}
          {pareandoId ? (
            <Aviso
              icone={Lock}
              titulo="Digite o código do Pet"
              texto="Um código de 6 dígitos aparece na tela do Hoodi Pet. Quando o celular pedir, digite esse código."
            />
          ) : null}

          {erro ? <Aviso icone={WarningCircle} tom="atencao" titulo="Algo deu errado" texto={erro} /> : null}

          <Aviso
            icone={Bluetooth}
            titulo="Só este celular comanda o Pet"
            texto="Depois de pareado, outro celular não consegue fazê-lo vibrar."
          />
        </ScrollView>

        {podeBuscar && !buscando && !pareandoId ? (
          <View style={[styles.rodape, { borderTopColor: cores.linha }]}>
            <Botao rotulo="Procurar de novo" variante="secundario" onPress={iniciarBusca} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Avisos de Bluetooth: sem suporte, sem permissão, desligado (CA6) e nenhum Pet (CA7). */
function EstadoBusca() {
  const { suporte, bluetooth, buscaVazia, iniciarBusca } = usePet();

  if (suporte === 'expo-go') {
    return (
      <Aviso
        icone={BluetoothSlash}
        titulo="O Bluetooth precisa do app instalado"
        texto="O Expo Go não tem Bluetooth. Para parear o Hoodi Pet, use o development build do Hoodi."
      />
    );
  }
  if (suporte === 'web') {
    return (
      <Aviso icone={BluetoothSlash} titulo="Sem Bluetooth no navegador" texto="Para parear o Hoodi Pet, abra o app no celular." />
    );
  }
  if (bluetooth === 'sem-permissao') {
    return (
      <Aviso
        icone={BluetoothSlash}
        titulo="Permita o Bluetooth"
        texto="O Hoodi precisa do Bluetooth para encontrar o Pet e mandar os avisos para ele."
        acao={{ rotulo: 'Permitir', onPress: iniciarBusca }}
      />
    );
  }
  if (bluetooth === 'desligado') {
    return (
      <Aviso
        icone={BluetoothSlash}
        titulo="Ligue o Bluetooth"
        texto="Ative o Bluetooth do celular para procurar o Hoodi Pet."
      />
    );
  }
  if (bluetooth === 'sem-suporte') {
    return <Aviso icone={BluetoothSlash} titulo="Sem Bluetooth" texto="Este celular não tem Bluetooth Low Energy." />;
  }
  if (buscaVazia) {
    return (
      <Aviso
        icone={WarningCircle}
        tom="atencao"
        titulo="Nenhum Hoodi Pet encontrado"
        texto="Confira se o Pet está ligado, com bateria e a menos de 1 m do celular."
        acao={{ rotulo: 'Procurar de novo', onPress: iniciarBusca }}
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: { paddingHorizontal: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  animacao: { width: '46%', alignSelf: 'center' },
  textos: { gap: espaco[1] },
  centro: { textAlign: 'center' },
  painel: {
    flex: 1,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: espaco[2] },
  conteudo: { paddingHorizontal: espaco[4], paddingTop: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  procurando: { paddingTop: espaco[2] },
  rodape: { paddingHorizontal: espaco[4], paddingVertical: espaco[3], borderTopWidth: StyleSheet.hairlineWidth },
});
