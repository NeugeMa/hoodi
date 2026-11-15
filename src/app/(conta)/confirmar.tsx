import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, LinkSimple } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { ErroApi, mensagemDeFalha } from '@/features/api/cliente';
import { confirmarEmail } from '@/features/conta/auth-api';
import { useConta } from '@/features/conta/conta-context';
import { NOME_MIN, SENHA_MIN } from '@/features/conta/tipos';
import { useTokenDoLink } from '@/features/conta/use-token-do-link';
import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

/**
 * Confirmar cadastro (F01, etapa 2 de 2): aberta pelo link hoodi://confirmar#token=...
 * A pessoa escolhe como quer ser chamada e a senha. Depois, o app já entra na conta.
 */
export default function ConfirmarScreen() {
  const token = useTokenDoLink('confirmar');
  const { entrar } = useConta();
  const senhaRef = useRef<TextInputInstance>(null);
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  // O link pode chegar um instante depois da tela abrir; por isso "sem token" não é guardado em estado.
  const [recusado, setRecusado] = useState(false);
  const linkInvalido = !token || recusado;
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function concluir() {
    setFalha(null);
    const nomeOk = nome.trim().length >= NOME_MIN;
    const senhaOk = senha.length >= SENHA_MIN;
    setErroNome(nomeOk ? null : `Escreva pelo menos ${NOME_MIN} letras.`);
    setErroSenha(senhaOk ? null : `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`);
    if (!nomeOk || !senhaOk || !token) return;

    setEnviando(true);
    try {
      await confirmarEmail(token, nome, senha);
    } catch (e) {
      setEnviando(false);
      if (e instanceof ErroApi && e.tipo === 'http' && e.status !== 429 && e.status < 500) setRecusado(true);
      else setFalha(mensagemDeFalha(e));
      return;
    }

    // Conta criada. Entra direto com o e-mail do cadastro, se ele estiver neste celular.
    const email = await lerPreferencia(PREF.cadastroEmail);
    if (email) {
      try {
        await entrar(email, senha);
        await salvarPreferencia(PREF.cadastroEmail, '');
        return; // A navegação troca para o app sozinha.
      } catch {
        // Sem internet ou e-mail diferente do link: a conta já existe, então é só entrar.
      }
    }
    setEnviando(false);
    router.replace({ pathname: '/entrar', params: { aviso: 'conta-criada' } });
  }

  if (linkInvalido) {
    return (
      <TelaConta
        titulo="Link expirado"
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

  return (
    <TelaConta
      titulo="Quase lá"
      subtitulo="Escolha como quer ser chamado e a sua senha."
      rodape={
        <Botao rotulo={enviando ? 'Criando conta' : 'Concluir cadastro'} onPress={concluir} desabilitado={enviando} />
      }>
      <CampoTexto
        rotulo="Como quer ser chamado"
        tipo="texto"
        valor={nome}
        aoMudar={(t) => {
          setNome(t);
          if (erroNome) setErroNome(null);
        }}
        erro={erroNome}
        ajuda="Aparece para os seus contatos quando você pede ajuda."
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
        ajuda={`Use pelo menos ${SENHA_MIN} caracteres.`}
        returnKeyType="done"
        onSubmitEditing={concluir}
      />
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="O cadastro não foi concluído" texto={falha} /> : null}
    </TelaConta>
  );
}
