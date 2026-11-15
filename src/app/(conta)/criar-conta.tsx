import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, ShieldCheck } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CaixaSelecao } from '@/components/ui/caixa-selecao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { Texto } from '@/components/ui/texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { registrar } from '@/features/conta/auth-api';
import { emailValido } from '@/features/conta/tipos';
import { PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Texto do consentimento (F01 CA5): linguagem simples, o que fica no aparelho e o que sai. */
const CONSENTIMENTO = [
  'Sua localização é avaliada só neste celular. O hoodi não envia sua posição para ninguém.',
  'Seu trajeto e o histórico de alertas também ficam só no aparelho.',
  'Nada sai do celular sem você apertar Pedir ajuda. Aí seus contatos confirmados recebem seu nome, a hora e o endereço aproximado.',
  'O risco vem de registros públicos da SSP-SP. Você pode revogar este consentimento e excluir a conta no Perfil.',
];

/**
 * Criar conta (F01 CA1, CA5, CA6, CA7), etapa 1 de 2: e-mail, 18 anos ou mais e consentimento.
 * A API manda um link para o e-mail; o nome e a senha entram na etapa 2 (Confirmar).
 */
export default function CriarContaScreen() {
  const { cores } = useTema();
  const [email, setEmail] = useState('');
  // As duas caixas começam desmarcadas (design system v3).
  const [maior, setMaior] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const pode = maior && aceite && email.trim().length > 0;
  const falta = !maior && !aceite
    ? 'Para criar a conta, confirme que tem 18 anos ou mais e aceite o consentimento.'
    : !maior
      ? 'Para criar a conta, é preciso ter 18 anos ou mais.'
      : !aceite
        ? 'Para criar a conta, é preciso aceitar o consentimento.'
        : null;

  async function criar() {
    setFalha(null);
    if (!emailValido(email)) {
      setErroEmail('Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.');
      return;
    }
    setErroEmail(null);
    setEnviando(true);
    try {
      await registrar(email);
      const agora = new Date().toISOString();
      await salvarPreferencia(PREF.cadastroEmail, email.trim());
      await salvarPreferencia(PREF.maioridadeConfirmadaEm, agora);
      await salvarPreferencia(PREF.consentimentoEm, agora);
      router.replace('/verificar-email');
    } catch (e) {
      if (ehErroHttp(e, 400)) setErroEmail('Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.');
      else setFalha(mensagemDeFalha(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaConta
      titulo="Criar conta"
      subtitulo="Etapa 1 de 2. Depois você recebe um link no e-mail para escolher a senha."
      rodape={
        <>
          <Botao
            rotulo={enviando ? 'Enviando' : 'Criar conta'}
            onPress={criar}
            desabilitado={!pode || enviando}
            dica={falta ?? 'Envia um link para o seu e-mail'}
          />
          {falta ? (
            <Texto variante="legenda" style={styles.centro} accessible={false}>
              {falta}
            </Texto>
          ) : null}
        </>
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
        returnKeyType="done"
      />

      <CaixaSelecao marcada={maior} aoMudar={setMaior} rotulo="Tenho 18 anos ou mais" />

      <View style={[styles.consentimento, { backgroundColor: cores.papelRebaixado }]}>
        <View style={styles.tituloConsentimento}>
          <ShieldCheck size={22} color={cores.grafite} weight="bold" />
          <Texto variante="subtitulo">Seus dados no hoodi</Texto>
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
});
