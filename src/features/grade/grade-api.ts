import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import { API_URL } from '@/features/api/cliente';

import { CsvInvalido, gradeDoCsv } from './grade-h3';
import type { GradeRisco, VersaoGrade } from './tipos';

/**
 * Download da grade de risco publicada pela API (snapshot H3 v2, contrato v0.6):
 * 1. GET /v1/risco/versao-atual: versão, SHA-256 do CSV e manifesto do produtor;
 * 2. GET /v1/risco/grade: o CSV completo, conferido byte a byte com o SHA-256 (F03 CA8).
 * As duas leituras são públicas (sem login). Endereço da API: EXPO_PUBLIC_API_URL no .env.
 */

const TEMPO_LIMITE_MS = 15_000;

export type FalhaDownload =
  /** EXPO_PUBLIC_API_URL não foi definido. */
  | 'sem-servidor'
  /** Sem resposta: sem internet, servidor fora do ar ou tempo esgotado. */
  | 'sem-internet'
  /** O servidor respondeu, mas ainda não publicou a grade (404 SNAPSHOT_INDISPONIVEL). */
  | 'nao-publicada'
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
  if (!API_URL) throw new ErroDownload('sem-servidor');
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, { signal: controle.signal });
    if (resposta.status === 404) throw new ErroDownload('nao-publicada');
    if (!resposta.ok) throw new ErroDownload('erro');
    return await resposta.text();
  } catch (e) {
    if (e instanceof ErroDownload) throw e;
    throw new ErroDownload('sem-internet');
  } finally {
    clearTimeout(timer);
  }
}

export async function buscarVersao(): Promise<VersaoGrade> {
  const texto = await buscarTexto('/v1/risco/versao-atual');
  try {
    const v = JSON.parse(texto) as VersaoGrade;
    if (!v.versao || !/^[0-9a-f]{64}$/i.test(v.sha256)) throw new Error('versão inválida');
    return v;
  } catch {
    throw new ErroDownload('erro');
  }
}

async function baixarCsvConferido(versao: VersaoGrade) {
  const csv = await buscarTexto('/v1/risco/grade');
  const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, csv);
  return hash.toLowerCase() === versao.sha256.toLowerCase() ? csv : null;
}

/**
 * Baixa o CSV e só devolve a grade se o SHA-256 bater com o da versão.
 * Se não bater, pode ser que uma publicação nova saiu entre as duas chamadas (o contrato avisa):
 * busca a versão de novo e tenta mais uma vez. Continuou errado: recusa (a grade anterior fica).
 */
export async function baixarGrade(versao: VersaoGrade): Promise<GradeRisco> {
  let atual = versao;
  let csv = await baixarCsvConferido(atual);
  if (csv === null) {
    atual = await buscarVersao();
    csv = await baixarCsvConferido(atual);
  }
  if (csv === null) throw new ErroDownload('checksum-invalido');
  try {
    return gradeDoCsv(csv, atual);
  } catch (e) {
    if (e instanceof CsvInvalido) throw new ErroDownload('erro');
    throw e;
  }
}
