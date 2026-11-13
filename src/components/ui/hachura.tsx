import { StyleSheet } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

type Props = {
  fundo: string;
  traco: string;
  /** Id único por instância; o Pattern do SVG é referenciado por id. */
  id: string;
};

/** Preenchimento em hachura diagonal, usado para "Sem dado" (régua, mapa, rotas). */
export function Hachura({ fundo, traco, id }: Props) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1={0} y1={0} x2={0} y2={6} stroke={traco} strokeWidth={2} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={fundo} />
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
