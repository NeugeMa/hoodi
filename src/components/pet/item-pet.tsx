import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Bluetooth } from '@/components/icones';
import { BlocoIcone } from '@/components/ui/bloco-icone';
import { Texto } from '@/components/ui/texto';
import type { PetEncontrado } from '@/features/pet/pet-ble';
import { descreverSinal } from '@/features/pet/protocolo';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  pet: PetEncontrado;
  pareando: boolean;
  desabilitado: boolean;
  ultimo: boolean;
  onParear: () => void;
};

/** Item de dispositivo (design system v3): Pet encontrado, sinal e Parear. */
export function ItemPet({ pet, pareando, desabilitado, ultimo, onParear }: Props) {
  const { cores } = useTema();
  const sinal = descreverSinal(pet.rssi);
  return (
    <View style={[styles.item, !ultimo && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.linha }]}>
      <BlocoIcone icone={Bluetooth} fundo={cores.papelRebaixado} cor={cores.grafite} />
      <View style={styles.textos}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {pet.nome}
        </Texto>
        <Texto variante="legenda">{sinal}</Texto>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Parear ${pet.nome}. ${sinal}`}
        accessibilityState={{ disabled: desabilitado, busy: pareando }}
        disabled={desabilitado}
        onPress={onParear}
        style={({ pressed }) => [
          styles.botao,
          { backgroundColor: cores.papelRebaixado, opacity: desabilitado && !pareando ? 0.4 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
        ]}>
        {pareando ? <ActivityIndicator color={cores.grafite} /> : <Texto variante="corpoForte">Parear</Texto>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingVertical: espaco[3] },
  textos: { flex: 1 },
  botao: {
    minWidth: 88,
    minHeight: tamanho.toqueMin,
    paddingHorizontal: espaco[4],
    borderRadius: raio.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
