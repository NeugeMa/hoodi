import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { ColarLink } from '@/components/conta/colar-link';
import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, CloudSlash, EnvelopeSimple, Info } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { mensagemDeFalha } from '@/features/api/cliente';
import { registrar } from '@/features/conta/auth-api';
import { lerPreferencia, PREF } from '@/features/preferencias/preferencias-repo';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/**
 * Confira seu e-mail (F01, etapa entre o cadastro e a confirmação).
 * A API não diz se o e-mail já tem conta (resposta sempre igual), então a tela oferece Entrar (F01 CA2).
 */
export default function VerificarEmailScreen() {
  const { cores } = useTema();
  const [email, setEmail] = useState<string | null>(null);
  const [reenvio, setReenvio] = useState<'nada' | 'enviando' | 'enviado'>('nada');
  const [falha, setFalha] = useState<string | null>(null);

  useEffect(() => {
    lerPreferencia(PREF.cadastroEmail).then(setEmail);
  }, []);

  async function reenviar() {
    if (!email) return;
    setFalha(null);
    setReenvio('enviando');
    try {
      await registrar(email);
      setReenvio('enviado');
      AccessibilityInfo.announceForAccessibility('Pedimos um novo link.');
    } catch (e) {
      setReenvio('nada');
      setFalha(mensagemDeFalha(e));
    }
  }

  return (
    <TelaConta
      titulo="Confira seu e-mail"
      carinha="atenta"
      subtitulo="Falta só confirmar: abra neste celular o link que enviamos para o seu e-mail."
      rodape={
        <>
          <Botao
            rotulo={reenvio === 'enviando' ? 'Pedindo' : 'Pedir outro link'}
            variante="secundario"
            onPress={reenviar}
            desabilitado={!email || reenvio === 'enviando'}
          />
          <Botao rotulo="Já tenho conta: entrar" variante="fantasma" onPress={() => router.replace('/entrar')} />
        </>
      }>
      <View style={[styles.cartao, { backgroundColor: cores.papelRebaixado }]}>
        <EnvelopeSimple size={28} color={cores.grafite} weight="bold" />
        <View style={styles.textos}>
          <Texto variante="corpoForte">Enviamos um link para</Texto>
          <Texto>{email ?? 'o seu e-mail'}</Texto>
          <Texto variante="legenda">O link vale por 30 minutos. Olhe também a caixa de spam.</Texto>
        </View>
      </View>

      <Aviso
        icone={Info}
        titulo="Já tem conta com este e-mail?"
        texto="Nesse caso nenhum link é enviado. Entre com seu e-mail e sua senha."
      />

      {reenvio === 'enviado' ? (
        <Aviso icone={CheckCircle} tom="sucesso" titulo="Pedido feito" texto="Se o e-mail puder receber, um novo link chega em instantes." />
      ) : null}
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="O link não foi pedido" texto={falha} /> : null}

      <ColarLink aoContinuar={(token) => router.push({ pathname: '/confirmar', params: { token } })} />
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: espaco[3], padding: espaco[4], borderRadius: raio.md },
  textos: { flex: 1, gap: 2 },
});
