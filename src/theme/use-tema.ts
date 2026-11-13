import { useColorScheme } from 'react-native';

import { cores, type Cores } from './tokens';

export function useTema(): { cores: Cores; escuro: boolean } {
  const escuro = useColorScheme() === 'dark';
  return { cores: escuro ? cores.escuro : cores.claro, escuro };
}
