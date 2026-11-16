import { avisarHistoricoMudou } from './historico-eventos';
import type { AlertaSalvo, NovoAlerta } from './tipos';

/**
 * Versão web do histórico, só para a pré-visualização no navegador (localStorage).
 * No celular o histórico fica no SQLite (historico-repo.ts).
 */

const CHAVE = 'hoodi:alertas';

function ler(): AlertaSalvo[] {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(CHAVE) ?? '[]') as AlertaSalvo[];
  } catch {
    return [];
  }
}

function gravar(alertas: AlertaSalvo[]) {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(alertas));
  } catch {
    // Sem armazenamento disponível.
  }
}

export async function listarAlertas(): Promise<AlertaSalvo[]> {
  return ler().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function registrarAlerta(alerta: NovoAlerta) {
  const atuais = ler();
  const id = atuais.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  gravar([...atuais, { ...alerta, id }]);
  avisarHistoricoMudou();
}

export async function apagarHistorico() {
  gravar([]);
  avisarHistoricoMudou();
}
