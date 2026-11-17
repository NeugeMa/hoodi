/**
 * Cadastro em andamento: a pessoa preenche tudo de uma vez em Criar conta, mas a API só cria a conta
 * quando o link do e-mail é aberto (POST /v1/auth/confirmar-email com nome e senha).
 *
 * A senha fica SÓ na memória do app, até o link ser usado; nunca vai para o disco.
 * Se o app for fechado no meio, a tela Confirmar pede a senha de novo (o nome fica salvo).
 */

type CadastroPendente = { email: string; nome: string; senha: string };

let pendente: CadastroPendente | null = null;

export function guardarCadastro(dados: CadastroPendente) {
  pendente = { ...dados, email: dados.email.trim(), nome: dados.nome.trim() };
}

export function cadastroGuardado() {
  return pendente;
}

export function esquecerCadastro() {
  pendente = null;
}

/** Idade em anos completos na data de hoje. */
export function idadeEm(nascimento: Date, hoje = new Date()) {
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

export const IDADE_MINIMA = 18;
