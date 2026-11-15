import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { ColarLink } from '@/components/conta/colar-link';
import { TelaConta } from '@/components/conta/tela-conta';
import { ItemContato } from '@/components/contatos/item-contato';
import { CaretRight, CloudSlash, ShareNetwork, Siren, SignOut, Trash, UserPlus, Users, X } from '@/components/icones';
import { Aviso } from '@/components/ui/aviso';
import { Botao } from '@/components/ui/botao';
import { Texto } from '@/components/ui/texto';
import { mensagemDeFalha } from '@/features/api/cliente';
import { horaCurta } from '@/features/ajuda/pedido-ajuda';
import { panicosRecebidos, type PanicoRecebido } from '@/features/ajuda/panico-api';
import { extrairCodigoConvite } from '@/features/conta/link-token';
import { cancelarConvite, criarConvite, removerVinculo } from '@/features/contatos/contatos-api';
import { useContatos } from '@/features/contatos/contatos-context';
import { linkDoConvite, MAX_CONTATOS, type NovoConvite } from '@/features/contatos/tipos';
import { espaco, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** Texto do convite: sem pedir login, senha, dinheiro nem instalação; termina com "Se não reconhece, ignore". */
function textoDoConvite(convite: NovoConvite) {
  return (
    'Quero você como meu contato de segurança no Hoodi. Se eu apertar Pedir ajuda, você recebe um aviso ' +
    `com meu nome, a hora e onde eu estou, mais ou menos. Abra este link no app Hoodi: ${linkDoConvite(convite.codigo)} ` +
    `O convite vale até ${horaCurta(convite.expiraEm)}. Se não reconhece, ignore.`
  );
}

/**
 * Contatos de segurança (F09 CA1, CA2, CA3, CA6, CA9), por convite entre contas do hoodi:
 * - quem recebe os seus pedidos de ajuda (confirmados e aguardando), até 5;
 * - de quem você é contato, com Sair;
 * - pedidos de ajuda que você recebeu.
 */
export default function ContatosScreen() {
  const { cores } = useTema();
  const { meusContatos, convitesPendentes, souContatoDe, carregado, erro, recarregar } = useContatos();
  const [novoConvite, setNovoConvite] = useState<NovoConvite | null>(null);
  const [criando, setCriando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [recebidos, setRecebidos] = useState<PanicoRecebido[]>([]);

  // Ao abrir a tela: atualiza os contatos e os pedidos recebidos.
  useFocusEffect(
    useCallback(() => {
      recarregar();
      panicosRecebidos()
        .then((lista) => setRecebidos([...lista].sort((a, b) => b.registradoEm.localeCompare(a.registradoEm))))
        .catch(() => setRecebidos([]));
    }, [recarregar]),
  );

  const ocupados = meusContatos.length + convitesPendentes.length;
  const noLimite = ocupados >= MAX_CONTATOS;

  async function convidar() {
    // F09 CA3: o sexto não entra. O app explica e não cria o convite.
    if (noLimite) return;
    setFalha(null);
    setCriando(true);
    try {
      const convite = await criarConvite();
      setNovoConvite(convite);
      await recarregar();
      await compartilhar(convite);
    } catch (e) {
      setFalha(mensagemDeFalha(e));
    } finally {
      setCriando(false);
    }
  }

  async function compartilhar(convite: NovoConvite) {
    try {
      await Share.share({ message: textoDoConvite(convite) });
    } catch {
      // A pessoa fechou o menu de compartilhar; o convite continua na tela.
    }
  }

  function confirmar(titulo: string, texto: string, rotulo: string, acao: () => Promise<void>) {
    // Ações que apagam ou desligam algo sempre pedem confirmação (design system v3).
    Alert.alert(titulo, texto, [
      { text: 'Agora não', style: 'cancel' },
      {
        text: rotulo,
        style: 'destructive',
        onPress: async () => {
          try {
            await acao();
          } catch (e) {
            setFalha(mensagemDeFalha(e));
          }
          await recarregar();
        },
      },
    ]);
  }

  return (
    <TelaConta
      titulo="Contatos de segurança"
      subtitulo="Quem recebe um aviso quando você aperta Pedir ajuda. A pessoa precisa ter o Hoodi e aceitar o convite."
      rodape={
        <>
          <Botao
            rotulo={criando ? 'Criando convite' : 'Convidar contato'}
            icone={UserPlus}
            onPress={convidar}
            desabilitado={noLimite || criando}
            dica={noLimite ? `Você já tem ${MAX_CONTATOS} contatos ou convites.` : 'Cria um link de convite para mandar'}
          />
          <Texto variante="legenda" style={styles.centro} accessible={false}>
            {noLimite
              ? `Você chegou ao limite de ${MAX_CONTATOS} contatos. Para convidar outra pessoa, remova um contato ou cancele um convite.`
              : `${ocupados} de ${MAX_CONTATOS} contatos`}
          </Texto>
        </>
      }>
      {erro && !carregado ? (
        <Aviso
          icone={CloudSlash}
          tom="atencao"
          titulo="Não deu para carregar seus contatos"
          texto={mensagemDeFalha(erro)}
          acao={{ rotulo: 'Tentar de novo', onPress: recarregar }}
        />
      ) : null}
      {falha ? <Aviso icone={CloudSlash} tom="atencao" titulo="Não deu certo" texto={falha} /> : null}

      {novoConvite ? (
        <View style={[styles.convite, { backgroundColor: cores.papelRebaixado }]}>
          <Texto variante="subtitulo">Convite pronto</Texto>
          <Texto variante="legenda" cor="grafite">
            Mande o link para a pessoa. Ele vale até {horaCurta(novoConvite.expiraEm)} e funciona uma vez só. Por
            segurança, o link aparece só agora: se sair desta tela, crie outro.
          </Texto>
          <Botao rotulo="Enviar convite" variante="secundario" icone={ShareNetwork} onPress={() => compartilhar(novoConvite)} />
        </View>
      ) : null}

      <Secao titulo="Recebem seu pedido de ajuda">
        {meusContatos.length === 0 && convitesPendentes.length === 0 && carregado ? (
          <Texto variante="legenda">
            Você ainda não tem contatos. Convide alguém de confiança que também use o Hoodi.
          </Texto>
        ) : null}
        {meusContatos.map((v) => (
          <ItemContato
            key={v.id}
            nome={v.nomeExibicao}
            situacao="confirmado"
            acao={{
              rotulo: 'Remover',
              icone: Trash,
              onPress: () =>
                confirmar(
                  `Remover ${v.nomeExibicao}?`,
                  'Esta pessoa deixa de receber seus pedidos de ajuda. Para voltar, é preciso um convite novo.',
                  'Remover',
                  () => removerVinculo(v.id),
                ),
            }}
          />
        ))}
        {convitesPendentes.map((c) => (
          <ItemContato
            key={c.conviteId}
            nome="Convite enviado"
            situacao="aguardando"
            detalhe={`Vale até ${horaCurta(c.expiraEm)}`}
            acao={{
              rotulo: 'Cancelar',
              icone: X,
              onPress: () =>
                confirmar('Cancelar o convite?', 'O link que você mandou deixa de funcionar.', 'Cancelar convite', () =>
                  cancelarConvite(c.conviteId),
                ),
            }}
          />
        ))}
      </Secao>

      {souContatoDe.length > 0 ? (
        <Secao titulo="Você recebe os pedidos de">
          {souContatoDe.map((v) => (
            <ItemContato
              key={v.id}
              nome={v.nomeExibicao}
              situacao="confirmado"
              acao={{
                rotulo: 'Sair',
                icone: SignOut,
                dica: 'Você deixa de receber os pedidos de ajuda desta pessoa',
                onPress: () =>
                  confirmar(
                    `Deixar de ser contato de ${v.nomeExibicao}?`,
                    'Você não recebe mais os pedidos de ajuda desta pessoa.',
                    'Sair',
                    () => removerVinculo(v.id),
                  ),
              }}
            />
          ))}
        </Secao>
      ) : null}

      {recebidos.length > 0 ? (
        <Secao titulo="Pedidos de ajuda recebidos">
          {recebidos.map((p) => (
            <Pressable
              key={p.pedidoId}
              accessibilityRole="button"
              accessibilityLabel={`Pedido de ajuda de ${p.titularNome}, às ${horaCurta(p.registradoEm)}. Abrir`}
              onPress={() => router.push({ pathname: '/ajuda/[id]', params: { id: p.pedidoId } })}
              style={({ pressed }) => [styles.recebido, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
              <Siren size={22} color={cores.perigoTexto} weight="bold" />
              <View style={styles.textos}>
                <Texto variante="corpoForte">{p.titularNome}</Texto>
                <Texto variante="legenda">
                  {new Date(p.registradoEm).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} às{' '}
                  {horaCurta(p.registradoEm)}
                </Texto>
              </View>
              <CaretRight size={20} color={cores.grafiteSuave} weight="bold" />
            </Pressable>
          ))}
        </Secao>
      ) : null}

      <Secao titulo="Recebeu um convite?" icone={Users}>
        <ColarLink
          rotulo="Link do convite"
          ajuda="Se o link não abriu o app, copie e cole aqui."
          erro="Este não parece um link de convite. Copie o link inteiro, que começa com hoodi://convite."
          rotuloBotao="Abrir convite"
          extrair={extrairCodigoConvite}
          aoContinuar={(codigo) => router.push({ pathname: '/convite', params: { codigo } })}
        />
      </Secao>
    </TelaConta>
  );
}

function Secao({ titulo, icone: Icone, children }: { titulo: string; icone?: typeof Users; children: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={styles.secao}>
      <View style={styles.tituloSecao}>
        {Icone ? <Icone size={20} color={cores.grafite} weight="bold" /> : null}
        <Texto variante="subtitulo" accessibilityRole="header">
          {titulo}
        </Texto>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { textAlign: 'center' },
  convite: { borderRadius: raio.md, padding: espaco[4], gap: espaco[3] },
  secao: { gap: espaco[2] },
  tituloSecao: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  recebido: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: tamanho.toqueMin + espaco[2] },
  textos: { flex: 1, gap: 2 },
});
