import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Alert, StyleSheet, View } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, CloudSlash, Database, ShieldCheck, Trash, WarningCircle } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { useConta } from '@/features/conta/conta-context';
import { usePreferencias } from '@/features/preferencias/preferencias-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** O que fica no aparelho e o que sai (F08 CA3 · RNF11). */
const NO_APARELHO = [
  'Sua posição, seus trajetos e o histórico de alertas ficam só neste celular.',
  'Nada disso sai do aparelho, a não ser quando você aperta Pedir ajuda: aí seus contatos confirmados recebem seu nome, a hora e a posição aproximada.',
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
  const logado = estado === 'logado';

  function confirmarRevogar() {
    Alert.alert(
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

  function confirmarExcluir() {
    Alert.alert(
      'Excluir a conta?',
      'Sua conta e seus contatos de segurança são apagados do servidor. Isso não pode ser desfeito. O histórico neste celular continua até você apagar.',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Excluir conta', style: 'destructive', onPress: excluir },
      ],
    );
  }

  async function excluir() {
    setFalhaExclusao(null);
    setExcluindo(true);
    try {
      await excluirConta();
      AccessibilityInfo.announceForAccessibility('Conta excluída.');
      router.replace('/');
    } catch (e) {
      setExcluindo(false);
      // A API ainda não tem a rota de exclusão: dizer a verdade, sem fingir que apagou.
      if (ehErroHttp(e, 404) || ehErroHttp(e, 405) || ehErroHttp(e, 501)) {
        setFalhaExclusao('A exclusão da conta ainda não está disponível no servidor do Hoodi. Nada foi apagado.');
      } else {
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
            onPress={confirmarExcluir}
            desabilitado={excluindo}
          />
        </View>
      ) : null}
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  cartao: { borderRadius: raio.md, padding: espaco[4], gap: espaco[3] },
  tituloCartao: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  secao: { gap: espaco[3] },
});
