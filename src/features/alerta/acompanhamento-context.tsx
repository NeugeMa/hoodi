import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useGrade } from '@/features/grade/grade-context';
import { faixaAtual } from '@/features/grade/recorte';
import { registrarAlerta } from '@/features/historico/historico-repo';
import { usePet } from '@/features/pet/pet-context';
import { useTrajeto } from '@/features/trajeto/trajeto-context';

import { ESTADO_INICIAL, motivoDoNivel, processarPosicao, proximoTrechoDeRisco, type Alerta, type EstadoMotor } from './motor';
import { notificarAlerta, prepararNotificacoes } from './notificacoes';

export type PermissaoLocalizacao = 'desconhecida' | 'concedida' | 'negada';

type AcompanhamentoContexto = {
  permissao: PermissaoLocalizacao;
  /** Pede a localização (depois que a tela explicou o motivo, F02 CA2). */
  pedirLocalizacao: () => Promise<void>;
  /** Alerta na tela. Risco alto fica até a pessoa agir ou sair da área (F07 CA6). */
  alertaAtivo: Alerta | null;
  dispensarAlerta: () => void;
};

/** Risco médio some sozinho depois deste tempo; Risco alto não. */
const TEMPO_ALERTA_MEDIO_MS = 10_000;

const Contexto = createContext<AcompanhamentoContexto | null>(null);

/**
 * Acompanhamento da posição e alerta de risco (F05/F07).
 * Com o app aberto, segue o GPS, descobre a célula na grade salva, atualiza o Início
 * e, durante um trajeto, dispara o alerta quando o nível sobe: aviso na tela,
 * notificação (espelhada no relógio), vibração no hoodi Pet e registro no Histórico.
 * Posição e trajeto ficam só no aparelho.
 */
export function AcompanhamentoProvider({ children }: { children: ReactNode }) {
  const { grade } = useGrade();
  const { trajeto, atualizarPosicao, ajustarTrajeto } = useTrajeto();
  const { enviarNivel } = usePet();
  const [permissao, setPermissao] = useState<PermissaoLocalizacao>('desconhecida');
  const [alertaAtivo, setAlertaAtivo] = useState<Alerta | null>(null);

  // Valores mais recentes para o callback do GPS, sem reiniciar o acompanhamento a cada mudança.
  const gradeRef = useRef(grade);
  const trajetoRef = useRef(trajeto);
  const enviarNivelRef = useRef(enviarNivel);
  const motorRef = useRef<EstadoMotor>(ESTADO_INICIAL);
  const timerMedioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    gradeRef.current = grade;
    trajetoRef.current = trajeto;
    enviarNivelRef.current = enviarNivel;
  }, [grade, trajeto, enviarNivel]);

  // Sem trajeto não há alerta (F05 CA4): limpa o estado do motor quando o trajeto acaba.
  const emTrajeto = !!trajeto;
  useEffect(() => {
    if (!emTrajeto) motorRef.current = { ...motorRef.current, ultimoAlertaEm: null };
  }, [emTrajeto]);

  // Permissão já dada antes? (não pede sozinho: quem pede é a tela, depois de explicar).
  useEffect(() => {
    let ativo = true;
    Location.getForegroundPermissionsAsync()
      .then((r) => {
        if (ativo) setPermissao(r.granted ? 'concedida' : r.canAskAgain ? 'desconhecida' : 'negada');
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const pedirLocalizacao = useCallback(async () => {
    const r = await Location.requestForegroundPermissionsAsync();
    setPermissao(r.granted ? 'concedida' : 'negada');
    if (r.granted) prepararNotificacoes();
  }, []);

  const dispensarAlerta = useCallback(() => {
    if (timerMedioRef.current) clearTimeout(timerMedioRef.current);
    setAlertaAtivo(null);
  }, []);

  const disparar = useCallback(
    (alerta: Alerta) => {
      if (timerMedioRef.current) clearTimeout(timerMedioRef.current);
      setAlertaAtivo(alerta);
      AccessibilityInfo.announceForAccessibility(`${alerta.titulo}. ${alerta.texto}`);
      if (alerta.nivel === 'medio') timerMedioRef.current = setTimeout(() => setAlertaAtivo(null), TEMPO_ALERTA_MEDIO_MS);
      notificarAlerta(alerta).catch(() => {});
      enviarNivelRef.current(alerta.nivel).catch(() => {});
      registrarAlerta({ criadoEm: new Date().toISOString(), nivel: alerta.nivel, trecho: alerta.trecho }).catch(() => {});
      ajustarTrajeto((t) => ({ alertasRecebidos: t.alertasRecebidos + 1 }));
    },
    [ajustarTrajeto],
  );

  // Segue o GPS enquanto houver permissão.
  useEffect(() => {
    if (permissao !== 'concedida') return;
    let assinatura: Location.LocationSubscription | null = null;
    let ativo = true;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5_000 },
      (local) => {
        const g = gradeRef.current;
        if (!g) return; // Sem grade salva: o Mapa já avisa que os dados estão indisponíveis.
        const coordenada = { latitude: local.coords.latitude, longitude: local.coords.longitude };
        const faixa = faixaAtual(g.faixas);
        const t = trajetoRef.current;
        const r = processarPosicao(g, faixa, coordenada, motorRef.current, Date.now(), !!t);
        motorRef.current = r.estado;

        atualizarPosicao({
          nivel: r.nivel ?? 'sem-dado',
          local: r.celula?.referencia ?? '',
          motivo: r.nivel ? motivoDoNivel(r.nivel, faixa) : '',
          coordenada,
          celulaId: r.celula?.id ?? null,
        });

        if (t) {
          ajustarTrajeto(() => ({ proximoTrecho: proximoTrechoDeRisco(g, faixa, t.caminho, coordenada) }));
        }
        if (r.alerta) disparar(r.alerta);
        // Saiu da área de Risco alto: o alerta alto pode sair da tela (CA6).
        else if (r.nivel !== 'alto') {
          setAlertaAtivo((a) => (a?.nivel === 'alto' ? null : a));
        }
      },
    )
      .then((s) => {
        if (ativo) assinatura = s;
        else s.remove();
      })
      .catch(() => {});

    return () => {
      ativo = false;
      assinatura?.remove();
    };
  }, [permissao, atualizarPosicao, ajustarTrajeto, disparar]);

  const valor = useMemo(
    () => ({ permissao, pedirLocalizacao, alertaAtivo, dispensarAlerta }),
    [permissao, pedirLocalizacao, alertaAtivo, dispensarAlerta],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAcompanhamento() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAcompanhamento precisa estar dentro de <AcompanhamentoProvider>');
  return ctx;
}
