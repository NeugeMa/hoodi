import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { ArrowSquareOut, CloudSlash, MapPin, Siren } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { ehErroHttp, mensagemDeFalha } from '@/features/api/cliente';
import { horaCurta, linkGoogleMaps } from '@/features/ajuda/pedido-ajuda';
import { detalheDoPanico, marcarAberto, type PanicoDetalhe } from '@/features/ajuda/panico-api';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Endereço em texto a partir da posição aproximada (no aparelho de quem recebe). */
async function enderecoAproximado(latitude: number, longitude: number) {
  if (Platform.OS === 'web') return null;
  try {
    const [r] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!r) return null;
    const rua = [r.street, r.streetNumber].filter(Boolean).join(', ');
    return [rua, r.district, r.city].filter(Boolean).join(' · ') || null;
  } catch {
    return null;
  }
}

/**
 * Pedido de ajuda recebido (F09 CA4), visto pelo contato: nome, hora, endereço aproximado
 * em texto e o link do Google Maps. Abrir esta tela avisa a API que o contato viu o pedido.
 */
export default function PedidoRecebidoScreen() {
  const { cores } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pedido, setPedido] = useState<PanicoDetalhe | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const detalhe = await detalheDoPanico(id);
        if (!ativo) return;
        setPedido(detalhe);
        marcarAberto(id).catch(() => {});
        if (detalhe.latitude !== null && detalhe.longitude !== null) {
          const texto = await enderecoAproximado(detalhe.latitude, detalhe.longitude);
          if (ativo) setEndereco(texto);
        }
      } catch (e) {
        if (ativo) setErro(e);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id]);

  if (erro) {
    return (
      <TelaConta titulo="Pedido de ajuda">
        <Aviso
          icone={CloudSlash}
          tom="atencao"
          titulo="Não deu para abrir o pedido"
          texto={
            ehErroHttp(erro, 404)
              ? 'Este pedido não está mais disponível para você. Talvez a pessoa tenha removido você dos contatos.'
              : mensagemDeFalha(erro)
          }
        />
      </TelaConta>
    );
  }

  const temPosicao = pedido && pedido.latitude !== null && pedido.longitude !== null;

  return (
    <TelaConta
      titulo="Pedido de ajuda"
      rodape={
        temPosicao ? (
          <Botao
            rotulo="Abrir no Google Maps"
            icone={ArrowSquareOut}
            onPress={() => Linking.openURL(linkGoogleMaps(pedido.latitude!, pedido.longitude!))}
          />
        ) : null
      }>
      {pedido ? (
        <>
          <View style={[styles.cartao, { backgroundColor: cores.perigoFundo }]}>
            <Siren size={28} color={cores.perigoTexto} weight="fill" />
            <View style={styles.textos}>
              <Texto variante="subtitulo">{pedido.titularNome} pediu ajuda</Texto>
              <Texto variante="legenda" cor="grafite">
                Às {horaCurta(pedido.registradoEm)},{' '}
                {new Date(pedido.registradoEm).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </Texto>
            </View>
          </View>

          <View style={styles.local}>
            <MapPin size={22} color={cores.grafite} weight="bold" />
            <View style={styles.textos}>
              <Texto variante="corpoForte">Onde, mais ou menos</Texto>
              <Texto variante="legenda" cor="grafite">
                {temPosicao
                  ? (endereco ?? 'Posição aproximada, cerca de 100 m. Abra no mapa para ver.')
                  : 'A pessoa pediu ajuda sem a localização disponível.'}
              </Texto>
            </View>
          </View>

          {pedido.observacao ? <Texto>{pedido.observacao}</Texto> : null}

          <Texto variante="legenda">
            Tente falar com {pedido.titularNome}. O hoodi nunca pede login, senha, dinheiro nem instalação. Se não
            reconhece, ignore.
          </Texto>
        </>
      ) : (
        <Texto variante="legenda">Abrindo o pedido</Texto>
      )}
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: espaco[3], padding: espaco[4], borderRadius: raio.md, alignItems: 'center' },
  local: { flexDirection: 'row', gap: espaco[3] },
  textos: { flex: 1, gap: 2 },
});
