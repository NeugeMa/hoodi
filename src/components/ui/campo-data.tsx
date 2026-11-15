import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarBlank, WarningCircle } from '@/components/icones';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Botao } from './botao';
import { Texto } from './texto';

type Props = {
  rotulo: string;
  valor: Date | null;
  aoMudar: (data: Date) => void;
  erro?: string | null;
  ajuda?: string;
  /** Data que o calendário mostra quando ainda não há valor. */
  inicial?: Date;
  maxima?: Date;
  minima?: Date;
  aoAbrir?: () => void;
};

export function formatarData(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Campo de data com calendário (ex.: data de nascimento no Criar conta).
 * Mesmo visual do Campo de texto; ao tocar, abre o calendário do sistema:
 * diálogo no Android, folha com calendário no iPhone.
 */
export function CampoData({ rotulo, valor, aoMudar, erro, ajuda, inicial, maxima, minima, aoAbrir }: Props) {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const [abertoIos, setAbertoIos] = useState(false);
  const [rascunho, setRascunho] = useState<Date>(valor ?? inicial ?? new Date());

  function abrir() {
    aoAbrir?.();
    const atual = valor ?? inicial ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: atual,
        mode: 'date',
        maximumDate: maxima,
        minimumDate: minima,
        positiveButton: { label: 'OK' },
        negativeButton: { label: 'Cancelar' },
        onValueChange: (_e, data) => aoMudar(data),
      });
    } else {
      setRascunho(atual);
      setAbertoIos(true);
    }
  }

  const borda = erro ? cores.perigoTexto : 'transparent';

  return (
    <View style={styles.campo}>
      <Texto variante="legenda" cor="grafite" accessible={false}>
        {rotulo}
      </Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor ? formatarData(valor) : 'não escolhida'}`}
        accessibilityHint={erro ?? ajuda ?? 'Abre o calendário'}
        onPress={abrir}
        style={({ pressed }) => [
          styles.caixa,
          { backgroundColor: cores.papelRebaixado, borderColor: borda, transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}>
        <CalendarBlank size={20} color={cores.grafiteSuave} weight="bold" />
        <Texto cor={valor ? 'grafite' : 'grafiteApagado'}>{valor ? formatarData(valor) : 'Escolha no calendário'}</Texto>
      </Pressable>
      {erro ? (
        <View style={styles.erro} accessibilityLiveRegion="polite">
          <WarningCircle size={18} color={cores.perigoTexto} weight="bold" />
          <Texto variante="legenda" cor="perigoTexto" style={styles.textoErro}>
            {erro}
          </Texto>
        </View>
      ) : ajuda ? (
        <Texto variante="legenda" accessible={false}>
          {ajuda}
        </Texto>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={abertoIos} transparent animationType="slide" onRequestClose={() => setAbertoIos(false)}>
          <Pressable
            accessibilityLabel="Fechar o calendário"
            style={styles.fundo}
            onPress={() => setAbertoIos(false)}
          />
          <View style={[styles.folha, { backgroundColor: cores.papelElevado, paddingBottom: insets.bottom + espaco[3] }]}>
            <Texto variante="subtitulo">{rotulo}</Texto>
            <RNDateTimePicker
              value={rascunho}
              mode="date"
              display="inline"
              locale="pt-BR"
              themeVariant={escuro ? 'dark' : 'light'}
              accentColor={cores.grafite}
              maximumDate={maxima}
              minimumDate={minima}
              onValueChange={(_e, data) => setRascunho(data)}
            />
            <Botao
              rotulo="Pronto"
              onPress={() => {
                aoMudar(rascunho);
                setAbertoIos(false);
              }}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { gap: espaco[2] },
  caixa: {
    minHeight: tamanho.toquePrincipal,
    borderRadius: raio.sm,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    paddingHorizontal: espaco[4] - 2,
  },
  erro: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco[2] },
  textoErro: { flex: 1 },
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    paddingHorizontal: espaco[4],
    paddingTop: espaco[4],
    gap: espaco[3],
  },
});
