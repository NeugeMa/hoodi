import { router } from 'expo-router';
import { useState } from 'react';
import {AccessibilityInfo, StyleSheet, View} from 'react-native';

import { ConfirmarSenha } from '@/components/conta/confirmar-senha';
import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, CloudSlash, Database, ShieldCheck, Trash, WarningCircle } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { perguntar } from '@/components/ui/perguntar';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { useConta } from '@/features/conta/conta-context';
import { usePreferencias } from '@/features/preferencias/preferencias-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** O que fica no aparelho e o que sai (F08 CA3 · RNF11). */
const NO_APARELHO = [
  'Sua posição, seus trajetos e o histórico de alertas ficam só neste celular.',
  'Quando você aperta Pedir ajuda, seus contatos confirmados recebem seu nome, a hora e a posição aproximada.',
  'Quando você compara rotas, a origem e o destino passam pelo servidor do Hoodi até o serviço de mapas HeiGIT, que traça os caminhos a pé. O servidor do Hoodi não guarda o trajeto.',
  'Ao digitar o destino, o texto vai ao servidor do Hoodi e ao serviço de busca de endereços para sugerir lugares. Ao pedir lugares perto de você, a posição vai junto, arredondada. Nada disso fica guardado.',
  'Para achar endereços e nomes de rua, o celular usa o serviço de endereços do próprio sistema (Google ou Apple), com o endereço digitado ou com o centro da área do mapa, não com a sua posição exata.',
  'No servidor do Hoodi ficam só a sua conta (nome e e-mail) e os seus contatos de segurança.',
  'O risco vem de registros públicos da SSP-SP. É o melhor dado disponível no período e não garante segurança.',
];

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Dados e privacidade (F08 CA3, CA4, CA5 · TC32, TC38, TC39):
 * o que fica no aparelho, revogar ou dar o consentimento e excluir a conta.
 */
export default function PrivacidadeScreen() {
  const { cores } = useTema();
  const { estado, excluirConta } = useConta();
  const { consentimentoEm, revogarConsentimento, darConsentimento } = usePreferencias();
  const [excluindo, setExcluindo] = useState(false);
  const [falhaExclusao, setFalhaExclusao] = useState<string | null>(null);
  const [pedindoSenha, setPedindoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const logado = estado === 'logado';

  function confirmarRevogar() {
    perguntar(
      'Revogar o consentimento?',
      'Os alertas no celular, no relógio e no Hoodi Pet param, e você não consegue iniciar trajetos até dar o consentimento de novo. O mapa continua funcionando.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            await revogarConsentimento();
            AccessibilityInfo.announceForAccessibility('Consentimento revogado. Os alertas estão desligados.');
          },
        },
      ],
    );
  }

  async function dar() {
    await darConsentimento();
    AccessibilityInfo.announceForAccessibility('Consentimento dado. Os alertas estão ligados.');
  }

  async function excluir(senha: string) {
    setErroSenha(null);
    setFalhaExclusao(null);
    setExcluindo(true);
    try {
      await excluirConta(senha);
      setPedindoSenha(false);
      AccessibilityInfo.announceForAccessibility('Conta excluída.');
      router.replace('/');
    } catch (e) {
      setExcluindo(false);
      if (ehErroHttp(e, 403)) {
        // SENHA_INVALIDA: o servidor conferiu e não apagou nada.
        setErroSenha('Senha incorreta. Nada foi apagado.');
      } else if (ehErroHttp(e, 404) || ehErroHttp(e, 405) || ehErroHttp(e, 501)) {
        setPedindoSenha(false);
        setFalhaExclusao('A exclusão da conta ainda não está disponível neste servidor do Hoodi. Nada foi apagado.');
      } else {
        setPedindoSenha(false);
        setFalhaExclusao(`${mensagemDeFalha(e)} Nada foi apagado.`);
      }
    }
  }

  return (
    <TelaConta titulo="Dados e privacidade" subtitulo="O que o Hoodi guarda e onde.">
      <View style={[styles.cartao, { backgroundColor: cores.papelRebaixado }]}>
        <View style={styles.tituloCartao}>
          <Database size={22} color={cores.grafite} weight="bold" />
          <Texto variante="subtitulo">Seus dados</Texto>
        </View>
        {NO_APARELHO.map((frase) => (
          <Texto key={frase} variante="legenda" cor="grafite">
            {frase}
          </Texto>
        ))}
      </View>

      <View style={styles.secao}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Consentimento
        </Texto>
        {consentimentoEm ? (
          <>
            <Aviso
              icone={CheckCircle}
              tom="sucesso"
              titulo="Consentimento dado"
              texto={`Desde ${dataCurta(consentimentoEm)}. Os alertas estão ligados.`}
            />
            <Botao rotulo="Revogar consentimento" variante="secundario" icone={ShieldCheck} onPress={confirmarRevogar} />
          </>
        ) : (
          <>
            <Aviso
              icone={WarningCircle}
              tom="atencao"
              titulo="Alertas desligados"
              texto="Sem o consentimento, o Hoodi não avisa no celular, no relógio nem no Pet, e não inicia trajetos. Para voltar, dê o consentimento abaixo."
            />
            <Botao rotulo="Dar consentimento" icone={ShieldCheck} onPress={dar} />
          </>
        )}
      </View>

      {logado ? (
        <View style={styles.secao}>
          <Texto variante="subtitulo" accessibilityRole="header">
            Conta
          </Texto>
          <Texto variante="legenda">Apaga sua conta e seus contatos de segurança do servidor do Hoodi.</Texto>
          {falhaExclusao ? (
            <Aviso icone={CloudSlash} tom="atencao" titulo="A conta não foi excluída" texto={falhaExclusao} />
          ) : null}
          <Botao
            rotulo={excluindo ? 'Excluindo' : 'Excluir conta'}
            variante="secundario"
            icone={Trash}
            onPress={() => {
              setErroSenha(null);
              setPedindoSenha(true);
            }}
            desabilitado={excluindo}
          />
        </View>
      ) : null}

      {/* Excluir a conta pede a senha (contrato v0.6): a confirmação já é a própria senha. */}
      <ConfirmarSenha
        visivel={pedindoSenha}
        titulo="Excluir a conta?"
        texto="Sua conta, seus contatos de segurança e seus convites são apagados do servidor. Isso não pode ser desfeito. O histórico neste celular continua até você apagar. Para confirmar, escreva sua senha."
        rotuloConfirmar="Excluir conta"
        erro={erroSenha}
        enviando={excluindo}
        aoConfirmar={excluir}
        aoFechar={() => setPedindoSenha(false)}
      />
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  cartao: { borderRadius: raio.md, padding: espaco[4], gap: espaco[3] },
  tituloCartao: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  secao: { gap: espaco[3] },
});
