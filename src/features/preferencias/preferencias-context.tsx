import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { lerPreferenciasDeTexto, PREFERENCIAS_PADRAO, type PreferenciasAlerta } from './alertas';
import { lerPreferencia, PREF, salvarPreferencia } from './preferencias-repo';

/** Tema do app (F02 CA5): segue o celular ou fica fixo em claro ou escuro. */
export type Tema = 'sistema' | 'claro' | 'escuro';

export const OPCOES_TEMA: { valor: Tema; rotulo: string; detalhe: string }[] = [
  { valor: 'sistema', rotulo: 'Igual ao celular', detalhe: 'Muda junto com o tema do sistema' },
  { valor: 'escuro', rotulo: 'Escuro', detalhe: 'Cansa menos a vista e chama menos atenção à noite' },
  { valor: 'claro', rotulo: 'Claro', detalhe: 'Melhor para ler no sol' },
];

function aplicarTema(tema: Tema) {
  // No navegador não existe a troca de tema do app; lá vale o tema do sistema.
  if (typeof Appearance.setColorScheme !== 'function') return;
  Appearance.setColorScheme(tema === 'sistema' ? 'auto' : tema === 'claro' ? 'light' : 'dark');
}

type PreferenciasContexto = {
  tema: Tema;
  mudarTema: (tema: Tema) => Promise<void>;
  alertas: PreferenciasAlerta;
  /** Muda uma ou mais preferências e salva no aparelho (F08 CA1, CA2). */
  mudarAlertas: (parcial: Partial<PreferenciasAlerta>) => Promise<void>;
  /**
   * Data (ISO) em que a pessoa deu o consentimento LGPD; nulo se nunca deu ou revogou.
   * Sem consentimento, os alertas não disparam e o trajeto pede o consentimento antes de começar (F08 CA4).
   */
  consentimentoEm: string | null;
  darConsentimento: () => Promise<void>;
  revogarConsentimento: () => Promise<void>;
  /** Já leu o que estava salvo. */
  carregado: boolean;
};

const Contexto = createContext<PreferenciasContexto | null>(null);

/** Preferências de alerta e consentimento, guardados só no aparelho. */
export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [alertas, setAlertas] = useState<PreferenciasAlerta>(PREFERENCIAS_PADRAO);
  const [consentimentoEm, setConsentimentoEm] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [tema, setTema] = useState<Tema>('sistema');
  // Valor mais recente, para salvar a combinação certa mesmo com duas mudanças seguidas.
  const alertasRef = useRef<PreferenciasAlerta>(PREFERENCIAS_PADRAO);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      lerPreferencia(PREF.alertas),
      lerPreferencia(PREF.consentimentoEm),
      lerPreferencia(PREF.tema),
    ]).then(([texto, consentimento, temaSalvo]) => {
      if (!ativo) return;
      const t: Tema = temaSalvo === 'claro' || temaSalvo === 'escuro' ? temaSalvo : 'sistema';
      aplicarTema(t);
      setTema(t);
      const lidas = lerPreferenciasDeTexto(texto);
      alertasRef.current = lidas;
      setAlertas(lidas);
      setConsentimentoEm(consentimento || null);
      setCarregado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const mudarAlertas = useCallback(async (parcial: Partial<PreferenciasAlerta>) => {
    const novas = { ...alertasRef.current, ...parcial };
    alertasRef.current = novas;
    setAlertas(novas);
    await salvarPreferencia(PREF.alertas, JSON.stringify(novas));
  }, []);

  const mudarTema = useCallback(async (novo: Tema) => {
    aplicarTema(novo);
    setTema(novo);
    await salvarPreferencia(PREF.tema, novo);
  }, []);

  const darConsentimento = useCallback(async () => {
    const agora = new Date().toISOString();
    await salvarPreferencia(PREF.consentimentoEm, agora);
    setConsentimentoEm(agora);
  }, []);

  const revogarConsentimento = useCallback(async () => {
    await salvarPreferencia(PREF.consentimentoEm, '');
    setConsentimentoEm(null);
  }, []);

  const valor = useMemo(
    () => ({ tema, mudarTema, alertas, mudarAlertas, consentimentoEm, darConsentimento, revogarConsentimento, carregado }),
    [tema, mudarTema, alertas, mudarAlertas, consentimentoEm, darConsentimento, revogarConsentimento, carregado],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('usePreferencias precisa estar dentro de <PreferenciasProvider>');
  return ctx;
}
