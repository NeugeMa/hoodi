import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, CloudSlash } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { useConta } from '@/features/conta/conta-context';
import { emailValido } from '@/features/conta/tipos';
import { lerPreferencia, PREF } from '@/features/preferencias/preferencias-repo';

const AVISOS: Record<string, { titulo: string; texto: string }> = {
  'conta-criada': { titulo: 'Conta criada', texto: 'Agora entre com seu e-mail e a senha que você escolheu.' },
  'senha-redefinida': { titulo: 'Senha nova salva', texto: 'Entre com seu e-mail e a senha nova.' },
};

/**
 * Entrar (F01 CA3, CA4, CA7 · TC03): e-mail e senha.
 * Erro em texto, sem dizer se o problema é o e-mail ou a senha (a API também não diz).
 */
export default function EntrarScreen() {
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const { entrar } = useConta();
  const senhaRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Preenche com o último e-mail usado neste celular (ou o do cadastro).
  useEffect(() => {
    (async () => {
      const salvo = (await lerPreferencia(PREF.cadastroEmail)) || (await lerPreferencia(PREF.ultimoEmail));
      if (salvo) setEmail((atual) => atual || salvo);
    })();
  }, []);

  async function enviar() {
    setFalha(null);
    const emailOk = emailValido(email);
    setErroEmail(emailOk ? null : 'Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.');
    setErroSenha(senha ? null : 'Escreva sua senha.');
    if (!emailOk || !senha) return;

    setEnviando(true);
    try {
      await entrar(email, senha);
      // A navegação troca para o app sozinha.
    } catch (e) {
      setEnviando(false);
      if (ehErroHttp(e, 401) || ehErroHttp(e, 400)) setErroSenha('E-mail ou senha incorretos. Confira e tente de novo.');
      else setFalha(mensagemDeFalha(e));
    }
  }

  const avisoInicial = aviso ? AVISOS[aviso] : undefined;

  return (
    <TelaConta
      titulo="Entrar"
      rodape={
        <>
          <Botao rotulo={enviando ? 'Entrando' : 'Entrar'} onPress={enviar} desabilitado={enviando} />
          <Botao rotulo="Esqueci a senha" variante="fantasma" onPress={() => router.push('/esqueci-senha')} />
          <Botao rotulo="Criar conta" variante="fantasma" onPress={() => router.replace('/criar-conta')} />
        </>
      }>
      {avisoInicial ? <Aviso icone={CheckCircle} tom="sucesso" {...avisoInicial} /> : null}
      <CampoTexto
        rotulo="E-mail"
        tipo="email"
        valor={email}
        aoMudar={(t) => {
          setEmail(t);
          if (erroEmail) setErroEmail(null);
        }}
        erro={erroEmail}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => senhaRef.current?.focus()}
      />
      <CampoTexto
        ref={senhaRef}
        rotulo="Senha"
        tipo="senha"
        valor={senha}
        aoMudar={(t) => {
          setSenha(t);
          if (erroSenha) setErroSenha(null);
        }}
        erro={erroSenha}
        returnKeyType="go"
        onSubmitEditing={enviar}
      />
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="Não deu para entrar" texto={falha} /> : null}
    </TelaConta>
  );
}
