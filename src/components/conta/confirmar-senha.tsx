import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Lock, Trash } from '@/components/icones';
import { Botao } from '@/components/ui/botao';
import { CampoTexto } from '@/components/ui/campo-texto';
import { Texto } from '@/components/ui/texto';
import { espaco, raio } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

type Props = {
  visivel: boolean;
  titulo: string;
  texto: string;
  rotuloConfirmar: string;
  /** Erro vindo do servidor (ex.: senha incorreta). */
  erro?: string | null;
  enviando: boolean;
  aoConfirmar: (senha: string) => void;
  aoFechar: () => void;
};

/**
 * Folha de baixo que pede a senha antes de uma ação que não pode ser desfeita (excluir a conta).
 * A senha fica só na memória durante a confirmação.
 */
export function ConfirmarSenha({ visivel, titulo, texto, rotuloConfirmar, erro, enviando, aoConfirmar, aoFechar }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const [senha, setSenha] = useState('');
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  function fechar() {
    setSenha('');
    setErroLocal(null);
    aoFechar();
  }

  function confirmar() {
    if (!senha) {
      setErroLocal('Escreva sua senha.');
      return;
    }
    setErroLocal(null);
    aoConfirmar(senha);
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.tela}>
        <Pressable accessibilityLabel="Fechar" style={styles.fundo} onPress={enviando ? undefined : fechar} />
        <View style={[styles.folha, { backgroundColor: cores.papelElevado, paddingBottom: insets.bottom + espaco[3] }]}>
          <View style={styles.cabecalho}>
            <Trash size={22} color={cores.grafite} weight="bold" />
            <Texto variante="subtitulo" accessibilityRole="header">
              {titulo}
            </Texto>
          </View>
          <Texto variante="legenda" cor="grafite">
            {texto}
          </Texto>
          <CampoTexto
            rotulo="Sua senha"
            tipo="senha"
            icone={Lock}
            valor={senha}
            aoMudar={(t) => {
              setSenha(t);
              if (erroLocal) setErroLocal(null);
            }}
            erro={erroLocal ?? erro}
            returnKeyType="done"
            onSubmitEditing={confirmar}
            autoFocus
          />
          <Botao rotulo={enviando ? 'Excluindo' : rotuloConfirmar} onPress={confirmar} desabilitado={enviando} />
          <Botao rotulo="Agora não" variante="fantasma" onPress={fechar} desabilitado={enviando} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    paddingHorizontal: espaco[4],
    paddingTop: espaco[6],
    gap: espaco[3],
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
});
