import { Text, type TextProps } from 'react-native';

import { tipografia, type Cores, type VarianteTexto } from '@/theme/tokens';
import { useTema } from '@/theme/use-tema';

export type TextoProps = TextProps & {
  variante?: VarianteTexto;
  /** Token de cor. Padrão: grafite (legenda usa grafite-suave). */
  cor?: keyof Cores;
};

export function Texto({ variante = 'corpo', cor, style, ...rest }: TextoProps) {
  const { cores } = useTema();
  const corPadrao: keyof Cores = variante === 'legenda' ? 'grafiteSuave' : 'grafite';
  const titulo = variante === 'display' || variante === 'titulo';

  return (
    <Text
      accessibilityRole={titulo ? 'header' : undefined}
      maxFontSizeMultiplier={1.6}
      style={[tipografia[variante], { color: cores[cor ?? corPadrao] }, style]}
      {...rest}
    />
  );
}
