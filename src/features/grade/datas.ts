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
