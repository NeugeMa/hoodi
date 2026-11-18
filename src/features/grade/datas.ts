const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

/** "3 nov." (cabeçalho do Mapa). */
export function diaMes(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "3 nov. 2026" (detalhe da célula). */
export function diaMesAno(iso: string) {
  return `${diaMes(iso)} ${new Date(iso).getFullYear()}`;
}

/** "3 de novembro" (avisos em frase). */
export function diaPorExtenso(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

/** "jan. a set. 2026": período dos registros ("2026-01-01" a "2026-09-30"), lido sem fuso para não mudar o dia. */
export function periodoMeses(inicio: string, fim: string) {
  const [ai, mi] = inicio.split('-').map(Number);
  const [af, mf] = fim.split('-').map(Number);
  if (!ai || !mi || !af || !mf) return '';
  const de = ai === af ? MESES[mi - 1] : `${MESES[mi - 1]} ${ai}`;
  return `${de} a ${MESES[mf - 1]} ${af}`;
}
