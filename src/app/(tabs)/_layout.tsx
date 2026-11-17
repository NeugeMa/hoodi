import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockCounterClockwise, House, MapTrifold, User, type Icon } from '@/components/icones';
import { Texto } from '@/components/ui/texto';
import { espaco, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Barra de navegação: Início, Mapa, Histórico e Perfil.
 * Itens com 56px, ícone e rótulo; ativo em grafite, ícone preenchido e um ponto vermelho de 4px.
 */
export default function TabsLayout() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  function icone(Icone: Icon) {
    function IconeAba({ color, focused }: { color: ColorValue; focused: boolean }) {
      return <Icone size={tamanho.icone} color={color as string} weight={focused ? 'fill' : 'regular'} />;
    }
    return IconeAba;
  }

  function RotuloAba({ focused, color, children }: { focused: boolean; color: ColorValue; children: string }) {
    return (
      <View style={styles.rotulo}>
        <Texto variante="rotulo" style={{ color: color as string }}>
          {children}
        </Texto>
        <View style={[styles.ponto, { backgroundColor: focused ? cores.capuz : 'transparent' }]} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: cores.papel },
        tabBarActiveTintColor: cores.grafite,
        tabBarInactiveTintColor: cores.grafiteApagado,
        tabBarLabel: RotuloAba,
        tabBarStyle: {
          backgroundColor: cores.papelElevado,
          borderTopColor: cores.linha,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tamanho.toquePrincipal + espaco[3] + insets.bottom,
          paddingTop: espaco[2],
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone(House) }} />
      <Tabs.Screen name="mapa" options={{ title: 'Mapa', tabBarIcon: icone(MapTrifold) }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico', tabBarIcon: icone(ClockCounterClockwise) }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone(User) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  rotulo: { alignItems: 'center', gap: 2 },
  ponto: { width: 4, height: 4, borderRadius: 2 },
});
