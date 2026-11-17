import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { gradeDemo } from '@/features/demo/dados-demo';
import { MODO_DEMO } from '@/features/demo/modo-demo';

import { baixarGrade, buscarVersao, ErroDownload, type FalhaDownload } from './grade-api';
import { lerGradeSalva, salvarGrade } from './grade-repo';
import type { GradeSalva } from './tipos';

type GradeContexto = {
  /** Última grade válida salva no aparelho. Nula se nunca foi baixada. */
  grade: GradeSalva | null;
  /** Lendo o banco ou baixando uma versão nova. */
  carregando: boolean;
  /** Motivo da última tentativa de atualização ter falhado (nulo se deu certo). */
  falha: FalhaDownload | null;
  /** Busca a versão publicada e baixa a nova, se houver (F03 CA1). */
  atualizar: () => Promise<void>;
};

type Resultado = { grade: GradeSalva | null; falha: FalhaDownload | null };

/**
 * 1. lê a grade salva no SQLite (funciona sem internet, F03 CA6);
 * 2. busca a versão publicada; se mudou, baixa o CSV e confere o SHA-256;
 * 3. checksum inválido: recusa e continua com a versão anterior (F03 CA8).
 */
async function sincronizar(): Promise<Resultado> {
  // Modo demonstração: grade simulada em volta da FIAP Paulista (não é registro da SSP-SP).
  if (MODO_DEMO) return { grade: gradeDemo(), falha: null };
  let grade: GradeSalva | null = null;
  // Cache ilegível não impede de checar a versão publicada e baixar a grade de novo.
  try {
    grade = await lerGradeSalva();
  } catch (e) {
    console.warn('[grade] não foi possível ler a grade salva', e);
  }
  try {
    const versao = await buscarVersao();
    // Grade salva sem contorno = formato antigo (antes do H3): baixa de novo.
    const antiga = grade !== null && grade.celulas.some((c) => !c.contorno);
    if (grade?.versao !== versao.versao || antiga) {
      grade = await salvarGrade(await baixarGrade(versao));
    }
    return { grade, falha: null };
  } catch (e) {
    if (!(e instanceof ErroDownload)) console.warn('[grade] falha inesperada ao sincronizar', e);
    return { grade, falha: e instanceof ErroDownload ? e.motivo : 'erro' };
  }
}

const Contexto = createContext<GradeContexto | null>(null);

/** Grade de risco do perímetro, compartilhada entre Mapa, Início e alertas. */
export function GradeProvider({ children }: { children: ReactNode }) {
  const [grade, setGrade] = useState<GradeSalva | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState<FalhaDownload | null>(null);

  const aplicar = useCallback((r: Resultado) => {
    setGrade(r.grade);
    setFalha(r.falha);
    setCarregando(false);
  }, []);

  // Ao abrir o app: grade salva primeiro, depois a tentativa de atualizar.
  useEffect(() => {
    let ativo = true;
    sincronizar().then((r) => {
      if (ativo) aplicar(r);
    });
    return () => {
      ativo = false;
    };
  }, [aplicar]);

  /** "Tentar de novo". */
  const atualizar = useCallback(async () => {
    setCarregando(true);
    aplicar(await sincronizar());
  }, [aplicar]);

  const valor = useMemo(() => ({ grade, carregando, falha, atualizar }), [grade, carregando, falha, atualizar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useGrade() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useGrade precisa estar dentro de <GradeProvider>');
  return ctx;
}
