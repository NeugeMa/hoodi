import { useState } from 'react';

import { CalendarBlank } from '@/components/icones';

import { CampoTexto } from './campo-texto';

type Props = {
  rotulo: string;
  valor: Date | null;
  aoMudar: (data: Date) => void;
  erro?: string | null;
  ajuda?: string;
  inicial?: Date;
  maxima?: Date;
  minima?: Date;
  aoAbrir?: () => void;
};

export function formatarData(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Versão web (pré-visualização): o calendário nativo não existe no navegador, então digita dd/mm/aaaa. */
export function CampoData({ rotulo, valor, aoMudar, erro, ajuda, aoAbrir }: Props) {
  const [texto, setTexto] = useState(valor ? formatarData(valor) : '');
  return (
    <CampoTexto
      rotulo={rotulo}
      icone={CalendarBlank}
      valor={texto}
      aoFocar={aoAbrir}
      aoMudar={(t) => {
        setTexto(t);
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t.trim());
        if (m) aoMudar(new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
      }}
      erro={erro}
      ajuda={ajuda ?? 'Escreva no formato dd/mm/aaaa.'}
    />
  );
}
