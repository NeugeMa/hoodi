import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { extrairToken } from '@/features/conta/link-token';
import { espaco } from '@/theme/tokens';

type Props = {
  /** Chamado com o token tirado do link colado. */
  aoContinuar: (token: string) => void;
};

/**
 * Plano B para o link do e-mail: quando o link não abre o app (Expo Go, e-mail lido no computador),
 * a pessoa copia o link e cola aqui.
 */
export function ColarLink({ aoContinuar }: Props) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function continuar() {
    const token = extrairToken(texto);
    if (!token) {
      setErro('Este não parece o link do e-mail. Copie o link inteiro, que começa com hoodi://.');
      return;
    }
    setErro(null);
    aoContinuar(token);
  }

  return (
    <View style={styles.bloco}>
      <CampoTexto
        rotulo="Link do e-mail"
        tipo="link"
        valor={texto}
        aoMudar={(t) => {
          setTexto(t);
          if (erro) setErro(null);
        }}
        erro={erro}
        ajuda="Se o link não abriu o app, copie e cole aqui."
        returnKeyType="go"
        onSubmitEditing={continuar}
      />
      <Botao rotulo="Usar este link" variante="secundario" onPress={continuar} desabilitado={!texto.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espaco[3] },
});
