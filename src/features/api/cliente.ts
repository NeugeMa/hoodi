/**
 * Cliente HTTP da API do hoodi (backend .NET do Abner).
 * Endereço: variável EXPO_PUBLIC_API_URL no arquivo .env (no celular, o IP do PC, não localhost).
 * Erros seguem o problem+json da API: { title, status, code, traceId }.
 */

import { responderDemo } from '@/features/demo/api-demo';
import { MODO_DEMO } from '@/features/demo/modo-demo';

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

/**
 * Rotas que a API ainda não tem (hoje: comparar rotas) podem ir para o mock do Prism:
 * EXPO_PUBLIC_MOCK_URL=http://IP-DO-PC:4010 no .env. Sem a variável, vão para a API normal.
 * (EXPO_PUBLIC_PANICO_URL continua aceito, por compatibilidade.)
 */
export const MOCK_URL =
  (process.env.EXPO_PUBLIC_MOCK_URL || process.env.EXPO_PUBLIC_PANICO_URL)?.replace(/\/$/, '') || API_URL;

const TEMPO_LIMITE_MS = 15_000;

export type TipoFalha =
  /** EXPO_PUBLIC_API_URL não foi definido. */
  | 'sem-servidor'
  /** Sem resposta: sem internet, servidor fora do ar ou tempo esgotado. */
  | 'sem-internet'
  /** O servidor respondeu com erro (veja status e codigo). */
  | 'http';

export class ErroApi extends Error {
  constructor(
    public tipo: TipoFalha,
    public status = 0,
    /** Campo "code" do problem+json, ex.: CREDENCIAIS_INVALIDAS, LIMITE_TENTATIVAS. */
    public codigo?: string,
  ) {
    super(codigo ?? tipo);
  }
}

export function ehErroHttp(e: unknown, status?: number): e is ErroApi {
  return e instanceof ErroApi && e.tipo === 'http' && (status === undefined || e.status === status);
}

export type OpcoesChamada = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  /** Access token (JWT). Use chamarAutenticado em vez de passar à mão. */
  token?: string;
  /** Outro endereço base (ex.: mock do Prism para rotas que a API ainda não tem). Padrão: API_URL. */
  base?: string;
};

export async function chamarApi<T>(
  caminho: string,
  { metodo = 'GET', corpo, token, base = API_URL }: OpcoesChamada = {},
): Promise<T> {
  // Modo demonstração: a API simulada responde dentro do app (dados de exemplo, nada sai do aparelho).
  if (MODO_DEMO) {
    await new Promise((r) => setTimeout(r, 350));
    const r = responderDemo(metodo, caminho, corpo, token);
    if (r.status >= 400) throw new ErroApi('http', r.status, (r.corpo as { code?: string } | undefined)?.code);
    return r.corpo as T;
  }
  if (!base) throw new ErroApi('sem-servidor');

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  let resposta: Response;
  try {
    resposta = await fetch(`${base}${caminho}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ErroApi('sem-internet');
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) {
    let codigo: string | undefined;
    try {
      const problema = (await resposta.json()) as { code?: unknown };
      if (typeof problema?.code === 'string') codigo = problema.code;
    } catch {
      // Corpo vazio ou sem JSON.
    }
    throw new ErroApi('http', resposta.status, codigo);
  }

  if (resposta.status === 204) return undefined as T;
  const texto = await resposta.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

/** Texto para a pessoa, em linguagem simples, para falhas que não são de formulário. */
export function mensagemDeFalha(e: unknown): string {
  if (e instanceof ErroApi) {
    if (e.tipo === 'sem-servidor') return 'O endereço do servidor do Hoodi não está configurado neste app.';
    if (e.tipo === 'sem-internet') return 'Não foi possível falar com o Hoodi. Confira sua internet e tente de novo.';
    if (e.status === 429) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  }
  return 'Algo não funcionou. Tente de novo em instantes.';
}
