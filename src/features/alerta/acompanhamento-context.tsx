import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';

import { FIAP_PAULISTA, pontoNoCaminho } from '@/features/demo/dados-demo';
import { MODO_DEMO } from '@/features/demo/modo-demo';
import { useGrade } from '@/features/grade/grade-context';
import { faixaAtual } from '@/features/grade/recorte';
import { preencherReferencia } from '@/features/grade/referencia';
import type { Coordenada } from '@/features/grade/tipos';
import { registrarAlerta } from '@/features/historico/historico-repo';
import { usePet } from '@/features/pet/pet-context';
import { horarioPermite } from '@/features/preferencias/alertas';
import { usePreferencias } from '@/features/preferencias/preferencias-context';
import type { NivelRisco } from '@/features/risco/nivel';
import { useTrajeto } from '@/features/trajeto/trajeto-context';

import {
  avaliarAvisoAntecipado,
  ESTADO_INICIAL,
  motivoDoNivel,
  processarPosicao,
  proximoTrechoDeRisco,
  type Alerta,
  type EstadoMotor,
} from './motor';
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

/** Risco médio e aviso antecipado somem sozinhos depois deste tempo; Risco alto não. */
const TEMPO_ALERTA_MEDIO_MS = 10_000;
/**
 * Reforço do alerta: depois de vibrar o Pet, espera o "vi" (um clique no botão do Pet).
 * Sem clique nesse tempo, o Pet vibra de novo e o celular também. Uma vez só por alerta.
 */
const TEMPO_CONFIRMACAO_MS = 20_000;
/** Mesmo padrão do canal de notificação do alerta. */
const VIBRACAO_CELULAR = [0, 400, 200, 400];
/** Modo demonstração: a caminhada simulada anda isto a cada passo (1,5 s): a rota inteira em ~1 min de vídeo. */
const PASSO_DEMO_M = 40;
const INTERVALO_DEMO_MS = 1_500;

const Contexto = createContext<AcompanhamentoContexto | null>(null);

/**
 * Acompanhamento da posição e alerta de risco (F05/F07).
 * Com o app aberto, segue o GPS, descobre a célula na grade salva, atualiza o Início
 * e dispara o alerta quando o nível sobe, com ou sem trajeto (alerta ambiente): aviso na tela,
 * notificação (espelhada no relógio), vibração no Hoodi Pet e registro no Histórico.
 *
 * Como o alerta chega a cada canal:
 * - Pet conectado: o Pet vibra e mostra a carinha; espera o "vi" (clique no Pet) por 20 s;
 *   sem clique, o Pet vibra de novo e o celular também (uma vez).
 * - Pet desconectado: o celular vibra direto.
 * - "Avisar no celular também" (Perfil): o celular vibra junto com o Pet em todo alerta.
 * - Consentimento revogado (F08 CA4) ou fora do horário escolhido: não alerta.
 * Posição e trajeto ficam só no aparelho.
 */
export function AcompanhamentoProvider({ children }: { children: ReactNode }) {
  const { grade } = useGrade();
  const { trajeto, atualizarPosicao, ajustarTrajeto } = useTrajeto();
  const { enviarNivel, fimTrajeto, aoEvento, conectado: petConectado } = usePet();
  const { alertas: preferencias, consentimentoEm } = usePreferencias();
  // Modo demonstração: posição simulada, sem pedir o GPS.
  const [permissao, setPermissao] = useState<PermissaoLocalizacao>(MODO_DEMO ? 'concedida' : 'desconhecida');
  const [alertaAtivo, setAlertaAtivo] = useState<Alerta | null>(null);

  // Valores mais recentes para o callback do GPS, sem reiniciar o acompanhamento a cada mudança.
  const gradeRef = useRef(grade);
  const trajetoRef = useRef(trajeto);
  const enviarNivelRef = useRef(enviarNivel);
  const fimTrajetoRef = useRef(fimTrajeto);
  const petConectadoRef = useRef(petConectado);
  const preferenciasRef = useRef(preferencias);
  const consentimentoRef = useRef(consentimentoEm);
  const motorRef = useRef<EstadoMotor>(ESTADO_INICIAL);
  const timerMedioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Último nível mandado ao Pet, para só mandar de novo quando mudar. */
  const nivelNoPetRef = useRef<NivelRisco | null>(null);
  /** Alerta esperando o "vi" do Pet (reforço). */
  const confirmacaoRef = useRef<{ nivel: 'medio' | 'alto'; timer: ReturnType<typeof setTimeout> } | null>(null);
  /** Trechos já avisados com antecedência neste trajeto (um aviso por trecho). */
  const avisadosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    gradeRef.current = grade;
    trajetoRef.current = trajeto;
    enviarNivelRef.current = enviarNivel;
    fimTrajetoRef.current = fimTrajeto;
    petConectadoRef.current = petConectado;
    preferenciasRef.current = preferencias;
    consentimentoRef.current = consentimentoEm;
  }, [grade, trajeto, enviarNivel, fimTrajeto, petConectado, preferencias, consentimentoEm]);

  const cancelarConfirmacao = useCallback(() => {
    if (confirmacaoRef.current) clearTimeout(confirmacaoRef.current.timer);
    confirmacaoRef.current = null;
  }, []);

  /** Espera o clique no Pet; sem ele, vibra o Pet de novo e o celular (uma vez). */
  const aguardarConfirmacao = useCallback(
    (nivel: 'medio' | 'alto') => {
      cancelarConfirmacao();
      const timer = setTimeout(() => {
        confirmacaoRef.current = null;
        enviarNivelRef.current(nivel).catch(() => {});
        Vibration.vibrate(VIBRACAO_CELULAR);
      }, TEMPO_CONFIRMACAO_MS);
      confirmacaoRef.current = { nivel, timer };
    },
    [cancelarConfirmacao],
  );

  // Clique no botão do Pet durante a espera = "vi o aviso": cancela o reforço.
  // Fora da espera, o clique só acende a tela do Pet (o próprio Pet faz isso).
  useEffect(
    () =>
      aoEvento((evento) => {
        if (evento.tipo === 'clique' && confirmacaoRef.current) cancelarConfirmacao();
      }),
    [aoEvento, cancelarConfirmacao],
  );

  // Fim do trajeto (F05 CA4): limpa os avisos do trajeto e o Pet volta a dormir.
  // O alerta ambiente continua, então o nível conhecido do motor é mantido.
  const emTrajeto = !!trajeto;
  const estavaEmTrajetoRef = useRef(false);
  useEffect(() => {
    if (!emTrajeto) {
      cancelarConfirmacao();
      nivelNoPetRef.current = null;
      avisadosRef.current = new Set();
      if (estavaEmTrajetoRef.current) fimTrajetoRef.current().catch(() => {});
    }
    estavaEmTrajetoRef.current = emTrajeto;
  }, [emTrajeto, cancelarConfirmacao]);

  useEffect(() => cancelarConfirmacao, [cancelarConfirmacao]);

  // Permissão já dada antes? (não pede sozinho: quem pede é a tela, depois de explicar).
  useEffect(() => {
    if (MODO_DEMO) return;
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
    if (MODO_DEMO) {
      setPermissao('concedida');
      return;
    }
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
      // Consentimento revogado (F08 CA4) ou fora do horário escolhido no Perfil: não alerta.
      if (!consentimentoRef.current || !horarioPermite(preferenciasRef.current.horario)) return;

      if (timerMedioRef.current) clearTimeout(timerMedioRef.current);
      setAlertaAtivo(alerta);
      AccessibilityInfo.announceForAccessibility(`${alerta.titulo}. ${alerta.texto}`);
      // Risco médio e aviso antecipado somem sozinhos; Risco alto dentro da área fica (F07 CA6).
      if (alerta.nivel === 'medio' || alerta.antecipado)
        timerMedioRef.current = setTimeout(() => setAlertaAtivo(null), TEMPO_ALERTA_MEDIO_MS);
      notificarAlerta(alerta, { som: preferenciasRef.current.som }).catch(() => {});

      // Celular vibra: sempre, se a pessoa pediu no Perfil; ou quando o Pet não está conectado.
      const petLigado = petConectadoRef.current;
      if (preferenciasRef.current.avisarNoCelular || !petLigado) Vibration.vibrate(VIBRACAO_CELULAR);

      // O aviso antecipado vai para o celular e o relógio; o Pet e o histórico ficam para
      // quando a pessoa entra na área.
      if (alerta.antecipado) return;

      nivelNoPetRef.current = alerta.nivel;
      enviarNivelRef.current(alerta.nivel).catch(() => {});
      // Reforço só faz sentido com o Pet conectado.
      if (petLigado) aguardarConfirmacao(alerta.nivel);
      registrarAlerta({ criadoEm: new Date().toISOString(), nivel: alerta.nivel, trecho: alerta.trecho }).catch(() => {});
      ajustarTrajeto((t) => ({ alertasRecebidos: t.alertasRecebidos + 1 }));
    },
    [ajustarTrajeto, aguardarConfirmacao],
  );

  // Segue o GPS enquanto houver permissão.
  useEffect(() => {
    if (permissao !== 'concedida') return;
    let assinatura: Location.LocationSubscription | null = null;
    let ativo = true;

    /** Uma posição nova: célula, nível, Início, próximo trecho e, se for o caso, o alerta. */
    const tratar = (coordenada: Coordenada) => {
      const g = gradeRef.current;
      if (!g) return; // Sem grade salva: o Mapa já avisa que os dados estão indisponíveis.
      const faixa = faixaAtual(g.faixas);
      const t = trajetoRef.current;
      // Consentimento revogado (F08 CA4) ou fora do horário do Perfil: o motor segue a posição,
      // mas não alerta nem guarda pendente, e o aviso antecipado não é marcado como dado.
      const podeAlertar = !!consentimentoRef.current && horarioPermite(preferenciasRef.current.horario);
      const r = processarPosicao(g, faixa, coordenada, motorRef.current, Date.now(), podeAlertar);
      motorRef.current = r.estado;

      // Grade da API (H3) não traz o nome da rua: o celular procura uma vez por célula.
      // Enquanto não chega, os textos ficam sem a rua; na próxima posição já aparece.
      if (r.celula && !r.celula.referencia) preencherReferencia(r.celula).catch(() => {});

      atualizarPosicao({
        nivel: r.nivel ?? 'sem-dado',
        local: r.celula?.referencia ?? '',
        motivo: r.nivel ? motivoDoNivel(r.nivel, faixa) : '',
        coordenada,
        celulaId: r.celula?.id ?? null,
      });

      let antecipado: Alerta | null = null;
      if (t) {
        const proximo = proximoTrechoDeRisco(g, faixa, t.caminho, coordenada);
        ajustarTrajeto(() => ({ proximoTrecho: proximo }));
        // Antecedência do Perfil (F08 CA1): avisa antes de chegar ao próximo trecho de maior risco.
        if (podeAlertar)
          antecipado = avaliarAvisoAntecipado(proximo, r.nivel, preferenciasRef.current.antecedencia, avisadosRef.current);
      }

      if (r.alerta) disparar(r.alerta);
      else {
        if (antecipado) disparar(antecipado);
        // Saiu da área de Risco alto: o alerta alto pode sair da tela (CA6). O antecipado tem o próprio tempo.
        if (r.nivel !== 'alto') setAlertaAtivo((a) => (a?.nivel === 'alto' && !a.antecipado ? null : a));
        // A carinha do Pet acompanha o nível mesmo sem alerta (sem vibrar), com ou sem trajeto.
        const nivelAgora = r.nivel ?? 'sem-dado';
        if (podeAlertar && nivelAgora !== nivelNoPetRef.current) {
          nivelNoPetRef.current = nivelAgora;
          enviarNivelRef.current(nivelAgora, { vibrar: false }).catch(() => {});
        }
      }
    };

    // Modo demonstração: fica na FIAP Paulista e, com trajeto, anda sozinho pelo caminho escolhido.
    if (MODO_DEMO) {
      let andadoM = 0;
      let caminhoAtual: Coordenada[] | null = null;
      const passo = () => {
        const t = trajetoRef.current;
        if (!t || t.caminho.length < 2) {
          andadoM = 0;
          caminhoAtual = null;
          tratar(FIAP_PAULISTA);
          return;
        }
        if (caminhoAtual !== t.caminho) {
          caminhoAtual = t.caminho;
          andadoM = 0;
        }
        andadoM += PASSO_DEMO_M;
        const { ponto, restanteM } = pontoNoCaminho(t.caminho, andadoM);
        ajustarTrajeto(() => ({ minutosAteDestino: Math.max(1, Math.round(restanteM / 80)) }));
        tratar(ponto);
      };
      passo();
      const relogio = setInterval(passo, INTERVALO_DEMO_MS);
      return () => clearInterval(relogio);
    }

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5_000 },
      (local) => tratar({ latitude: local.coords.latitude, longitude: local.coords.longitude }),
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
