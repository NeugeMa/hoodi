import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { notificarAviso } from '@/features/alerta/notificacoes';
import type { NivelRisco } from '@/features/risco/nivel';
import { useTrajeto } from '@/features/trajeto/trajeto-context';

import {
  buscarPets,
  conectar,
  desconectar,
  enviarComando,
  garantirPareamento,
  observarBluetooth,
  observarDesconexao,
  observarEventos,
  pedirPermissoes,
  SUPORTE,
  type EstadoBluetooth,
  type PetEncontrado,
  type Suporte,
} from './pet-ble';
import { esquecerPetPareado, lerPetPareado, salvarPetPareado, type PetPareado } from './pet-repo';
import { EXPRESSAO, montarEstado, montarSimples, NIVEL_PET, PADRAO, Sequencia, TIPO, type EventoPet } from './protocolo';

/** Quanto tempo a busca roda antes de dizer que não achou nenhum Pet (F06 CA7). */
const TEMPO_BUSCA_MS = 15_000;
/** Intervalo entre as carinhas no Testar vibração (dá tempo de sentir cada padrão). */
const INTERVALO_TESTE_MS = 1_800;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  /**
   * Carinha do nível no Pet (F07). Com vibrar (padrão), vibra no padrão do nível: é o alerta.
   * Sem vibrar, só troca a carinha (ex.: saiu da área de risco). "Sem dado" mostra "?" e nunca vibra.
   */
  enviarNivel: (nivel: NivelRisco, opcoes?: { vibrar?: boolean }) => Promise<void>;
  /** Fim do trajeto: o Pet mostra a carinha dormindo. */
  fimTrajeto: () => Promise<void>;
  /** Clique ou pressão longa no botão do Pet. Devolve a função que para de ouvir. */
  aoEvento: (callback: (evento: EventoPet) => void) => () => void;
  esquecer: () => Promise<void>;
};

const Contexto = createContext<PetContexto | null>(null);

/**
 * Estado do hoodi Pet (F06): Bluetooth, busca, pareamento e comandos.
 * Mantém o Início em dia pelos canais de aviso (atualizarCanais).
 */
export function PetProvider({ children }: { children: ReactNode }) {
  const { atualizarCanais, trajeto } = useTrajeto();
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
  const pararEventosRef = useRef<(() => void) | null>(null);
  const ouvintesRef = useRef(new Set<(evento: EventoPet) => void>());
  /** O Pet zera a sequência a cada conexão: o app também (protocolo v1). */
  const sequenciaRef = useRef(new Sequencia());
  /** Último nível mostrado, para voltar a ele depois do Testar vibração. */
  const ultimoNivelRef = useRef<NivelRisco | null>(null);
  /** Pet que o app quer manter conectado (nulo depois de Desconectar). */
  const petAtivoRef = useRef<PetPareado | null>(null);
  /** Próxima tentativa de reconexão (F06 CA8). */
  const reconexaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconectarRef = useRef<(pet: PetPareado, tentativa: number) => void>(() => {});
  const emTrajetoRef = useRef(false);
  useEffect(() => {
    emTrajetoRef.current = !!trajeto;
  }, [trajeto]);

  /** Atualiza o estado local e os canais do Início juntos. */
  const marcar = useCallback(
    (estaConectado: boolean, pet: PetPareado | null) => {
      petAtivoRef.current = pet;
      setConectado(estaConectado);
      setPareado(pet);
      atualizarCanais({ pet: estaConectado, petPareado: !!pet });
    },
    [atualizarCanais],
  );

  /** Liga o aviso de queda de conexão (F06 CA8) e os eventos do botão do Pet. */
  const vigiar = useCallback(
    (pet: PetPareado) => {
      sequenciaRef.current.reiniciar();
      pararObservarRef.current?.();
      pararEventosRef.current?.();
      pararEventosRef.current = observarEventos(pet.dispositivoId, (evento) => {
        ouvintesRef.current.forEach((ouvinte) => ouvinte(evento));
      });
      pararObservarRef.current = observarDesconexao(pet.dispositivoId, () => {
        pararEventosRef.current?.();
        pararEventosRef.current = null;
        marcar(false, pet);
        // F06 CA8: no meio de um trajeto, avisa no celular (e no relógio) que o Pet caiu.
        // Os alertas continuam na tela, na notificação e no relógio enquanto o app tenta reconectar.
        if (emTrajetoRef.current) {
          notificarAviso(
            'Hoodi Pet desconectado',
            'Os alertas continuam no celular e no relógio. Tentando reconectar o Pet.',
          ).catch(() => {});
        }
        reconectarRef.current(pet, 0);
      });
    },
    [marcar],
  );

  /**
   * Reconexão automática (F06 CA8): tenta de novo em 3 s, 6 s, 12 s, 24 s e depois a cada 30 s,
   * enquanto o Pet continuar pareado. Ao voltar, reenvia o último nível SEM vibrar (protocolo v1).
   */
  useEffect(() => {
    reconectarRef.current = (pet, tentativa) => {
      if (reconexaoRef.current) clearTimeout(reconexaoRef.current);
      if (SUPORTE !== 'ok') return;
      const espera = Math.min(30_000, 3_000 * 2 ** tentativa);
      reconexaoRef.current = setTimeout(async () => {
        reconexaoRef.current = null;
        if (petAtivoRef.current?.dispositivoId !== pet.dispositivoId) return; // desconectado de propósito
        try {
          await conectar(pet.dispositivoId);
          await garantirPareamento(pet.dispositivoId);
          marcar(true, pet);
          vigiar(pet);
          const nivel = ultimoNivelRef.current;
          if (nivel) {
            const seq = sequenciaRef.current.proxima();
            const quadro =
              nivel === 'sem-dado'
                ? montarEstado(seq, null, PADRAO.nenhum, EXPRESSAO.semDado)
                : montarEstado(seq, NIVEL_PET[nivel].nivel, PADRAO.nenhum, NIVEL_PET[nivel].expressao);
            await enviarComando(pet.dispositivoId, quadro).catch(() => {});
          }
        } catch {
          reconectarRef.current(pet, tentativa + 1);
        }
      }, espera);
    };
    return () => {
      if (reconexaoRef.current) clearTimeout(reconexaoRef.current);
    };
  }, [marcar, vigiar]);

  // Ao abrir o app: lembra do Pet pareado e tenta reconectar.
  useEffect(() => {
    let ativo = true;
    lerPetPareado().then(async (pet) => {
      if (!ativo || !pet) return;
      marcar(false, pet);
      if (SUPORTE !== 'ok') return;
      try {
        await conectar(pet.dispositivoId);
        await garantirPareamento(pet.dispositivoId); // já pareado: passa direto
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
        // O celular pede o código que aparece na tela do Pet (pareamento do sistema, CA9).
        await garantirPareamento(pet.id);
        const novo: PetPareado = {
          dispositivoId: pet.id,
          nome: pet.nome,
          tokenHex: '', // não usado no protocolo v1 (ver pet-repo.ts)
          pareadoEm: new Date().toISOString(),
        };
        await salvarPetPareado(novo);
        marcar(true, novo);
        vigiar(novo);
        return true;
      } catch {
        await desconectar(pet.id);
        setErro(
          'Não deu para parear. Confira o código que aparece no Pet. Se ele já estava pareado com outro celular, segure o botão enquanto liga o Pet e tente de novo.',
        );
        return false;
      } finally {
        setPareandoId(null);
      }
    },
    [marcar, pararBusca, vigiar],
  );

  /** Monta o comando com a próxima sequência e escreve. Sem Pet conectado, não faz nada. */
  const comando = useCallback(
    async (montar: (sequencia: number) => Uint8Array) => {
      if (!pareado || !conectado) return;
      try {
        await enviarComando(pareado.dispositivoId, montar(sequenciaRef.current.proxima()));
      } catch {
        setErro('O Hoodi Pet não respondeu. Veja se ele está ligado e perto.');
      }
    },
    [pareado, conectado],
  );

  const enviarNivel = useCallback(
    async (nivel: NivelRisco, opcoes?: { vibrar?: boolean }) => {
      ultimoNivelRef.current = nivel;
      if (nivel === 'sem-dado') {
        // "?" na tela, sem vibrar (F07 CA5).
        await comando((s) => montarEstado(s, null, PADRAO.nenhum, EXPRESSAO.semDado));
        return;
      }
      const p = NIVEL_PET[nivel];
      const vibrar = opcoes?.vibrar ?? true;
      await comando((s) => montarEstado(s, p.nivel, vibrar ? p.padrao : PADRAO.nenhum, p.expressao));
    },
    [comando],
  );

  /** Teste (F06 CA5): passa pelas três carinhas vibrando no padrão de cada uma e volta ao nível atual. */
  const testarVibracao = useCallback(async () => {
    for (const nivel of ['tranquila', 'medio', 'alto'] as const) {
      const p = NIVEL_PET[nivel];
      await comando((s) => montarEstado(s, p.nivel, p.padrao, p.expressao));
      await esperar(INTERVALO_TESTE_MS);
    }
    const atual = ultimoNivelRef.current;
    if (atual) await enviarNivel(atual, { vibrar: false });
    // Fora de trajeto o Pet fica dormindo. Fim do trajeto (e não Estado) para o Pet não achar
    // que há trajeto ativo e avisar a desconexão do celular depois.
    else await comando((s) => montarSimples(TIPO.fimTrajeto, s));
  }, [comando, enviarNivel]);

  const fimTrajeto = useCallback(async () => {
    ultimoNivelRef.current = null;
    await comando((s) => montarSimples(TIPO.fimTrajeto, s));
  }, [comando]);

  const aoEvento = useCallback((callback: (evento: EventoPet) => void) => {
    ouvintesRef.current.add(callback);
    return () => {
      ouvintesRef.current.delete(callback);
    };
  }, []);

  /**
   * No protocolo v1 o Pet guarda o pareamento do sistema; ele só aceita outro celular
   * quando alguém segura o botão enquanto liga. Aqui o app esquece o Pet do lado dele.
   */
  const esquecer = useCallback(async () => {
    petAtivoRef.current = null;
    if (reconexaoRef.current) clearTimeout(reconexaoRef.current);
    reconexaoRef.current = null;
    if (pareado) {
      pararObservarRef.current?.();
      pararEventosRef.current?.();
      pararEventosRef.current = null;
      await desconectar(pareado.dispositivoId);
    }
    await esquecerPetPareado();
    marcar(false, null);
  }, [marcar, pareado]);

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
      fimTrajeto,
      aoEvento,
      esquecer,
    }),
    [bluetooth, pareado, conectado, buscando, encontrados, buscaVazia, pareandoId, erro, iniciarBusca, pararBusca, parear, testarVibracao, enviarNivel, fimTrajeto, aoEvento, esquecer],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePet() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('usePet precisa estar dentro de <PetProvider>');
  return ctx;
}
