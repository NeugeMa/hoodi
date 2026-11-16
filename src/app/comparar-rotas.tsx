import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {AccessibilityInfo, Keyboard, StyleSheet, View} from 'react-native';

import { TelaConta } from '@/components/conta/tela-conta';
import { CloudSlash, GpsFix, MapPinLine, Question, WarningCircle } from '@/components/icones';
import { CartaoRota } from '@/components/rotas/cartao-rota';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { Texto } from '@/components/ui/texto';
import { perguntar } from '@/components/ui/perguntar';
import { useAcompanhamento } from '@/features/alerta/acompanhamento-context';
import { ESTACAO_LIBERDADE, FIAP_PAULISTA } from '@/features/demo/dados-demo';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import { ErroApi, mensagemDeFalha } from '@/features/api/cliente';
import { useGrade } from '@/features/grade/grade-context';
import { faixaAtual } from '@/features/grade/recorte';
import type { Coordenada } from '@/features/grade/tipos';
import { usePreferencias } from '@/features/preferencias/preferencias-context';
import { compararRotas, type Comparacao, type RotaVista } from '@/features/rotas/comparar';
import { avaliarRotas } from '@/features/rotas/rotas-api';
import { useTrajeto } from '@/features/trajeto/trajeto-context';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Estado =
  | { tipo: 'editando' }
  | { tipo: 'buscando' }
  | { tipo: 'resultado'; comparacao: Comparacao }
  | { tipo: 'sem-internet' }
  | { tipo: 'falha'; texto: string };

async function posicaoAtual(): Promise<Coordenada | null> {
  if (MODO_DEMO) return FIAP_PAULISTA; // demonstração: sempre saindo da FIAP Paulista
  try {
    const ultima = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    const local = ultima ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: local.coords.latitude, longitude: local.coords.longitude };
  } catch {
    return null;
  }
}

/** Endereço digitado → coordenada, pelo geocodificador do próprio celular (nada vai para o servidor do Hoodi). */
async function acharDestino(texto: string): Promise<Coordenada | null> {
  // Demonstração: qualquer destino vira a Estação Liberdade (o exemplo do TC13).
  if (MODO_DEMO) return ESTACAO_LIBERDADE;
  try {
    const [achado] = await Location.geocodeAsync(`${texto}, São Paulo, SP`);
    return achado ? { latitude: achado.latitude, longitude: achado.longitude } : null;
  } catch {
    return null;
  }
}

/**
 * Comparar rotas (F04 · TC13, TC14, TC34): da sua posição até o destino, a rota normal e a de
 * menor risco registrado, com a diferença em minutos e a frase que explica. "Iniciar trajeto" começa
 * o acompanhamento e volta para o Início (CA6).
 */
export default function CompararRotasScreen() {
  const { cores } = useTema();
  const { permissao, pedirLocalizacao } = useAcompanhamento();
  const { grade } = useGrade();
  const { iniciarTrajeto } = useTrajeto();
  const { consentimentoEm, darConsentimento } = usePreferencias();
  const [destino, setDestino] = useState('');
  const [erroDestino, setErroDestino] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });
  const [escolhida, setEscolhida] = useState<RotaVista | null>(null);

  async function comparar() {
    Keyboard.dismiss();
    setEscolhida(null);
    // CA4: destino vazio não compara.
    if (!destino.trim()) {
      setErroDestino('Escreva para onde você vai.');
      return;
    }
    setErroDestino(null);
    setEstado({ tipo: 'buscando' });

    const origem = await posicaoAtual();
    if (!origem) {
      setEstado({ tipo: 'falha', texto: 'Não conseguimos saber onde você está. Confira se a localização está ligada.' });
      return;
    }
    const alvo = await acharDestino(destino);
    if (!alvo) {
      setEstado({ tipo: 'editando' });
      setErroDestino('Não achamos esse endereço. Tente com rua e número, ou o nome do lugar.');
      return;
    }

    try {
      const resultado = await avaliarRotas(origem, alvo);
      const comparacao = compararRotas(resultado, grade, grade ? faixaAtual(grade.faixas) : null);
      setEstado({ tipo: 'resultado', comparacao });
      if (comparacao.tipo === 'comparada') setEscolhida(comparacao.menorRisco);
      if (comparacao.tipo === 'uma-rota') setEscolhida(comparacao.rota);
      AccessibilityInfo.announceForAccessibility('Rotas encontradas.');
    } catch (e) {
      // CA5: sem internet, avisa e o mapa continua com os dados salvos.
      if (e instanceof ErroApi && e.tipo === 'sem-internet') setEstado({ tipo: 'sem-internet' });
      else setEstado({ tipo: 'falha', texto: mensagemDeFalha(e) });
    }
  }

  function iniciar() {
    if (!escolhida) return;
    const comecar = () => {
      iniciarTrajeto({
        destino: destino.trim(),
        minutosAteDestino: escolhida.minutos,
        alertasRecebidos: 0,
        proximoTrecho: null,
        caminho: escolhida.caminho,
      });
      AccessibilityInfo.announceForAccessibility('Trajeto iniciado.');
      if (router.canGoBack()) router.back();
      else router.replace('/');
    };
    // Consentimento revogado: pede de novo antes de começar (F08 CA4 · TC38).
    if (!consentimentoEm) {
      perguntar(
        'Dar o consentimento?',
        'Para acompanhar o trajeto e avisar no relógio e no Hoodi Pet, o Hoodi precisa do seu consentimento. Sua posição continua só no celular.',
        [
          { text: 'Agora não', style: 'cancel' },
          {
            text: 'Dar consentimento',
            onPress: async () => {
              await darConsentimento();
              comecar();
            },
          },
        ],
      );
      return;
    }
    comecar();
  }

  const resultado = estado.tipo === 'resultado' ? estado.comparacao : null;
  const buscando = estado.tipo === 'buscando';

  return (
    <TelaConta
      titulo="Comparar rotas"
      subtitulo="Da sua posição até o destino: a rota normal e a de menor risco registrado."
      rodape={
        resultado && (resultado.tipo === 'comparada' || resultado.tipo === 'sem-dado' || resultado.tipo === 'uma-rota') ? (
          <>
            <Botao rotulo="Iniciar trajeto" onPress={iniciar} desabilitado={!escolhida} dica="Começa a acompanhar e volta ao Início" />
            {!escolhida ? (
              <Texto variante="legenda" style={styles.centro} accessible={false}>
                Escolha uma rota para começar.
              </Texto>
            ) : null}
          </>
        ) : (
          <Botao rotulo={buscando ? 'Buscando rotas' : 'Comparar rotas'} onPress={comparar} desabilitado={buscando} />
        )
      }>
      {permissao !== 'concedida' ? (
        <Aviso
          icone={GpsFix}
          titulo="Precisamos da sua localização"
          texto="A comparação começa onde você está. A posição fica só no aparelho."
          acao={{ rotulo: 'Permitir localização', onPress: pedirLocalizacao }}
        />
      ) : (
        <View style={[styles.origem, { backgroundColor: cores.papelRebaixado }]}>
          <GpsFix size={20} color={cores.grafite} weight="bold" />
          <Texto variante="corpoForte">Saindo de onde você está</Texto>
        </View>
      )}

      <CampoTexto
        rotulo="Para onde você vai"
        tipo="texto"
        icone={MapPinLine}
        valor={destino}
        aoMudar={(t) => {
          setDestino(t);
          if (erroDestino) setErroDestino(null);
          if (estado.tipo !== 'editando' && estado.tipo !== 'buscando') setEstado({ tipo: 'editando' });
        }}
        erro={erroDestino}
        returnKeyType="search"
        onSubmitEditing={comparar}
      />

      {estado.tipo === 'sem-internet' ? (
        <Aviso
          icone={CloudSlash}
          tom="atencao"
          titulo="Comparar rotas precisa de internet"
          texto="Você está sem internet agora. O mapa continua funcionando com os dados salvos."
          acao={{ rotulo: 'Ver o mapa', onPress: () => router.navigate('/mapa') }}
        />
      ) : null}
      {estado.tipo === 'falha' ? (
        <Aviso icone={WarningCircle} tom="atencao" titulo="Não deu para comparar" texto={estado.texto} />
      ) : null}

      {resultado?.tipo === 'fora' ? (
        <Aviso
          icone={MapPinLine}
          tom="atencao"
          titulo="Fora da área coberta"
          texto="O Hoodi ainda não tem dados para esse destino, então não compara rotas até lá."
        />
      ) : null}
      {resultado?.tipo === 'indisponivel' ? (
        <Aviso icone={CloudSlash} tom="atencao" titulo="Rotas indisponíveis agora" texto="Não deu para buscar as rotas. Tente de novo em instantes." />
      ) : null}

      {resultado?.tipo === 'comparada' ? (
        resultado.mesma ? (
          <CartaoRota
            titulo="Rota normal e de menor risco registrado"
            minutos={resultado.normal.minutos}
            metros={resultado.normal.metros}
            frase={resultado.frase}
            menorRisco
            selecionada={escolhida?.id === resultado.normal.id}
            aoEscolher={() => setEscolhida(resultado.normal)}
          />
        ) : (
          <View style={styles.rotas}>
            <CartaoRota
              titulo="Menor risco registrado"
              minutos={resultado.menorRisco.minutos}
              metros={resultado.menorRisco.metros}
              frase={`${resultado.frase} ${
                resultado.diferencaMin > 0 ? `São ${resultado.diferencaMin} min a mais.` : 'Leva o mesmo tempo.'
              }`}
              menorRisco
              selecionada={escolhida?.id === resultado.menorRisco.id}
              aoEscolher={() => setEscolhida(resultado.menorRisco)}
            />
            <CartaoRota
              titulo="Rota normal"
              minutos={resultado.normal.minutos}
              metros={resultado.normal.metros}
              frase="O caminho mais rápido."
              selecionada={escolhida?.id === resultado.normal.id}
              aoEscolher={() => setEscolhida(resultado.normal)}
            />
          </View>
        )
      ) : null}

      {resultado?.tipo === 'sem-dado' ? (
        <View style={styles.rotas}>
          <Aviso
            icone={Question}
            titulo="Não dá para comparar"
            texto="Há trecho sem dado no caminho. Sem dado não quer dizer área tranquila, então o Hoodi não indica qual rota tem menor risco."
          />
          {resultado.rotas.map((r, i) => (
            <CartaoRota
              key={r.id}
              titulo={`Rota ${i + 1}`}
              minutos={r.minutos}
              metros={r.metros}
              selecionada={escolhida?.id === r.id}
              aoEscolher={() => setEscolhida(r)}
            />
          ))}
        </View>
      ) : null}

      {resultado?.tipo === 'uma-rota' ? (
        <View style={styles.rotas}>
          <Aviso icone={Question} titulo="Rota avaliada" texto="Só achamos um caminho até lá, então não há o que comparar." />
          <CartaoRota
            titulo="Rota"
            minutos={resultado.rota.minutos}
            metros={resultado.rota.metros}
            selecionada={escolhida?.id === resultado.rota.id}
            aoEscolher={() => setEscolhida(resultado.rota)}
          />
        </View>
      ) : null}

      <Texto variante="legenda">Risco com base em registros da SSP-SP: o melhor dado disponível no período.</Texto>
    </TelaConta>
  );
}

const styles = StyleSheet.create({
  origem: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], padding: espaco[4], borderRadius: raio.md },
  rotas: { gap: espaco[3] },
  centro: { textAlign: 'center' },
});
