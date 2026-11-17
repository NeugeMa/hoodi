/**
 * Aviso de "o histórico mudou" (alerta novo ou histórico apagado), para a aba Histórico
 * se atualizar mesmo aberta. Vale para a versão nativa (SQLite) e a web (localStorage).
 */
const ouvintes = new Set<() => void>();

export function ouvirHistorico(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

export function avisarHistoricoMudou() {
  ouvintes.forEach((fn) => fn());
}
