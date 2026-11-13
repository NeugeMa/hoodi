import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bluetooth, BluetoothSlash, Watch } from '@/components/icones';
import { TelaPet } from '@/components/pet/tela-pet';
import { Texto } from '@/components/ui/texto';
import { carinhaDoNivel } from '@/features/pet/carinhas';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import type { Canais } from '@/features/trajeto/tipos';
import { espaco, raio, sombra, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  /** Nome de tratamento. Nulo enquanto a conta (F01) não fornece o nome. */
  nome: string | null;
  /** Bairro de onde a pessoa está. Nulo enquanto a posição não é conhecida. */
  local: string | null;
  nivel: NivelRisco | null;
  canais: Canais;
  onConectarPet: () => void;
};

function saudacao(agora = new Date()) {
  const h = agora.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Parte de cima do Início, no mesmo estilo do Mapa: chip flutuante com saudação e bairro,
 * a telinha do hoodi Pet e os canais de aviso (F05 CA2).
 */
export function HeroiInicio({ nome, local, nivel, canais, onConectarPet }: Props) {
  const { cores, escuro } = useTema();
  const semCor = nivel === null || nivel === 'sem-dado';
  const corMoldura = semCor ? cores.grafiteApagado : cores[NIVEL[nivel].cor];

  return (
    <View style={styles.heroi}>
      <View style={[styles.chip, sombra.suave, { backgroundColor: cores.papelElevado, borderColor: cores.linha }]}>
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
        <Texto variante="subtitulo" accessibilityRole="header" numberOfLines={1} style={styles.encolhe}>
          {nome ? `${saudacao()}, ${nome}` : saudacao()}
        </Texto>
        <Texto variante="legenda" numberOfLines={1} style={styles.encolhe}>
          · {local ?? 'Localizando…'}
        </Texto>
      </View>

      <View style={styles.pet}>
        <TelaPet carinha={carinhaDoNivel(nivel)} corMoldura={corMoldura} />
      </View>

      <View style={styles.canais}>
        <Canal
          rotulo="Relógio"
          conectado={canais.relogio}
          Icone={Watch}
          a11y={canais.relogio ? 'Relógio conectado' : 'Relógio sem notificações'}
        />
        <Canal
          rotulo="hoodi Pet"
          conectado={canais.pet}
          Icone={canais.pet ? Bluetooth : BluetoothSlash}
          a11y={
            canais.pet
              ? 'hoodi Pet conectado'
              : canais.petPareado
                ? 'hoodi Pet reconectando. Toque para ver'
                : 'hoodi Pet desconectado. Toque para conectar'
          }
          onPress={canais.pet ? undefined : onConectarPet}
        />
      </View>
    </View>
  );
}

type CanalProps = {
  rotulo: string;
  conectado: boolean;
  Icone: typeof Watch;
  a11y: string;
  onPress?: () => void;
};

/** Indicador de canal: verde conectado; cinza desconectado, nunca vermelho. */
function Canal({ rotulo, conectado, Icone, a11y, onPress }: CanalProps) {
  const { cores } = useTema();
  const cor = conectado ? cores.seguroTexto : cores.grafiteSuave;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={a11y}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.canal,
        {
          backgroundColor: conectado ? cores.seguroFundo : cores.papelElevado,
          borderColor: conectado ? cores.seguroFundo : cores.linha,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}>
      <Icone size={16} color={cor} weight="bold" />
      <Texto variante="rotulo" style={{ color: cor }}>
        {rotulo}
      </Texto>
      {onPress ? (
        <Texto variante="rotulo" cor="grafite" style={styles.sublinhado}>
          Conectar
        </Texto>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroi: { gap: espaco[4], alignItems: 'center' },
  chip: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[2],
    paddingLeft: espaco[2],
    paddingRight: espaco[4],
    paddingVertical: espaco[2],
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logo: { width: 32, height: 32 },
  encolhe: { flexShrink: 1 },
  pet: { width: '82%' },
  canais: { flexDirection: 'row', gap: espaco[2] },
  canal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[1],
    minHeight: tamanho.toqueMin - 8,
    paddingHorizontal: espaco[3],
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sublinhado: { textDecorationLine: 'underline', marginLeft: espaco[1] },
});
