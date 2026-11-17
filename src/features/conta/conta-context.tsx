import { randomUUID } from 'expo-crypto';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

import { excluirConta as excluirContaNaApi, login, sairNoServidor } from './auth-api';
import { carregarSessao, definirSessao, ouvirSessao } from './sessao';
import { sessaoDeTokens, type UsuarioResumo } from './tipos';

/**
 * Conta da pessoa (F01): quem está logado e as ações de entrar e sair.
 * A navegação usa `estado` para mostrar as telas de conta ou o app (Stack.Protected no _layout).
 */

type EstadoConta = 'carregando' | 'deslogado' | 'logado';

type ContaValor = {
  estado: EstadoConta;
  usuario: UsuarioResumo | null;
  /** Lança ErroApi: 401 = e-mail ou senha incorretos (ou conta ainda não confirmada). */
  entrar: (email: string, senha: string) => Promise<void>;
  /** Sai mesmo sem internet: o servidor é avisado quando dá, e o aparelho esquece a sessão sempre. */
  sair: () => Promise<void>;
  /** Exclui a conta no servidor (confirma a senha) e esquece a sessão. Lança ErroApi se não excluir. */
  excluirConta: (senha: string) => Promise<void>;
};

const ContaContext = createContext<ContaValor | null>(null);

export async function idDaInstalacao() {
  let id = await lerPreferencia(PREF.instalacaoId);
  if (!id) {
    id = randomUUID();
    await salvarPreferencia(PREF.instalacaoId, id);
  }
  return id;
}

export function ContaProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoConta>('carregando');
  const [usuario, setUsuario] = useState<UsuarioResumo | null>(null);

  useEffect(() => {
    const parar = ouvirSessao((s) => {
      setUsuario(s?.usuario ?? null);
      setEstado(s ? 'logado' : 'deslogado');
    });
    carregarSessao().then((s) => {
      setUsuario(s?.usuario ?? null);
      setEstado(s ? 'logado' : 'deslogado');
    });
    return parar;
  }, []);

  async function entrar(email: string, senha: string) {
    const tokens = await login(email, senha);
    await salvarPreferencia(PREF.ultimoEmail, email.trim());
    await definirSessao(sessaoDeTokens(tokens));
  }

  async function sair() {
    try {
      await sairNoServidor(await idDaInstalacao());
    } catch {
      // Sem internet ou sessão já vencida: o aparelho esquece a sessão do mesmo jeito.
    }
    await definirSessao(null);
  }

  async function excluirConta(senha: string) {
    await excluirContaNaApi(senha);
    await salvarPreferencia(PREF.ultimoEmail, '');
    await definirSessao(null);
  }

  return <ContaContext.Provider value={{ estado, usuario, entrar, sair, excluirConta }}>{children}</ContaContext.Provider>;
}

export function useConta() {
  const valor = useContext(ContaContext);
  if (!valor) throw new Error('useConta precisa estar dentro de <ContaProvider>');
  return valor;
}
