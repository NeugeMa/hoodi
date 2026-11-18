import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { lerPreferencia, PREF, salvarPreferencia } from '@/features/preferencias/preferencias-repo';

import type { Coordenada } from '@/features/grade/tipos';

import type { Canais, PosicaoAtual, Trajeto } from './tipos';

type TrajetoContexto = {
  /** Nulo enquanto a posição ainda não foi obtida (GPS + grade de risco). */
  posicao: PosicaoAtual | null;
  /** Nulo quando não há trajeto em andamento. */
  trajeto: Trajeto | null;
  canais: Canais;
  /** Caminho de uma rota só para olhar no Mapa, antes de iniciar. Só em memória; nunca é salvo. */
  previa: Coordenada[] | null;
  definirPrevia: (caminho: Coordenada[] | null) => void;
  /** Contatos que confirmaram com SIM e recebem o pedido de ajuda (F09). */
  contatosConfirmados: number;

  // Pontos de entrada para as integrações. Quem tiver o dado chama a função.
  // Todas são estáveis (mesma referência entre renderizações).
  /** GPS + grade de risco (F03/F07). */
  atualizarPosicao: (posicao: PosicaoAtual | null) => void;
  /** Comparar rotas (F04 CA6) inicia o trajeto. */
  iniciarTrajeto: (trajeto: Trajeto) => void;
  /** Acompanhamento do trajeto atualiza tempo, alertas e próximo trecho (F05). */
  atualizarTrajeto: (trajeto: Trajeto) => void;
  /** Muda só alguns campos do trajeto em andamento (alertas, próximo trecho...). */
  ajustarTrajeto: (mudar: (atual: Trajeto) => Partial<Trajeto>) => void;
  /** F05 CA4: para o acompanhamento e os canais deixam de receber alertas. */
  encerrarTrajeto: () => void;
  /** Bluetooth com o hoodi Pet (F06). */
  atualizarCanais: (canais: Partial<Canais>) => void;
  /** Orientação do relógio (F06): a pessoa confirmou ou desfez a configuração. Fica salvo. */
  definirRelogio: (configurado: boolean) => Promise<void>;
  /** Contatos de segurança (F09). */
  atualizarContatosConfirmados: (quantidade: number) => void;
};

const CANAIS_INICIAIS: Canais = { relogio: false, pet: false, petPareado: false };

const Contexto = createContext<TrajetoContexto | null>(null);

/**
 * Estado do trajeto compartilhado entre as telas (Início, Mapa, Comparar rotas...).
 * Começa vazio, como no primeiro uso do app: sem posição, sem trajeto e sem canais.
 * Os dados reais entram pelas funções `atualizar...`, sem mudar as telas.
 */
export function TrajetoProvider({ children }: { children: ReactNode }) {
  const [posicao, setPosicao] = useState<PosicaoAtual | null>(null);
  const [trajeto, setTrajeto] = useState<Trajeto | null>(null);
  const [previa, setPrevia] = useState<Coordenada[] | null>(null);
  const [canais, setCanais] = useState<Canais>(CANAIS_INICIAIS);
  const [contatosConfirmados, setContatosConfirmados] = useState(0);

  // O relógio não é detectável pelo app: vale a confirmação da pessoa, salva no aparelho.
  useEffect(() => {
    let ativo = true;
    lerPreferencia(PREF.relogioConfigurado).then((v) => {
      if (ativo) setCanais((c) => ({ ...c, relogio: v === '1' }));
    });
    return () => {
      ativo = false;
    };
  }, []);

  const encerrarTrajeto = useCallback(() => setTrajeto(null), []);
  const ajustarTrajeto = useCallback(
    (mudar: (atual: Trajeto) => Partial<Trajeto>) => setTrajeto((t) => (t ? { ...t, ...mudar(t) } : t)),
    [],
  );
  const atualizarCanais = useCallback(
    (parcial: Partial<Canais>) => setCanais((atual) => ({ ...atual, ...parcial })),
    [],
  );
  const definirRelogio = useCallback(async (configurado: boolean) => {
    await salvarPreferencia(PREF.relogioConfigurado, configurado ? '1' : '0');
    setCanais((c) => ({ ...c, relogio: configurado }));
  }, []);

  const valor = useMemo<TrajetoContexto>(
    () => ({
      posicao,
      trajeto,
      canais,
      previa,
      definirPrevia: setPrevia,
      contatosConfirmados,
      atualizarPosicao: setPosicao,
      iniciarTrajeto: (t) => {
        setPrevia(null);
        setTrajeto(t);
      },
      atualizarTrajeto: setTrajeto,
      ajustarTrajeto,
      encerrarTrajeto,
      atualizarCanais,
      definirRelogio,
      atualizarContatosConfirmados: setContatosConfirmados,
    }),
    [posicao, trajeto, canais, previa, contatosConfirmados, ajustarTrajeto, encerrarTrajeto, atualizarCanais, definirRelogio],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTrajeto() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useTrajeto precisa estar dentro de <TrajetoProvider>');
  return ctx;
}
