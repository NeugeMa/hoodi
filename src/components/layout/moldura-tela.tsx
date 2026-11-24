import type { ReactNode } from 'react';

/** No celular o app ocupa a tela inteira. A versão web (moldura-tela.web.tsx) centraliza em telas largas. */
export function MolduraTela({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
