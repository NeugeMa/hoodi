import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { Eye, EyeSlash, WarningCircle, type Icon } from '@/components/icones';
import { espaco, fontes, raio, tamanho } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

import { Texto } from './texto';

type Props = {
  /** Rótulo sempre visível, lido pelo leitor de tela (F01 CA7). */
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  tipo?: 'texto' | 'email' | 'senha' | 'link';
  /** Mensagem de erro do campo: contorno e texto em vermelho, com ícone. */
  erro?: string | null;
  /** Texto de apoio abaixo do campo (ex.: regra da senha). */
  ajuda?: string;
  ref?: Ref<TextInputInstance>;
  /** Ícone à esquerda, dentro do campo (ex.: envelope no e-mail, cadeado na senha). */
  icone?: Icon;
  aoFocar?: () => void;
  aoSair?: () => void;
  /** Senha: avisa quando a pessoa toca em Mostrar ou Ocultar. */
  aoMostrarSenha?: (mostrando: boolean) => void;
} & Pick<TextInputProps, 'returnKeyType' | 'onSubmitEditing' | 'autoFocus' | 'submitBehavior' | 'editable'>;

const CONFIG_TIPO: Record<NonNullable<Props['tipo']>, Partial<TextInputProps>> = {
  texto: { autoCapitalize: 'words', autoComplete: 'name', textContentType: 'name' },
  email: {
    autoCapitalize: 'none',
    autoCorrect: false,
    autoComplete: 'email',
    textContentType: 'emailAddress',
    keyboardType: 'email-address',
    inputMode: 'email',
  },
  senha: { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'password', textContentType: 'password' },
  link: { autoCapitalize: 'none', autoCorrect: false, inputMode: 'url' },
};

/**
 * Campo de texto (design system v3): 56px, rótulo visível, senha com Mostrar (olho),
 * erro com contorno e mensagem. O erro de formulário é uma das exceções ao "vermelho é perigo".
 */
export function CampoTexto({
  rotulo,
  valor,
  aoMudar,
  tipo = 'texto',
  erro,
  ajuda,
  ref,
  icone: Icone,
  aoFocar,
  aoSair,
  aoMostrarSenha,
  ...resto
}: Props) {
  const { cores } = useTema();
  const [foco, setFoco] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const senha = tipo === 'senha';

  const borda = erro ? cores.perigoTexto : foco ? cores.foco : 'transparent';

  return (
    <View style={styles.campo}>
      <Texto variante="legenda" cor="grafite" accessible={false}>
        {rotulo}
      </Texto>
      <View style={[styles.caixa, { backgroundColor: cores.papelRebaixado, borderColor: borda }]}>
        {Icone ? (
          <View style={styles.icone}>
            <Icone size={20} color={foco ? cores.grafite : cores.grafiteSuave} weight="bold" />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          value={valor}
          onChangeText={aoMudar}
          onFocus={() => {
            setFoco(true);
            aoFocar?.();
          }}
          onBlur={() => {
            setFoco(false);
            aoSair?.();
          }}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? ajuda}
          // Senha oculta por padrão (F01 CA7).
          secureTextEntry={senha && !mostrar}
          placeholderTextColor={cores.grafiteApagado}
          selectionColor={cores.grafite}
          maxFontSizeMultiplier={1.6}
          style={[styles.entrada, Icone ? styles.entradaComIcone : null, { color: cores.grafite }]}
          {...CONFIG_TIPO[tipo]}
          {...resto}
        />
        {senha ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => {
              setMostrar(!mostrar);
              aoMostrarSenha?.(!mostrar);
            }}
            hitSlop={4}
            style={styles.mostrar}>
            {mostrar ? (
              <EyeSlash size={22} color={cores.grafite} weight="bold" />
            ) : (
              <Eye size={22} color={cores.grafite} weight="bold" />
            )}
          </Pressable>
        ) : null}
      </View>
      {erro ? (
        <View style={styles.erro} accessibilityLiveRegion="polite">
          <WarningCircle size={18} color={cores.perigoTexto} weight="bold" />
          <Texto variante="legenda" cor="perigoTexto" style={styles.textoErro}>
            {erro}
          </Texto>
        </View>
      ) : ajuda ? (
        <Texto variante="legenda" accessible={false}>
          {ajuda}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { gap: espaco[2] },
  caixa: {
    minHeight: tamanho.toquePrincipal,
    borderRadius: raio.sm,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icone: { paddingLeft: espaco[4] - 2 },
  entradaComIcone: { paddingLeft: espaco[3] },
  entrada: {
    flex: 1,
    minHeight: tamanho.toquePrincipal - 4,
    paddingHorizontal: espaco[4] - 2,
    fontFamily: fontes.regular,
    fontSize: 16,
  },
  mostrar: {
    minHeight: tamanho.toqueMin,
    minWidth: tamanho.toqueMin,
    paddingHorizontal: espaco[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco[2] },
  textoErro: { flex: 1 },
});
