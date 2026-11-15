import { router } from 'expo-router';
import { useState } from 'react';

import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, LinkSimple } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { ErroApi, mensagemDeFalha } from '@/features/api/cliente';
import { redefinirSenha } from '@/features/conta/auth-api';
import { SENHA_MIN } from '@/features/conta/tipos';
import { useTokenDoLink } from '@/features/conta/use-token-do-link';

/** Senha nova: aberta pelo link hoodi://redefinir-senha#token=... do e-mail. */
export default function RedefinirSenhaScreen() {
  const token = useTokenDoLink('redefinir-senha');
  const [senha, setSenha] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [recusado, setRecusado] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setFalha(null);
    if (senha.length < SENHA_MIN) {
      setErroSenha(`A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`);
      return;
    }
    if (!token) return;
    setEnviando(true);
    try {
      await redefinirSenha(token, senha);
      router.replace({ pathname: '/entrar', params: { aviso: 'senha-redefinida' } });
    } catch (e) {
      setEnviando(false);
      if (e instanceof ErroApi && e.tipo === 'http' && e.status !== 429 && e.status < 500) setRecusado(true);
      else setFalha(mensagemDeFalha(e));
    }
  }

  if (!token || recusado) {
    return (
      <TelaConta
        titulo="Link expirado"
        rodape={<Botao rotulo="Pedir outro link" onPress={() => router.replace('/esqueci-senha')} />}>
        <Aviso
          icone={LinkSimple}
          tom="atencao"
          titulo="Este link não vale mais"
          texto="O link do e-mail vale por 30 minutos e só pode ser usado uma vez. Peça outro."
        />
      </TelaConta>
    );
  }

  return (
    <TelaConta
      titulo="Senha nova"
      subtitulo="Depois de salvar, entre de novo com a senha nova."
      rodape={<Botao rotulo={enviando ? 'Salvando' : 'Salvar senha'} onPress={salvar} desabilitado={enviando} />}>
      <CampoTexto
        rotulo="Senha nova"
        tipo="senha"
        valor={senha}
        aoMudar={(t) => {
          setSenha(t);
          if (erroSenha) setErroSenha(null);
        }}
        erro={erroSenha}
        ajuda={`Use pelo menos ${SENHA_MIN} caracteres.`}
        returnKeyType="done"
        onSubmitEditing={salvar}
      />
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="A senha não foi salva" texto={falha} /> : null}
    </TelaConta>
  );
}
