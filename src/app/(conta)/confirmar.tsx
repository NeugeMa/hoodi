import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, type TextInputInstance } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, LinkSimple, Lock, User } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { Texto } from '@/components/ui/texto';
import { ErroApi, mensagemDeFalha } from '@/features/api/cliente';
import { confirmarEmail } from '@/features/conta/auth-api';
import { cadastroGuardado, esquecerCadastro } from '@/features/conta/cadastro-pendente';
import { carinhaDaConta } from '@/features/conta/carinha-conta';
import { useConta } from '@/features/conta/conta-context';
import { NOME_MIN, SENHA_MIN } from '@/features/conta/tipos';
import { useTokenDoLink } from '@/features/conta/use-token-do-link';
import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

type Resultado = 'link-invalido' | { falha: string } | null;

function linkRecusado(e: unknown) {
  return e instanceof ErroApi && e.tipo === 'http' && e.status !== 429 && e.status < 500;
}

/** Cria a conta com o token do link e já entra. Devolve o que deu errado, ou null se entrou. */
async function concluirCadastro(
  token: string,
  nome: string,
  senha: string,
  entrar: (email: string, senha: string) => Promise<void>,
): Promise<Resultado> {
  try {
    await confirmarEmail(token, nome, senha);
  } catch (e) {
    return linkRecusado(e) ? 'link-invalido' : { falha: mensagemDeFalha(e) };
  }
  esquecerCadastro();
  await salvarPreferencia(PREF.cadastroNome, '');
  const email = (await lerPreferencia(PREF.cadastroEmail)) || cadastroGuardado()?.email;
  if (email) {
    try {
      await entrar(email, senha);
      await salvarPreferencia(PREF.cadastroEmail, '');
      return null; // A navegação troca para o app sozinha.
    } catch {
      // Sem internet ou e-mail diferente do link: a conta já existe, então é só entrar.
    }
  }
  router.replace({ pathname: '/entrar', params: { aviso: 'conta-criada' } });
  return null;
}

/**
 * Confirmar cadastro (F01): aberta pelo link hoodi://confirmar#token=...
 * Se o cadastro foi feito agora neste app, a conta é criada sozinha com o nome e a senha do Criar conta.
 * Se o app foi fechado no meio (a senha não fica guardada), pede a senha de novo.
 */
export default function ConfirmarScreen() {
  const token = useTokenDoLink('confirmar');
  const { entrar } = useConta();
  const senhaRef = useRef<TextInputInstance>(null);
  const guardado = cadastroGuardado();
  const [nome, setNome] = useState(guardado?.nome ?? '');
  // Se a confirmação automática falhar (ex.: sem internet), a senha do Criar conta já vem preenchida.
  const [senha, setSenha] = useState(guardado?.senha ?? '');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [enviando, setEnviando] = useState(false);
  const [focoSenha, setFocoSenha] = useState(false);
  // Confirmação automática em andamento (cadastro feito agora, com o token do link).
  const [automatico, setAutomatico] = useState(!!guardado);

  // Cadastro feito agora: confirma sozinho assim que o token chega (uma vez só: o link vale uma vez).
  const tentouToken = useRef<string | null>(null);
  const entrarRef = useRef(entrar);
  useEffect(() => {
    entrarRef.current = entrar;
  });
  useEffect(() => {
    const dados = cadastroGuardado();
    if (!token || !dados || tentouToken.current === token) return;
    tentouToken.current = token;
    concluirCadastro(token, dados.nome, dados.senha, (e, s) => entrarRef.current(e, s)).then((r) => {
      setResultado(r);
      setAutomatico(false);
    });
  }, [token]);

  // App fechado no meio: o nome volta do aparelho.
  useEffect(() => {
    if (guardado) return;
    lerPreferencia(PREF.cadastroNome).then((salvo) => {
      if (salvo) setNome((atual) => atual || salvo);
    });
  }, [guardado]);

  async function concluir() {
    const nomeOk = nome.trim().length >= NOME_MIN;
    const senhaOk = senha.length >= SENHA_MIN;
    setErroNome(nomeOk ? null : `Escreva pelo menos ${NOME_MIN} letras.`);
    setErroSenha(senhaOk ? null : `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`);
    if (!nomeOk || !senhaOk || !token) return;
    setEnviando(true);
    setResultado(await concluirCadastro(token, nome, senha, entrar));
    setEnviando(false);
  }

  if (!token || resultado === 'link-invalido') {
    return (
      <TelaConta
        titulo="Link expirado"
        carinha="confusa"
        rodape={<Botao rotulo="Pedir outro link" onPress={() => router.replace('/criar-conta')} />}>
        <Aviso
          icone={LinkSimple}
          tom="atencao"
          titulo="Este link não vale mais"
          texto="O link do e-mail vale por 30 minutos e só pode ser usado uma vez. Peça outro com o mesmo e-mail."
        />
      </TelaConta>
    );
  }

  if (automatico) {
    return (
      <TelaConta titulo="Criando sua conta" voltar={false} carinha="procurando">
        <Texto variante="legenda" style={estilos.centro}>
          Só um instante. Depois você já entra no Hoodi.
        </Texto>
      </TelaConta>
    );
  }

  const falha = resultado ? resultado.falha : null;
  const carinha = carinhaDaConta({ enviando, erro: !!(erroNome || erroSenha || falha), campo: focoSenha ? 'senha' : null });

  return (
    <TelaConta
      titulo="Quase lá"
      subtitulo="Confirme seu nome e escreva a senha que você escolheu."
      carinha={carinha}
      rodape={
        <Botao rotulo={enviando ? 'Criando conta' : 'Concluir cadastro'} onPress={concluir} desabilitado={enviando} />
      }>
      <CampoTexto
        rotulo="Como quer ser chamado"
        tipo="texto"
        icone={User}
        valor={nome}
        aoMudar={(t) => {
          setNome(t);
          if (erroNome) setErroNome(null);
        }}
        erro={erroNome}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => senhaRef.current?.focus()}
      />
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
        aoFocar={() => setFocoSenha(true)}
        aoSair={() => setFocoSenha(false)}
        erro={erroSenha}
        ajuda={`Use pelo menos ${SENHA_MIN} caracteres.`}
        returnKeyType="done"
        onSubmitEditing={concluir}
      />
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="O cadastro não foi concluído" texto={falha} /> : null}
    </TelaConta>
  );
}

const estilos = StyleSheet.create({ centro: { textAlign: 'center' } });
