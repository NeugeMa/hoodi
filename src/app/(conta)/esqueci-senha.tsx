import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { ColarLink } from '@/components/conta/colar-link';
import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, EnvelopeSimple } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { solicitarRedefinicao } from '@/features/conta/auth-api';
import { emailValido } from '@/features/conta/tipos';
import { lerPreferencia, PREF } from '@/features/preferencias/preferencias-repo';

/**
 * Esqueci a senha: pede o link hoodi://redefinir-senha#token=... para o e-mail.
 * A resposta é sempre a mesma, exista ou não a conta (a API não revela quem tem conta).
 */
export default function EsqueciSenhaScreen() {
  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [estado, setEstado] = useState<'editando' | 'enviando' | 'enviado'>('editando');

  useEffect(() => {
    lerPreferencia(PREF.ultimoEmail).then((salvo) => {
      if (salvo) setEmail((atual) => atual || salvo);
    });
  }, []);

  async function pedir() {
    setFalha(null);
    if (!emailValido(email)) {
      setErroEmail('Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.');
      return;
    }
    setErroEmail(null);
    setEstado('enviando');
    try {
      await solicitarRedefinicao(email);
      setEstado('enviado');
    } catch (e) {
      setEstado('editando');
      if (ehErroHttp(e, 400)) setErroEmail('Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.');
      else setFalha(mensagemDeFalha(e));
    }
  }

  if (estado === 'enviado') {
    return (
      <TelaConta
        titulo="Confira seu e-mail"
        subtitulo="Abra o link neste celular para escolher uma senha nova."
        rodape={<Botao rotulo="Voltar para entrar" variante="secundario" onPress={() => router.replace('/entrar')} />}>
        <Aviso
          icone={EnvelopeSimple}
          titulo="Link pedido"
          texto={`Se houver uma conta com ${email.trim()}, chega um link em instantes. Ele vale por 30 minutos.`}
        />
        <ColarLink aoContinuar={(token) => router.push({ pathname: '/redefinir-senha', params: { token } })} />
      </TelaConta>
    );
  }

  return (
    <TelaConta
      titulo="Esqueci a senha"
      subtitulo="Mandamos um link para o seu e-mail para você escolher uma senha nova."
      rodape={
        <Botao rotulo={estado === 'enviando' ? 'Enviando' : 'Enviar link'} onPress={pedir} desabilitado={estado === 'enviando'} />
      }>
      <CampoTexto
        rotulo="E-mail"
        tipo="email"
        valor={email}
        aoMudar={(t) => {
          setEmail(t);
          if (erroEmail) setErroEmail(null);
        }}
        erro={erroEmail}
        returnKeyType="send"
        onSubmitEditing={pedir}
      />
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="O link não foi pedido" texto={falha} /> : null}
    </TelaConta>
  );
}
