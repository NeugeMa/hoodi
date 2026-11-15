import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, EnvelopeSimple, Lock, ShieldCheck, User } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CaixaSelecao } from '@/components/ui/caixa-selecao';
import { CampoData } from '@/components/ui/campo-data';
import { CampoTexto } from '@/components/ui/campo-texto';
import { LinkTexto } from '@/components/ui/link-texto';
import { Texto } from '@/components/ui/texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { registrar } from '@/features/conta/auth-api';
import { guardarCadastro, IDADE_MINIMA, idadeEm } from '@/features/conta/cadastro-pendente';
import { carinhaDaConta } from '@/features/conta/carinha-conta';
import { emailValido, NOME_MIN, SENHA_MIN } from '@/features/conta/tipos';
import { PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Texto do consentimento (F01 CA5): linguagem simples, o que fica no aparelho e o que sai. */
const CONSENTIMENTO = [
  'Sua localização é avaliada só neste celular. O Hoodi não envia sua posição para ninguém.',
  'Seu trajeto e o histórico de alertas também ficam só no aparelho.',
  'Nada sai do celular sem você apertar Pedir ajuda. Aí seus contatos confirmados recebem seu nome, a hora e o endereço aproximado.',
  'O risco vem de registros públicos da SSP-SP. Você pode revogar este consentimento e excluir a conta no Perfil.',
];

const ERRO_EMAIL = 'Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.';

const hoje = new Date();
/** O calendário abre em 20 anos atrás (público do hoodi: 18 a 30 anos). */
const DATA_INICIAL = new Date(hoje.getFullYear() - 20, hoje.getMonth(), hoje.getDate());
const DATA_MINIMA = new Date(1900, 0, 1);

type Campo = 'nome' | 'email' | 'senha' | null;

/**
 * Criar conta (F01 CA1, CA5, CA6, CA7): nome, data de nascimento, e-mail, senha e consentimento.
 * A idade vem da data de nascimento: menos de 18 anos não avança (CA6). A data não é guardada.
 * A API manda um link para o e-mail; ao abrir o link, a conta é criada com o nome e a senha daqui.
 */
export default function CriarContaScreen() {
  const { cores } = useTema();
  const emailRef = useRef<TextInputInstance>(null);
  const senhaRef = useRef<TextInputInstance>(null);
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  // O consentimento começa desmarcado (design system v3).
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<Partial<Record<'nome' | 'nascimento' | 'email' | 'senha', string>>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [foco, setFoco] = useState<Campo>(null);
  const [mostrandoSenha, setMostrandoSenha] = useState(false);

  function limparErro(campo: keyof typeof erros) {
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function validar() {
    const novos: typeof erros = {};
    if (nome.trim().length < NOME_MIN) novos.nome = `Escreva pelo menos ${NOME_MIN} letras.`;
    if (!nascimento) novos.nascimento = 'Escolha sua data de nascimento.';
    else if (idadeEm(nascimento) < IDADE_MINIMA)
      novos.nascimento = `O Hoodi é para quem tem ${IDADE_MINIMA} anos ou mais. Por isso, não dá para criar a conta.`;
    if (!emailValido(email)) novos.email = ERRO_EMAIL;
    if (senha.length < SENHA_MIN) novos.senha = `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function criar() {
    setFalha(null);
    if (!validar() || !aceite) return;
    setEnviando(true);
    try {
      await registrar(email);
      // Senha só na memória até o link do e-mail ser aberto; nome e e-mail podem ficar no aparelho.
      guardarCadastro({ email, nome, senha });
      const agora = new Date().toISOString();
      await salvarPreferencia(PREF.cadastroEmail, email.trim());
      await salvarPreferencia(PREF.cadastroNome, nome.trim());
      await salvarPreferencia(PREF.maioridadeConfirmadaEm, agora);
      await salvarPreferencia(PREF.consentimentoEm, agora);
      router.replace('/verificar-email');
    } catch (e) {
      if (ehErroHttp(e, 400)) setErros((x) => ({ ...x, email: ERRO_EMAIL }));
      else setFalha(mensagemDeFalha(e));
    } finally {
      setEnviando(false);
    }
  }

  const temErro = Object.values(erros).some(Boolean) || !!falha;
  // Mesma carinha e mesmas reações do Entrar.
  const carinha = carinhaDaConta({ enviando, erro: temErro, campo: foco, mostrandoSenha });

  return (
    <TelaConta
      titulo="Criar conta"
      subtitulo="Alerta de risco sem tirar o celular do bolso."
      ocultarTitulo
      carinha={carinha}
      rodape={
        <>
          <Botao
            rotulo={enviando ? 'Criando conta' : 'Criar conta'}
            onPress={criar}
            desabilitado={!aceite || enviando}
            dica={aceite ? 'Envia um link para o seu e-mail' : 'Para criar a conta, aceite o consentimento'}
          />
          {!aceite ? (
            <Texto variante="legenda" style={styles.centro} accessible={false}>
              Para criar a conta, aceite o consentimento.
            </Texto>
          ) : null}
          <View style={styles.entrar}>
            <Texto variante="legenda">Já tem conta?</Texto>
            <LinkTexto rotulo="Entrar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/entrar'))} />
          </View>
        </>
      }>
      <CampoTexto
        rotulo="Como quer ser chamado"
        tipo="texto"
        icone={User}
        valor={nome}
        aoMudar={(t) => {
          setNome(t);
          limparErro('nome');
        }}
        aoFocar={() => setFoco('nome')}
        aoSair={() => setFoco((f) => (f === 'nome' ? null : f))}
        erro={erros.nome}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <CampoData
        rotulo="Data de nascimento"
        valor={nascimento}
        aoMudar={(d) => {
          setNascimento(d);
          limparErro('nascimento');
        }}
        aoAbrir={() => setFoco(null)}
        erro={erros.nascimento}
        inicial={DATA_INICIAL}
        maxima={hoje}
        minima={DATA_MINIMA}
      />
      <CampoTexto
        ref={emailRef}
        rotulo="E-mail"
        tipo="email"
        icone={EnvelopeSimple}
        valor={email}
        aoMudar={(t) => {
          setEmail(t);
          limparErro('email');
        }}
        aoFocar={() => setFoco('email')}
        aoSair={() => setFoco((f) => (f === 'email' ? null : f))}
        erro={erros.email}
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
          limparErro('senha');
        }}
        aoFocar={() => setFoco('senha')}
        aoSair={() => setFoco((f) => (f === 'senha' ? null : f))}
        aoMostrarSenha={setMostrandoSenha}
        erro={erros.senha}
        returnKeyType="done"
      />

      <View style={[styles.consentimento, { backgroundColor: cores.papelRebaixado }]}>
        <View style={styles.tituloConsentimento}>
          <ShieldCheck size={22} color={cores.grafite} weight="bold" />
          <Texto variante="subtitulo">Seus dados no Hoodi</Texto>
        </View>
        {CONSENTIMENTO.map((frase) => (
          <Texto key={frase} variante="legenda" cor="grafite">
            {frase}
          </Texto>
        ))}
        <CaixaSelecao marcada={aceite} aoMudar={setAceite} rotulo="Li e aceito o consentimento" />
      </View>

      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="A conta não foi criada" texto={falha} /> : null}
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  consentimento: { borderRadius: raio.md, padding: espaco[4], gap: espaco[3] },
  tituloConsentimento: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  centro: { textAlign: 'center' },
  entrar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco[1] },
});
