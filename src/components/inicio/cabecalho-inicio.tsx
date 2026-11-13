import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bluetooth, BluetoothSlash, MapPin } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import type { Canais } from '@/features/trajeto/tipos';
import { espaco, raio, sombra, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  /** Nome de tratamento. Nulo enquanto a conta (F01) não fornece o nome. */
  nome: string | null;
  /** Bairro de onde a pessoa está. Nulo enquanto a posição não é conhecida. */
  local: string | null;
  canais: Canais;
  onConectarPet: () => void;
};

function saudacao(agora = new Date()) {
  const h = agora.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** F05 CA2: diz em uma frase por onde os avisos chegam. */
function fraseCanais({ relogio, pet, petPareado }: Canais) {
  if (pet) return relogio ? 'Avisos no relógio e no hoodi Pet' : 'Avisos no hoodi Pet e na tela';
  if (petPareado) return 'hoodi Pet reconectando…';
  return relogio ? 'Avisos no relógio e na tela' : 'Avisos só na tela';
}

export function CabecalhoInicio({ nome, local, canais, onConectarPet }: Props) {
  const { cores, escuro } = useTema();
  const IconePet = canais.pet ? Bluetooth : BluetoothSlash;
  const rotuloPet = canais.pet
    ? 'hoodi Pet conectado'
    : canais.petPareado
      ? 'hoodi Pet reconectando. Toque para ver'
      : 'hoodi Pet desconectado. Toque para conectar';

  return (
    <View style={styles.cabecalho}>
      <View style={styles.barra}>
        <View style={styles.local}>
          {/* Tema escuro usa a versão com contorno (regra de uso da logo). */}
          <Image
            source={
              escuro
                ? require('@/assets/images/logo-chapeuzinho-contorno.png')
                : require('@/assets/images/logo-chapeuzinho.png')
            }
            style={styles.logo}
            contentFit="contain"
            accessible={false}
          />
          <MapPin size={16} color={cores.grafiteSuave} weight="fill" />
          <Texto variante="legenda" numberOfLines={1} style={styles.textoLocal}>
            {local ?? 'Localizando…'}
          </Texto>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rotuloPet}
          onPress={onConectarPet}
          style={({ pressed }) => [
            styles.botaoPet,
            sombra.suave,
            {
              backgroundColor: cores.papelElevado,
              borderColor: cores.linha,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}>
          <IconePet size={22} color={canais.pet ? cores.seguroTexto : cores.grafiteSuave} weight="bold" />
          <View
            style={[
              styles.pontoPet,
              { backgroundColor: canais.pet ? cores.seguro : cores.grafiteApagado, borderColor: cores.papelElevado },
            ]}
          />
        </Pressable>
      </View>

      <View style={styles.saudacao}>
        <Texto variante="display">{nome ? `${saudacao()}, ${nome}` : saudacao()}</Texto>
        <Texto variante="legenda">{fraseCanais(canais)}</Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { gap: espaco[6] },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  local: { flexDirection: 'row', alignItems: 'center', gap: espaco[2], flexShrink: 1 },
  // Altura mínima da logo na interface: 32px.
  logo: { width: 32, height: 32, marginRight: espaco[1] },
  textoLocal: { flexShrink: 1 },
  botaoPet: {
    width: tamanho.toqueMin,
    height: tamanho.toqueMin,
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoPet: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  saudacao: { gap: espaco[1] },
});
