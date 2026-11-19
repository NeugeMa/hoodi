import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CheckCircle, Clock, CloudSlash, Info, Siren, Users, Warning } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { enviarPedidoDeAjuda, retirarResultadoDoPet, type ResultadoPedido } from '@/features/ajuda/enviar-pedido';
import { horaCurta, MAX_PEDIDOS_POR_HORA, situacaoDoLimite } from '@/features/ajuda/pedido-ajuda';
import { statusDoPanico, type PanicoRegistrado, type ResumoDespachos } from '@/features/ajuda/panico-api';
import { useConta } from '@/features/conta/conta-context';
import { useContatos } from '@/features/contatos/contatos-context';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Estado = { tipo: 'confirmar' } | { tipo: 'enviando' } | ResultadoPedido;

/** Nunca diz "recebido": push enviado não prova que chegou (contrato da API). */
function textoDoResumo(r: ResumoDespachos) {
  switch (r.estado) {
    case 'sem_destinatarios':
      return 'Nenhum contato confirmado para avisar. Convide alguém em Contatos.';
    case 'em_processamento':
      return `O Hoodi está avisando ${r.total === 1 ? 'seu contato' : `seus ${r.total} contatos`}.`;
    case 'aceito_expo':
    case 'aceito_provedor_push':
      return 'O aviso saiu para os seus contatos. O Hoodi não consegue garantir que chegou.';
    case 'aberto_no_app':
      return r.abertosNoApp === 1 ? '1 contato abriu o seu pedido no app.' : `${r.abertosNoApp} contatos abriram o seu pedido no app.`;
    case 'nenhum_envio_confirmado':
      return 'O aviso não saiu para nenhum contato. Se puder, ligue para alguém de confiança.';
  }
}

/**
 * Pedir ajuda (F09 CA4 a CA8): confirmação com a prévia do que os contatos recebem.
 * Única ação vermelha do app. Sem internet ou no limite, diz na hora que o pedido NÃO foi enviado.
 */
export default function PedirAjudaScreen() {
  const { cores } = useTema();
  const { usuario } = useConta();
  const { meusContatos } = useContatos();
  // Aberta pelo botão do Pet: o pedido já foi feito, a tela mostra o resultado.
  const [estado, setEstado] = useState<Estado>(() => retirarResultadoDoPet() ?? { tipo: 'confirmar' });
  const [limite, setLimite] = useState<{ restantes: number; liberaEm: Date | null }>({
    restantes: MAX_PEDIDOS_POR_HORA,
    liberaEm: null,
  });

  useFocusEffect(
    useCallback(() => {
      situacaoDoLimite().then(setLimite);
    }, []),
  );

  const confirmados = meusContatos.length;
  const agora = new Date().toISOString();

  async function enviar() {
    setEstado({ tipo: 'enviando' });
    const resultado = await enviarPedidoDeAjuda();
    setLimite(await situacaoDoLimite());
    setEstado(resultado);
    AccessibilityInfo.announceForAccessibility(
      resultado.tipo === 'registrado'
        ? `Pedido de ajuda registrado às ${horaCurta(resultado.pedido.registradoEm)}.`
        : 'Pedido de ajuda não enviado.',
    );
  }

  async function atualizarStatus(pedido: PanicoRegistrado) {
    try {
      const status = await statusDoPanico(pedido.pedidoId);
      setEstado({ tipo: 'registrado', pedido: { ...pedido, resumo: status.resumo } });
    } catch {
      // Mantém o último resumo.
    }
  }

  if (estado.tipo === 'registrado') {
    const { pedido } = estado;
    return (
      <TelaConta
        titulo="Pedido registrado"
        voltar={false}
        rodape={
          <>
            <Botao rotulo="Atualizar situação" variante="secundario" onPress={() => atualizarStatus(pedido)} />
            <Botao rotulo="Voltar ao início" variante="fantasma" onPress={() => router.back()} />
          </>
        }>
        <Aviso
          icone={CheckCircle}
          tom="sucesso"
          titulo={
            pedido.reutilizado
              ? `Pedido já registrado às ${horaCurta(pedido.registradoEm)}`
              : `Pedido registrado às ${horaCurta(pedido.registradoEm)}`
          }
          texto={
            pedido.reutilizado
              ? `Localização original mantida. ${textoDoResumo(pedido.resumo)}`
              : textoDoResumo(pedido.resumo)
          }
        />
        <Aviso
          icone={Info}
          titulo="Enquanto isso"
          texto="Se puder, vá para um lugar movimentado e iluminado e fique com o celular por perto."
        />
      </TelaConta>
    );
  }

  if (estado.tipo === 'nao-enviado') {
    return (
      <TelaConta
        titulo="Pedido não enviado"
        voltar={false}
        rodape={
          <>
            {estado.motivo !== 'limite' ? <Botao rotulo="Tentar de novo" onPress={enviar} /> : null}
            <Botao rotulo="Voltar ao início" variante="fantasma" onPress={() => router.back()} />
          </>
        }>
        <Aviso
          icone={estado.motivo === 'limite' ? Clock : CloudSlash}
          tom="atencao"
          titulo="Seus contatos não foram avisados"
          texto={estado.texto}
        />
      </TelaConta>
    );
  }

  const enviando = estado.tipo === 'enviando';
  const semContatos = confirmados === 0;

  return (
    <TelaConta
      titulo="Pedir ajuda"
      subtitulo={
        semContatos
          ? 'Você ainda não tem contatos confirmados para avisar.'
          : `${confirmados === 1 ? 'Seu contato confirmado recebe' : `Seus ${confirmados} contatos confirmados recebem`} um aviso do Hoodi.`
      }
      rodape={
        semContatos ? (
          <Botao rotulo="Convidar contatos" icone={Users} onPress={() => router.replace('/contatos')} />
        ) : (
          <>
            {/* Única ação em vermelho capuz: responde a perigo e só envia depois desta confirmação. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={enviando ? 'Enviando pedido de ajuda' : 'Enviar pedido de ajuda'}
              accessibilityState={{ disabled: enviando }}
              disabled={enviando}
              onPress={enviar}
              style={({ pressed }) => [
                styles.botaoAjuda,
                { backgroundColor: cores.capuz, opacity: enviando ? 0.6 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}>
              <Siren size={tamanho.icone} color={cores.sobreCapuz} weight="fill" />
              <Texto variante="corpoForte" style={{ color: cores.sobreCapuz }}>
                {enviando ? 'Enviando' : 'Enviar pedido de ajuda'}
              </Texto>
            </Pressable>
            <Botao rotulo="Agora não" variante="fantasma" onPress={() => router.back()} desabilitado={enviando} />
          </>
        )
      }>
      {/* Prévia exata do que o contato vê (design system v3, tela 11). */}
      <View style={[styles.previa, { backgroundColor: cores.papelRebaixado }]} accessible accessibilityLabel="Prévia do pedido">
        <Texto variante="rotulo" cor="grafiteSuave">
          O que seus contatos veem
        </Texto>
        <Texto variante="corpoForte">{usuario?.nome ?? 'Você'} pediu ajuda pelo Hoodi</Texto>
        <Texto variante="legenda" cor="grafite">
          Às {horaCurta(agora)}, perto da sua posição atual (aproximada, cerca de 100 m), com um link para abrir no
          Google Maps.
        </Texto>
        <Texto variante="legenda" cor="grafite">
          O Hoodi nunca pede login, senha, dinheiro nem instalação. Se não reconhece, ignore.
        </Texto>
      </View>

      {limite.restantes < MAX_PEDIDOS_POR_HORA ? (
        <Aviso
          icone={Warning}
          tom={limite.restantes === 0 ? 'atencao' : 'neutro'}
          titulo={limite.restantes === 0 ? 'Limite de pedidos atingido' : `Você ainda pode enviar ${limite.restantes} nesta hora`}
          texto={`O Hoodi permite ${MAX_PEDIDOS_POR_HORA} pedidos por hora, para evitar envio por engano.`}
        />
      ) : null}
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  previa: { borderRadius: raio.md, padding: espaco[4], gap: espaco[2] },
  botaoAjuda: {
    minHeight: tamanho.toquePrincipal,
    borderRadius: raio.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[2],
  },
});
