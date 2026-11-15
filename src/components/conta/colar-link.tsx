import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { extrairToken } from '@/features/conta/link-token';
import { espaco } from '@/theme/tokens';

type Props = {
  /** Chamado com o valor tirado do link colado. */
  aoContinuar: (valor: string) => void;
  /** Como tirar o valor do link. Padrão: token dos links do e-mail. */
  extrair?: (texto: string) => string | null;
  rotulo?: string;
  ajuda?: string;
  erro?: string;
  rotuloBotao?: string;
};

/**
 * Plano B para os links do hoodi (e-mail e convite): quando o link não abre o app
 * (Expo Go, link lido no computador), a pessoa copia o link e cola aqui.
 */
export function ColarLink({
  aoContinuar,
  extrair = extrairToken,
  rotulo = 'Link do e-mail',
  ajuda = 'Se o link não abriu o app, copie e cole aqui.',
  erro: textoErro = 'Este não parece o link do e-mail. Copie o link inteiro, que começa com hoodi://.',
  rotuloBotao = 'Usar este link',
}: Props) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function continuar() {
    const valor = extrair(texto);
    if (!valor) {
      setErro(textoErro);
      return;
    }
    setErro(null);
    setTexto('');
    aoContinuar(valor);
  }

  return (
    <View style={styles.bloco}>
      <CampoTexto
        rotulo={rotulo}
        tipo="link"
        valor={texto}
        aoMudar={(t) => {
          setTexto(t);
          if (erro) setErro(null);
        }}
        erro={erro}
        ajuda={ajuda}
        returnKeyType="go"
        onSubmitEditing={continuar}
      />
      <Botao rotulo={rotuloBotao} variante="secundario" onPress={continuar} desabilitado={!texto.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espaco[3] },
});
