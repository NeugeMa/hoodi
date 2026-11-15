import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import { API_URL } from '@/features/api/cliente';

import type { GradeRisco, ManifestoGrade } from './tipos';

/**
 * Download da grade de risco publicada pela API (snapshot versionado, contrato v0.6).
 * Endereço da API: variável EXPO_PUBLIC_API_URL no arquivo .env.
 */

const TEMPO_LIMITE_MS = 10_000;

export type FalhaDownload =
  /** EXPO_PUBLIC_API_URL não foi definido. */
  | 'sem-servidor'
  /** Sem resposta: sem internet, servidor fora do ar ou tempo esgotado. */
  | 'sem-internet'
  /** O arquivo chegou, mas o SHA-256 não confere (F03 CA8). */
  | 'checksum-invalido'
  /** Resposta inesperada do servidor. */
  | 'erro';

export class ErroDownload extends Error {
  constructor(public motivo: FalhaDownload) {
    super(motivo);
  }
}

async function buscarTexto(caminho: string) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, { signal: controle.signal });
    if (!resposta.ok) throw new ErroDownload('erro');
    return await resposta.text();
  } catch (e) {
    if (e instanceof ErroDownload) throw e;
    throw new ErroDownload('sem-internet');
  } finally {
    clearTimeout(timer);
  }
}

export async function buscarManifesto(): Promise<ManifestoGrade> {
  if (!API_URL) throw new ErroDownload('sem-servidor');
  try {
    return JSON.parse(await buscarTexto('/grade/manifesto.json')) as ManifestoGrade;
  } catch (e) {
    throw e instanceof ErroDownload ? e : new ErroDownload('erro');
  }
}

/** Baixa a versão e só devolve a grade se o SHA-256 do arquivo bater com o do manifesto. */
export async function baixarGrade(manifesto: ManifestoGrade): Promise<GradeRisco> {
  const texto = await buscarTexto(`/grade/${encodeURIComponent(manifesto.versao)}.json`);
  const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, texto);
  if (hash.toLowerCase() !== manifesto.sha256.toLowerCase()) {
    throw new ErroDownload('checksum-invalido');
  }
  try {
    return JSON.parse(texto) as GradeRisco;
  } catch {
    throw new ErroDownload('erro');
  }
}
