import { useLinkingURL } from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, CloudSlash, LinkSimple, ShieldCheck } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { useConta } from '@/features/conta/conta-context';
import { extrairCodigoConvite } from '@/features/conta/link-token';
import { responderConvite } from '@/features/contatos/contatos-api';
import { useContatos } from '@/features/contatos/contatos-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Resultado =
  | { tipo: 'aceito'; nome: string }
  | { tipo: 'recusado' }
  | { tipo: 'invalido'; texto: string };

/**
 * Convite de contato (F09 CA1, CA2): aberto pelo link hoodi://convite#codigo=... ou colado em Contatos.
 * A API só revela quem convidou depois do aceite, então a tela não mostra o nome antes.
 */
export default function ConviteScreen() {
  const { cores } = useTema();
  const { codigo: parametro } = useLocalSearchParams<{ codigo?: string }>();
  const url = useLinkingURL();
  const codigo =
    extrairCodigoConvite(parametro) ?? (url && /[:/]convite(?=[#?/]|$)/.test(url) ? extrairCodigoConvite(url) : null);
  const { estado } = useConta();
  const { recarregar } = useContatos();
  const [enviando, setEnviando] = useState<'aceitar' | 'rejeitar' | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  async function responder(decisao: 'aceitar' | 'rejeitar') {
    if (!codigo) return;
    setFalha(null);
    setEnviando(decisao);
    try {
      const vinculo = await responderConvite(codigo, decisao);
      await recarregar();
      if (decisao === 'aceitar') {
        const nome = vinculo?.nomeExibicao ?? 'esta pessoa';
        setResultado({ tipo: 'aceito', nome });
        AccessibilityInfo.announceForAccessibility(`Agora você é contato de segurança de ${nome}.`);
      } else {
        setResultado({ tipo: 'recusado' });
      }
    } catch (e) {
      if (ehErroHttp(e, 422)) {
        setResultado({ tipo: 'invalido', texto: 'Este convite foi criado por você. Mande o link para a pessoa que você quer como contato.' });
      } else if (ehErroHttp(e, 409)) {
        setResultado({
          tipo: 'invalido',
          texto: 'O convite expirou, já foi usado ou vocês já estão ligados. Peça um convite novo, se precisar.',
        });
      } else if (ehErroHttp(e, 400)) {
        setResultado({ tipo: 'invalido', texto: 'Este link de convite está incompleto. Peça para a pessoa mandar de novo.' });
      } else {
        setFalha(mensagemDeFalha(e));
      }
    } finally {
      setEnviando(null);
    }
  }

  const voltar = () => router.replace('/contatos');

  // Fica fora das telas protegidas para o link não se perder; sem conta, explica o que fazer.
  if (estado !== 'logado') {
    return (
      <TelaConta
        titulo="Convite de contato"
        voltar={false}
        rodape={<Botao rotulo="Entrar ou criar conta" onPress={() => router.replace('/boas-vindas')} />}>
        <Aviso
          icone={ShieldCheck}
          titulo="Entre no hoodi para responder"
          texto="Para ser contato de segurança, você precisa de uma conta no hoodi. Depois de entrar, abra o link do convite de novo."
        />
      </TelaConta>
    );
  }

  if (!codigo || resultado?.tipo === 'invalido') {
    return (
      <TelaConta titulo="Convite" rodape={<Botao rotulo="Ver meus contatos" onPress={voltar} />}>
        <Aviso
          icone={LinkSimple}
          tom="atencao"
          titulo="Este convite não vale"
          texto={resultado?.tipo === 'invalido' ? resultado.texto : 'O link está incompleto. Peça para a pessoa mandar de novo.'}
        />
      </TelaConta>
    );
  }

  if (resultado) {
    return (
      <TelaConta titulo="Convite" rodape={<Botao rotulo="Ver meus contatos" onPress={voltar} />}>
        {resultado.tipo === 'aceito' ? (
          <Aviso
            icone={CheckCircle}
            tom="sucesso"
            titulo={`Você é contato de ${resultado.nome}`}
            texto="Se essa pessoa apertar Pedir ajuda, você recebe um aviso do hoodi. Você pode sair quando quiser, em Contatos."
          />
        ) : (
          <Aviso icone={CheckCircle} titulo="Convite recusado" texto="Você não vai receber os pedidos de ajuda desta pessoa." />
        )}
      </TelaConta>
    );
  }

  return (
    <TelaConta
      titulo="Convite de contato"
      subtitulo="Alguém de confiança quer você como contato de segurança no hoodi."
      rodape={
        <>
          <Botao rotulo={enviando === 'aceitar' ? 'Aceitando' : 'Aceitar'} onPress={() => responder('aceitar')} desabilitado={!!enviando} />
          <Botao rotulo={enviando === 'rejeitar' ? 'Recusando' : 'Recusar'} variante="fantasma" onPress={() => responder('rejeitar')} desabilitado={!!enviando} />
        </>
      }>
      <View style={[styles.cartao, { backgroundColor: cores.papelRebaixado }]}>
        <ShieldCheck size={24} color={cores.grafite} weight="bold" />
        <View style={styles.textos}>
          <Texto variante="corpoForte">O que muda se você aceitar</Texto>
          <Texto variante="legenda" cor="grafite">
            Quando essa pessoa apertar Pedir ajuda, você recebe um aviso. Ao abrir, vê o nome dela, a hora e onde ela
            está, mais ou menos.
          </Texto>
          <Texto variante="legenda" cor="grafite">
            Ela não vê sua localização. Você pode deixar de ser contato quando quiser.
          </Texto>
        </View>
      </View>
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="A resposta não foi enviada" texto={falha} /> : null}
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: espaco[3], padding: espaco[4], borderRadius: raio.md },
  textos: { flex: 1, gap: espaco[2] },
});
