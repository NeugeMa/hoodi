import type { Carinha } from '@/features/pet/carinhas';

/**
 * Carinha do hoodi Pet nas telas de conta (Entrar, Criar conta, Confirmar), sempre com a mesma regra:
 * tranquila parada, atenta num campo, olhos fechados enquanto a senha é digitada,
 * confusa num erro e procurando enquanto espera a API.
 */
export function carinhaDaConta({
  enviando,
  erro,
  campo,
  mostrandoSenha = false,
}: {
  enviando: boolean;
  erro: boolean;
  /** Campo com foco agora; 'senha' fecha os olhos. */
  campo: string | null;
  mostrandoSenha?: boolean;
}): Carinha {
  if (enviando) return 'procurando';
  if (erro) return 'confusa';
  if (campo === 'senha' && !mostrandoSenha) return 'timida';
  if (campo) return 'atenta';
  return 'tranquila';
}
