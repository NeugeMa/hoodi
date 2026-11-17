import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Linking, Platform } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { Bell, Bluetooth, MapPin } from '@/components/icones';
import { CartaoPermissao } from '@/components/permissoes/cartao-permissao';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { useAcompanhamento } from '@/features/alerta/acompanhamento-context';
import {
  estadoBluetooth,
  estadoNotificacoes,
  pedirBluetooth,
  pedirNotificacoes,
  type EstadoPermissao,
} from '@/features/permissoes/permissoes';
import { PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

const NO_NAVEGADOR = Platform.OS === 'web';

/**
 * Permissões (F02 CA2, CA3, CA4): antes de cada pedido do sistema, o motivo daquela permissão.
 * Abre pelo Perfil (Permissões do celular); o app não abre nela sozinho ao iniciar.
 * Negar não trava o app: a tela diz o que deixa de funcionar e qual canal para de avisar.
 */
export default function PermissoesScreen() {
  const { permissao, pedirLocalizacao } = useAcompanhamento();
  const [notificacoes, setNotificacoes] = useState<EstadoPermissao>('nao-pedida');
  const [bluetooth, setBluetooth] = useState<EstadoPermissao>('nao-pedida');

  // Ao abrir (e ao voltar das configurações do celular), lê a situação de cada permissão.
  useFocusEffect(
    useCallback(() => {
      estadoNotificacoes().then(setNotificacoes);
      estadoBluetooth().then(setBluetooth);
    }, []),
  );

  const localizacao: EstadoPermissao =
    permissao === 'concedida' ? 'permitida' : permissao === 'negada' ? 'negada' : 'nao-pedida';

  function acaoPara(estado: EstadoPermissao, pedir: () => void) {
    if (estado === 'nao-pedida') return { rotulo: 'Permitir', onPress: pedir };
    if (estado === 'negada') {
      // Negada uma vez, o sistema não pergunta de novo: só pelas configurações.
      return NO_NAVEGADOR
        ? { rotulo: 'Tentar de novo', onPress: pedir }
        : { rotulo: 'Abrir configurações', onPress: () => Linking.openSettings() };
    }
    return undefined;
  }

  async function continuar() {
    await salvarPreferencia(PREF.permissoesVistas, '1');
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <TelaConta
      titulo="Permissões"
      subtitulo="O Hoodi pede só o que precisa. Antes de cada pedido do celular, você vê o motivo."
      rodape={<Botao rotulo="Continuar" onPress={continuar} />}>
      <CartaoPermissao
        icone={MapPin}
        titulo="Localização"
        motivo="Para saber o risco registrado onde você está, comparar rotas e avisar quando o risco sobe. A posição fica só no celular."
        estado={localizacao}
        seNegar="Sem a localização, a comparação de rotas e o alerta não funcionam. Você ainda pode ver o mapa."
        acao={acaoPara(localizacao, async () => {
          await pedirLocalizacao();
          AccessibilityInfo.announceForAccessibility('Pedido de localização respondido.');
        })}
      />
      <CartaoPermissao
        icone={Bell}
        titulo="Notificações"
        motivo="Para o alerta de risco aparecer no celular e chegar ao seu relógio, que espelha as notificações."
        estado={notificacoes}
        seNegar="Sem notificações, o relógio não recebe os alertas. O Hoodi Pet e a tela do app continuam avisando."
        seIndisponivel="No navegador não há notificações do app. Use o celular para receber os alertas."
        acao={acaoPara(notificacoes, async () => setNotificacoes(await pedirNotificacoes()))}
      />
      <CartaoPermissao
        icone={Bluetooth}
        titulo="Bluetooth"
        motivo="Para conectar o Hoodi Pet e fazer ele vibrar e mostrar a carinha quando o risco sobe."
        estado={bluetooth}
        seNegar="Sem Bluetooth, o Hoodi Pet não recebe os alertas. O relógio e a tela do app continuam avisando."
        seIndisponivel={
          NO_NAVEGADOR
            ? 'No navegador não há Bluetooth com o Hoodi Pet. Use o app no celular.'
            : 'O Bluetooth com o Hoodi Pet só funciona no app instalado (development build), não no Expo Go. O relógio e a tela continuam avisando.'
        }
        acao={acaoPara(bluetooth, async () => setBluetooth(await pedirBluetooth()))}
      />
      <Texto variante="legenda">Você pode mudar isto depois, em Perfil.</Texto>
    </TelaConta>
  );
}
