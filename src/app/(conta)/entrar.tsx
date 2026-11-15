import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, CloudSlash, EnvelopeSimple, Lock } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { LinkTexto } from '@/components/ui/link-texto';
import { Texto } from '@/components/ui/texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { useConta } from '@/features/conta/conta-context';
import { emailValido } from '@/features/conta/tipos';
import type { Carinha } from '@/features/pet/carinhas';
import { lerPreferencia, PREF } from '@/features/preferencias/preferencias-repo';
import { espaco } from '@/theme/tokens';

const AVISOS: Record<string, { titulo: string; texto: string }> = {
  'conta-criada': { titulo: 'Conta criada', texto: 'Agora entre com seu e-mail e a senha que você escolheu.' },
  'senha-redefinida': { titulo: 'Senha nova salva', texto: 'Entre com seu e-mail e a senha nova.' },
};

/**
 * Entrar (F01 CA3, CA4, CA7 · TC03), a primeira tela de quem não tem conta neste celular.
 * O hoodi Pet no topo acompanha: olha o e-mail, fecha os olhos na senha e fica confuso no erro.
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
  const [foco, setFoco] = useState<'email' | 'senha' | null>(null);
  const [mostrandoSenha, setMostrandoSenha] = useState(false);

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

  // O Pet reage ao que acontece na tela.
  const carinha: Carinha = enviando
    ? 'procurando'
    : erroEmail || erroSenha || falha
      ? 'confusa'
      : foco === 'senha' && !mostrandoSenha
        ? 'timida'
        : foco
          ? 'atenta'
          : 'tranquila';

  const avisoInicial = aviso ? AVISOS[aviso] : undefined;

  return (
    <TelaConta
      titulo="Entrar"
      subtitulo="Alerta de risco sem tirar o celular do bolso."
      voltar={false}
      carinha={carinha}
      rodape={
        <>
          <Botao rotulo={enviando ? 'Entrando' : 'Entrar'} onPress={enviar} desabilitado={enviando} />
          <View style={styles.criar}>
            <Texto variante="legenda">Ainda não tem conta?</Texto>
            <LinkTexto rotulo="Criar conta" onPress={() => router.push('/criar-conta')} />
          </View>
        </>
      }>
      {avisoInicial ? <Aviso icone={CheckCircle} tom="sucesso" {...avisoInicial} /> : null}
      <CampoTexto
        rotulo="E-mail"
        tipo="email"
        icone={EnvelopeSimple}
        valor={email}
        aoMudar={(t) => {
          setEmail(t);
          if (erroEmail) setErroEmail(null);
        }}
        aoFocar={() => setFoco('email')}
        aoSair={() => setFoco((f) => (f === 'email' ? null : f))}
        erro={erroEmail}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => senhaRef.current?.focus()}
      />
      <View>
        <CampoTexto
          ref={senhaRef}
          rotulo="Senha"
          tipo="senha"
          icone={Lock}
          valor={senha}
          aoMudar={(t) => {
            setSenha(t);
            if (erroSenha) setErroSenha(null);
          }}
          aoFocar={() => setFoco('senha')}
          aoSair={() => setFoco((f) => (f === 'senha' ? null : f))}
          aoMostrarSenha={setMostrandoSenha}
          erro={erroSenha}
          returnKeyType="go"
          onSubmitEditing={enviar}
        />
        <LinkTexto rotulo="Esqueci a senha" alinhar="fim" onPress={() => router.push('/esqueci-senha')} />
      </View>
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="Não deu para entrar" texto={falha} /> : null}
      <Texto variante="legenda" style={styles.centro}>
        O risco vem de registros da SSP-SP. É o melhor dado disponível no período e não garante segurança.
      </Texto>
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  criar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco[1] },
  centro: { textAlign: 'center' },
});
