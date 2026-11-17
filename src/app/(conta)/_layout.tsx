import { Stack } from 'expo-router';

/** Telas de conta (F01): Entrar (a primeira), Criar conta, Confirmar e Esqueci a senha. */
export const unstable_settings = { initialRouteName: 'entrar' };

export default function ContaLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
