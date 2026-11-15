import { getRandomBytes } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { NivelRisco } from '@/features/risco/nivel';
import { useTrajeto } from '@/features/trajeto/trajeto-context';

import {
  buscarPets,
  conectar,
  desconectar,
  enviarComando,
  gravarToken,
  observarBluetooth,
  observarDesconexao,
  pedirPermissoes,
  SUPORTE,
  type EstadoBluetooth,
  type PetEncontrado,
  type Suporte,
} from './pet-ble';
import { esquecerPetPareado, lerPetPareado, salvarPetPareado, type PetPareado } from './pet-repo';
import { COMANDO, deHex, NIVEL_PET, paraHex, TAMANHO_TOKEN } from './protocolo';

/** Quanto tempo a busca roda antes de dizer que não achou nenhum Pet (F06 CA7). */
const TEMPO_BUSCA_MS = 15_000;

type PetContexto = {
  suporte: Suporte;
  bluetooth: EstadoBluetooth;
  pareado: PetPareado | null;
  conectado: boolean;
  buscando: boolean;
  encontrados: PetEncontrado[];
  /** A última busca terminou sem encontrar nenhum Pet. */
  buscaVazia: boolean;
  /** Id do Pet que está sendo pareado agora. */
  pareandoId: string | null;
  erro: string | null;
  iniciarBusca: () => Promise<void>;
  pararBusca: () => void;
  parear: (pet: PetEncontrado) => Promise<boolean>;
  testarVibracao: () => Promise<void>;
  /** Para o alerta de risco (F07): carinha e vibração do nível. "Sem dado" nunca alerta. */
  enviarNivel: (nivel: NivelRisco) => Promise<void>;
  esquecer: () => Promise<void>;
};

const Contexto = createContext<PetContexto | null>(null);

/**
 * Estado do hoodi Pet (F06): Bluetooth, busca, pareamento e comandos.
 * Mantém o Início em dia pelos canais de aviso (atualizarCanais).
 */
export function PetProvider({ children }: { children: ReactNode }) {
  const { atualizarCanais } = useTrajeto();
  const [bluetooth, setBluetooth] = useState<EstadoBluetooth>('desconhecido');
  const [pareado, setPareado] = useState<PetPareado | null>(null);
  const [conectado, setConectado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [encontrados, setEncontrados] = useState<PetEncontrado[]>([]);
  const [buscaVazia, setBuscaVazia] = useState(false);
  const [pareandoId, setPareandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const pararRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantosRef = useRef(0);
  const pararObservarRef = useRef<(() => void) | null>(null);

  /** Atualiza o estado local e os canais do Início juntos. */
  const marcar = useCallback(
    (estaConectado: boolean, pet: PetPareado | null) => {
      setConectado(estaConectado);
      setPareado(pet);
      atualizarCanais({ pet: estaConectado, petPareado: !!pet });
    },
    [atualizarCanais],
  );

  /** Liga o aviso de queda de conexão (F06 CA8). */
  const vigiar = useCallback(
    (pet: PetPareado) => {
      pararObservarRef.current?.();
      pararObservarRef.current = observarDesconexao(pet.dispositivoId, () => marcar(false, pet));
    },
    [marcar],
  );

  // Ao abrir o app: lembra do Pet pareado e tenta reconectar.
  useEffect(() => {
    let ativo = true;
    lerPetPareado().then(async (pet) => {
      if (!ativo || !pet) return;
      marcar(false, pet);
      if (SUPORTE !== 'ok') return;
      try {
        await conectar(pet.dispositivoId);
        if (ativo) {
          marcar(true, pet);
          vigiar(pet);
        }
      } catch {
        // Pet longe ou desligado: fica como pareado e desconectado.
      }
    });
    return () => {
      ativo = false;
    };
  }, [marcar, vigiar]);

  // Bluetooth ligado ou desligado (F06 CA6).
  useEffect(() => observarBluetooth(setBluetooth), []);

  const pararBusca = useCallback(() => {
    pararRef.current?.();
    pararRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    setBuscando(false);
  }, []);

  const iniciarBusca = useCallback(async () => {
    setErro(null);
    setBuscaVazia(false);
    if (SUPORTE !== 'ok') return;
    if (!(await pedirPermissoes())) {
      setBluetooth('sem-permissao');
      return;
    }
    if (bluetooth !== 'ligado') return;
    pararBusca();
    quantosRef.current = 0;
    setEncontrados([]);
    setBuscando(true);
    pararRef.current = buscarPets(
      (pet) => {
        setEncontrados((lista) => {
          const sem = lista.filter((p) => p.id !== pet.id);
          quantosRef.current = sem.length + 1;
          return [...sem, pet].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
        });
      },
      () => {
        setErro('A busca parou. Tente de novo.');
        pararBusca();
      },
    );
    timerRef.current = setTimeout(() => {
      pararBusca();
      setBuscaVazia(quantosRef.current === 0);
    }, TEMPO_BUSCA_MS);
  }, [bluetooth, pararBusca]);

  // Para a busca se o provider for desmontado.
  useEffect(() => pararBusca, [pararBusca]);

  const parear = useCallback(
    async (pet: PetEncontrado) => {
      pararBusca();
      setErro(null);
      setPareandoId(pet.id);
      try {
        await conectar(pet.id);
        const token = getRandomBytes(TAMANHO_TOKEN);
        await gravarToken(pet.id, token);
        const novo: PetPareado = {
          dispositivoId: pet.id,
          nome: pet.nome,
          tokenHex: paraHex(token),
          pareadoEm: new Date().toISOString(),
        };
        await salvarPetPareado(novo);
        marcar(true, novo);
        vigiar(novo);
        return true;
      } catch {
        await desconectar(pet.id);
        setErro('Não deu para parear. Aproxime o Pet e tente de novo.');
        return false;
      } finally {
        setPareandoId(null);
      }
    },
    [marcar, pararBusca, vigiar],
  );

  const comando = useCallback(
    async (cmd: number, arg = 0) => {
      if (!pareado || !conectado) return;
      try {
        await enviarComando(pareado.dispositivoId, deHex(pareado.tokenHex), cmd, arg);
      } catch {
        setErro('O Hoodi Pet não respondeu. Veja se ele está ligado e perto.');
      }
    },
    [pareado, conectado],
  );

  const testarVibracao = useCallback(() => comando(COMANDO.teste), [comando]);

  const enviarNivel = useCallback(
    async (nivel: NivelRisco) => {
      if (nivel === 'sem-dado') return;
      const arg = nivel === 'tranquila' ? NIVEL_PET.tranquila : nivel === 'medio' ? NIVEL_PET.atenta : NIVEL_PET.preocupada;
      await comando(COMANDO.alerta, arg);
    },
    [comando],
  );

  const esquecer = useCallback(async () => {
    if (pareado) {
      await comando(COMANDO.esquecer);
      pararObservarRef.current?.();
      await desconectar(pareado.dispositivoId);
    }
    await esquecerPetPareado();
    marcar(false, null);
  }, [comando, marcar, pareado]);

  const valor = useMemo<PetContexto>(
    () => ({
      suporte: SUPORTE,
      bluetooth,
      pareado,
      conectado,
      buscando,
      encontrados,
      buscaVazia,
      pareandoId,
      erro,
      iniciarBusca,
      pararBusca,
      parear,
      testarVibracao,
      enviarNivel,
      esquecer,
    }),
    [bluetooth, pareado, conectado, buscando, encontrados, buscaVazia, pareandoId, erro, iniciarBusca, pararBusca, parear, testarVibracao, enviarNivel, esquecer],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePet() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('usePet precisa estar dentro de <PetProvider>');
  return ctx;
}
