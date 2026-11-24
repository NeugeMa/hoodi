import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';

import { LinkTexto } from '@/components/ui/link-texto';
import { Texto } from '@/components/ui/texto';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import { espaco, raio, sombra } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

/** A partir desta largura o app vira uma "tela de celular" centralizada (no celular, ocupa tudo). */
const LARGURA_TELA_LARGA = 700;
/** A partir desta largura, a apresentação do Hoodi aparece ao lado do celular. */
const LARGURA_COM_APRESENTACAO = 1100;
const CELULAR = { largura: 412, altura: 892 };

/**
 * Navegador no computador: o app foi desenhado para o celular, então em tela larga ele fica numa
 * coluna do tamanho de um celular, centralizada, com uma apresentação curta ao lado.
 * No navegador do celular (tela estreita), nada muda.
 */
export function MolduraTela({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  const { width, height } = useWindowDimensions();

  // A estrutura é a mesma em qualquer largura (só o estilo muda): redimensionar a janela não reinicia o app.
  const larga = width >= LARGURA_TELA_LARGA;
  const comApresentacao = width >= LARGURA_COM_APRESENTACAO;
  const alturaCelular = Math.min(CELULAR.altura, height - espaco[8] * 2);

  return (
    <View style={[styles.cheia, larga && [styles.fundo, { backgroundColor: cores.papelRebaixado }]]}>
      {comApresentacao ? <Apresentacao /> : null}
      <View
        style={
          larga
            ? [styles.celular, sombra.suave, { height: alturaCelular, backgroundColor: cores.papel, borderColor: cores.linha }]
            : styles.cheia
        }>
        {children}
      </View>
    </View>
  );
}

function Apresentacao() {
  const { escuro } = useTema();
  return (
    <View style={styles.apresentacao}>
      <Image
        source={
          escuro
            ? require('@/assets/images/logo-chapeuzinho-contorno.png')
            : require('@/assets/images/logo-chapeuzinho.png')
        }
        contentFit="contain"
        style={styles.logo}
        accessibilityLabel="Logo do Hoodi: a Chapeuzinho de capuz vermelho"
      />
      <Texto variante="display">Hoodi</Texto>
      <Texto variante="subtitulo">Alerta de risco sem tirar o celular do bolso.</Texto>
      <Texto variante="corpo" cor="grafiteSuave">
        Para quem volta a pé à noite, em volta da FIAP Paulista: o Hoodi cruza a sua posição com os registros
        da SSP-SP e avisa pelo relógio e pelo Hoodi Pet quando o risco sobe. Também compara rotas pelo menor
        risco registrado e avisa contatos de confiança no Pedir ajuda.
      </Texto>
      {MODO_DEMO ? (
        <Texto variante="legenda">
          Esta é a demonstração, com dados simulados. Comece em Perfil &gt; Perfil demo. O Hoodi Pet, o push e o
          GPS de verdade ficam no app do celular.
        </Texto>
      ) : null}
      <LinkTexto rotulo="Código no GitHub" onPress={() => Linking.openURL('https://github.com/NeugeMa/hoodi')} />
    </View>
  );
}

const styles = StyleSheet.create({
  cheia: { flex: 1 },
  fundo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[12] * 2,
    padding: espaco[8],
  },
  celular: {
    width: CELULAR.largura,
    borderRadius: raio.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  apresentacao: { maxWidth: 420, gap: espaco[4] },
  logo: { width: 96, height: 96 },
});
