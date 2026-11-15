import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useConta } from '@/features/conta/conta-context';
import { useTrajeto } from '@/features/trajeto/trajeto-context';

import { listarConvitesPendentes, listarVinculos } from './contatos-api';
import type { ConvitePendente, Vinculo } from './tipos';

type ContatosContexto = {
  /** Quem recebe os MEUS pedidos de ajuda (vínculos aceitos em que sou titular). */
  meusContatos: Vinculo[];
  /** Convites que mandei e ainda não foram aceitos ("Aguardando confirmação"). */
  convitesPendentes: ConvitePendente[];
  /** De quem EU recebo pedidos de ajuda (vínculos aceitos em que sou contato). */
  souContatoDe: Vinculo[];
  /** Erro da última carga (ErroApi), para a tela mostrar o aviso certo. */
  erro: unknown;
  /** Já carregou pelo menos uma vez com sucesso. */
  carregado: boolean;
  recarregar: () => Promise<void>;
};

/** Dados de uma conta: ao trocar de conta (ou sair), os dados da anterior deixam de valer. */
type Dados = { dono: string; vinculos: Vinculo[]; convites: ConvitePendente[] };

const Contexto = createContext<ContatosContexto | null>(null);

async function buscar(dono: string): Promise<Dados> {
  const [vinculos, convites] = await Promise.all([listarVinculos(), listarConvitesPendentes()]);
  return { dono, vinculos: vinculos.filter((v) => v.estado === 'aceito'), convites };
}

/**
 * Contatos de segurança (F09), carregados da API quando a pessoa está logada.
 * Mantém o Início atualizado com a quantidade de contatos confirmados (dica do Pedir ajuda).
 */
export function ContatosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useConta();
  const { atualizarContatosConfirmados } = useTrajeto();
  const donoAtual = usuario?.id ?? null;
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<{ dono: string; erro: unknown } | null>(null);

  const recarregar = useCallback(async () => {
    if (!donoAtual) return;
    try {
      setDados(await buscar(donoAtual));
      setErro(null);
    } catch (e) {
      setErro({ dono: donoAtual, erro: e });
    }
  }, [donoAtual]);

  // Carrega ao entrar na conta. O estado só muda depois da resposta da API.
  useEffect(() => {
    if (!donoAtual) return;
    let ativo = true;
    buscar(donoAtual).then(
      (novos) => {
        if (!ativo) return;
        setDados(novos);
        setErro(null);
      },
      (e) => {
        if (ativo) setErro({ dono: donoAtual, erro: e });
      },
    );
    return () => {
      ativo = false;
    };
  }, [donoAtual]);

  const daConta = dados && dados.dono === donoAtual ? dados : null;
  const vinculos = useMemo(() => daConta?.vinculos ?? [], [daConta]);
  const convitesPendentes = useMemo(() => daConta?.convites ?? [], [daConta]);
  const meusContatos = useMemo(() => vinculos.filter((v) => v.papelDoSolicitante === 'titular'), [vinculos]);
  const souContatoDe = useMemo(() => vinculos.filter((v) => v.papelDoSolicitante === 'contato'), [vinculos]);
  const erroAtual = erro && erro.dono === donoAtual ? erro.erro : null;

  // Atualiza a dica do Pedir ajuda no Início (sistema externo a este contexto).
  useEffect(() => {
    atualizarContatosConfirmados(meusContatos.length);
  }, [meusContatos.length, atualizarContatosConfirmados]);

  const valor = useMemo<ContatosContexto>(
    () => ({
      meusContatos,
      convitesPendentes,
      souContatoDe,
      erro: erroAtual,
      carregado: !!daConta,
      recarregar,
    }),
    [meusContatos, convitesPendentes, souContatoDe, erroAtual, daConta, recarregar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useContatos() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useContatos precisa estar dentro de <ContatosProvider>');
  return ctx;
}
