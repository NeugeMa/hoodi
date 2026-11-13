import { Pressable, StyleSheet, View } from 'react-native';

import { Bluetooth, BluetoothSlash, Watch } from '@/components/icones';
import { TelaPet } from '@/components/pet/tela-pet';
import { Texto } from '@/components/ui/texto';
import { carinhaDoNivel } from '@/features/pet/carinhas';
import { NIVEL, type NivelRisco } from '@/features/risco/nivel';
import type { Canais } from '@/features/trajeto/tipos';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  nivel: NivelRisco | null;
  canais: Canais;
  onConectarPet: () => void;
  /** Abre a orientação do relógio (F06) quando ele ainda não foi configurado. */
  onConfigurarRelogio: () => void;
};

/**
 * Parte de cima do Início: a telinha do hoodi Pet e os canais de aviso (F05 CA2).
 * Sem título nem saudação; o bairro fica no painel de baixo ("Onde você está agora").
 */
export function HeroiInicio({ nivel, canais, onConectarPet, onConfigurarRelogio }: Props) {
  const { cores } = useTema();
  const semCor = nivel === null || nivel === 'sem-dado';
  const corMoldura = semCor ? cores.grafiteApagado : cores[NIVEL[nivel].cor];

  return (
    <View style={styles.heroi}>
      <View style={styles.pet}>
        <TelaPet carinha={carinhaDoNivel(nivel)} corMoldura={corMoldura} />
      </View>

      <View style={styles.canais}>
        <Canal
          rotulo="Relógio"
          conectado={canais.relogio}
          Icone={Watch}
          a11y={canais.relogio ? 'Relógio configurado' : 'Relógio não configurado. Toque para configurar'}
          acao="Configurar"
          onPress={canais.relogio ? undefined : onConfigurarRelogio}
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
          acao="Conectar"
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
  /** Texto do link quando o canal não está ativo ("Conectar", "Configurar"). */
  acao?: string;
  onPress?: () => void;
};

/** Indicador de canal: verde conectado; cinza desconectado, nunca vermelho. */
function Canal({ rotulo, conectado, Icone, a11y, acao, onPress }: CanalProps) {
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
          {acao}
        </Texto>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroi: { gap: espaco[4], alignItems: 'center' },
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
