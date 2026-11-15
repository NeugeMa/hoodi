import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { lerPreferenciasDeTexto, PREFERENCIAS_PADRAO, type PreferenciasAlerta } from './alertas';
import { lerPreferencia, PREF, salvarPreferencia } from './preferencias-repo';

type PreferenciasContexto = {
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
  // Valor mais recente, para salvar a combinação certa mesmo com duas mudanças seguidas.
  const alertasRef = useRef<PreferenciasAlerta>(PREFERENCIAS_PADRAO);

  useEffect(() => {
    let ativo = true;
    Promise.all([lerPreferencia(PREF.alertas), lerPreferencia(PREF.consentimentoEm)]).then(([texto, consentimento]) => {
      if (!ativo) return;
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
    () => ({ alertas, mudarAlertas, consentimentoEm, darConsentimento, revogarConsentimento, carregado }),
    [alertas, mudarAlertas, consentimentoEm, darConsentimento, revogarConsentimento, carregado],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('usePreferencias precisa estar dentro de <PreferenciasProvider>');
  return ctx;
}
