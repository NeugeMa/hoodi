/**
 * O app importa os ícones do código-fonte do Phosphor (`phosphor-react-native/src/icons/...`),
 * e esse código passa `className` para o <Svg>. Os tipos do react-native-svg instalado não
 * declaram essa propriedade, e o typecheck do CI (instalação limpa) quebra dentro da biblioteca.
 * Só tipo: nada muda no que roda no celular.
 */
import 'react-native-svg';

declare module 'react-native-svg/lib/typescript/elements/Svg' {
  interface SvgProps {
    className?: string;
  }
}
