import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Linking, Platform } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { Bell, Bluetooth, MapPin } from '@/components/icones';
import { CartaoPermissao } from '@/components/permissoes/cartao-permissao';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { useAcompanhamento } from '@/features/alerta/acompanhamento-context';
import { estadoSegundoPlano } from '@/features/alerta/segundo-plano';
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
  const { permissao, pedirLocalizacao, segundoPlano, ativarSegundoPlano, desativarSegundoPlano } = useAcompanhamento();
  const [permissaoSegundoPlano, setPermissaoSegundoPlano] = useState<EstadoPermissao>('nao-pedida');
  const [notificacoes, setNotificacoes] = useState<EstadoPermissao>('nao-pedida');
  const [bluetooth, setBluetooth] = useState<EstadoPermissao>('nao-pedida');

  // Ao abrir (e ao voltar das configurações do celular), lê a situação de cada permissão.
  useFocusEffect(
    useCallback(() => {
      estadoNotificacoes().then(setNotificacoes);
      estadoBluetooth().then(setBluetooth);
      estadoSegundoPlano().then(setPermissaoSegundoPlano);
    }, []),
  );

  const localizacao: EstadoPermissao =
    permissao === 'concedida' ? 'permitida' : permissao === 'negada' ? 'negada' : 'nao-pedida';

  // Ligado só vale com a permissão do sistema ainda dada (a pessoa pode retirá-la nas configurações).
  const segundoPlanoAtivo: EstadoPermissao =
    permissaoSegundoPlano === 'permitida' && segundoPlano ? 'permitida' : permissaoSegundoPlano === 'permitida' ? 'nao-pedida' : permissaoSegundoPlano;

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
        motivo="Para saber o risco registrado onde você está e avisar quando o risco sobe, com o app aberto. A posição fica só no celular."
        estado={localizacao}
        seNegar="Sem a localização, o alerta não funciona. Você ainda pode ver o mapa."
        acao={acaoPara(localizacao, async () => {
          await pedirLocalizacao();
          AccessibilityInfo.announceForAccessibility('Pedido de localização respondido.');
        })}
      />
      <CartaoPermissao
        icone={MapPin}
        titulo="Localização em segundo plano"
        motivo="Para avisar quando o risco sobe com a tela apagada ou o app fechado, sem tirar o celular do bolso. Usa mais bateria e mostra um aviso fixo enquanto acompanha. A posição continua só no celular."
        estado={localizacao === 'permitida' ? segundoPlanoAtivo : 'nao-pedida'}
        seNegar="Sem o segundo plano, o alerta só funciona com o app aberto na tela."
        seIndisponivel="O segundo plano só funciona no app instalado (development build), não no Expo Go nem no navegador."
        acao={
          localizacao !== 'permitida'
            ? undefined
            : segundoPlanoAtivo === 'permitida'
              ? {
                  rotulo: 'Desligar',
                  onPress: async () => {
                    await desativarSegundoPlano();
                    AccessibilityInfo.announceForAccessibility('Segundo plano desligado.');
                  },
                }
              : acaoPara(segundoPlanoAtivo, async () => {
                  setPermissaoSegundoPlano(await ativarSegundoPlano());
                  AccessibilityInfo.announceForAccessibility('Pedido de localização em segundo plano respondido.');
                })
        }
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
