import { Redirect, router } from 'expo-router';
import {AccessibilityInfo, ScrollView, StyleSheet, View} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bluetooth, BluetoothSlash, Vibrate, WarningCircle } from '@/components/icones';
import { CabecalhoVoltar } from '@/components/pet/cabecalho-voltar';
import { TelaPet } from '@/components/pet/tela-pet';
import { Aviso } from '@/components/ui/aviso';
import { BlocoIcone } from '@/components/ui/bloco-icone';
import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { Texto } from '@/components/ui/texto';
import { perguntar } from '@/components/ui/perguntar';
import type { Carinha } from '@/features/pet/carinhas';
import { usePet } from '@/features/pet/pet-context';
import { NIVEL } from '@/features/risco/nivel';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

const CARINHAS: { carinha: Carinha; rotulo: string; nivel: 'tranquila' | 'medio' | 'alto' }[] = [
  { carinha: 'tranquila', rotulo: 'Tranquila', nivel: 'tranquila' },
  { carinha: 'atenta', rotulo: 'Atenta', nivel: 'medio' },
  { carinha: 'preocupada', rotulo: 'Preocupada', nivel: 'alto' },
];

/**
 * hoodi Pet conectado (F06 CA4, CA5): estado da conexão, as carinhas de cada nível,
 * Testar vibração e Desconectar.
 */
export default function PetScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { pareado, conectado, erro, testarVibracao, esquecer } = usePet();

  if (!pareado) return <Redirect href="/pet/parear" />;

  function confirmarDesconectar() {
    // Ações que desligam algo sempre pedem confirmação (design system v3).
    perguntar(
      'Desconectar o Hoodi Pet?',
      'Ele deixa de receber os avisos. Para usar de novo, será preciso parear outra vez.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            await esquecer();
            AccessibilityInfo.announceForAccessibility('Hoodi Pet desconectado.');
            router.replace('/');
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.tela, { backgroundColor: cores.papel, paddingTop: insets.top + espaco[3] }]}>
      <View style={styles.topo}>
        <CabecalhoVoltar titulo="Hoodi Pet" />
        <Cartao style={styles.dispositivo}>
          <BlocoIcone
            icone={conectado ? Bluetooth : BluetoothSlash}
            fundo={conectado ? cores.seguroFundo : cores.papelRebaixado}
            cor={conectado ? cores.seguroTexto : cores.grafiteSuave}
          />
          <View style={styles.textos}>
            <Texto variante="corpoForte">{pareado.nome}</Texto>
            <Texto variante="legenda" cor={conectado ? 'seguroTexto' : 'grafiteSuave'}>
              {conectado ? 'Conectado' : 'Desconectado · tentando reconectar'}
            </Texto>
          </View>
        </Cartao>
      </View>

      <View style={[styles.painel, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={styles.textos}>
            <Texto variante="subtitulo" accessibilityRole="header">
              A carinha muda com o nível
            </Texto>
            <Texto variante="legenda">
              Ao entrar numa área de risco maior, o Pet vibra no padrão do nível e mostra a carinha.
            </Texto>
          </View>

          <View style={styles.carinhas}>
            {CARINHAS.map((c) => (
              <View key={c.carinha} style={styles.carinha}>
                <TelaPet carinha={c.carinha} corMoldura={cores[NIVEL[c.nivel].cor]} />
                <Texto variante="rotulo" cor="grafiteSuave" style={styles.centro}>
                  {c.rotulo}
                </Texto>
              </View>
            ))}
          </View>

          {!conectado ? (
            <Aviso
              icone={BluetoothSlash}
              titulo="Hoodi Pet fora de alcance"
              texto="Ligue o Pet e deixe perto do celular. Enquanto isso, a tela e o relógio continuam avisando."
            />
          ) : null}
          {erro ? <Aviso icone={WarningCircle} tom="atencao" titulo="Algo deu errado" texto={erro} /> : null}
        </ScrollView>

        <View style={[styles.rodape, { borderTopColor: cores.linha }]}>
          <Botao
            rotulo="Testar vibração"
            icone={Vibrate}
            onPress={testarVibracao}
            desabilitado={!conectado}
            dica="O Pet vibra e mostra as três carinhas"
          />
          <Botao rotulo="Desconectar" variante="fantasma" onPress={confirmarDesconectar} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: { paddingHorizontal: espaco[4], paddingBottom: espaco[6], gap: espaco[4] },
  dispositivo: { flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  textos: { flex: 1, gap: 2 },
  painel: {
    flex: 1,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: espaco[2] },
  conteudo: { paddingHorizontal: espaco[4], paddingTop: espaco[4], paddingBottom: espaco[6], gap: espaco[6] },
  carinhas: { flexDirection: 'row', gap: espaco[3] },
  carinha: { flex: 1, gap: espaco[2] },
  centro: { textAlign: 'center' },
  rodape: { paddingHorizontal: espaco[4], paddingVertical: espaco[3], gap: espaco[1], borderTopWidth: StyleSheet.hairlineWidth },
});
