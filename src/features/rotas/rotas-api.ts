import { MOCK_URL } from '@/features/api/cliente';
import { chamarAutenticado } from '@/features/conta/sessao';
import type { Coordenada } from '@/features/grade/tipos';

/**
 * Comparar rotas a pé (POST /v1/rotas/avaliar). Ainda no mock da API (Prism):
 * vai para EXPO_PUBLIC_MOCK_URL. A API busca as rotas num provedor externo e não guarda
 * origem, destino nem o caminho.
 */

export type RotaAvaliada = {
  rotaId: string;
  distanciaMetros: number;
  duracaoSegundos: number;
  /** Exposição relativa ao risco registrado (quanto menor, melhor). Nula se a rota não tem dado suficiente. */
  exposicaoRelativa: number | null;
  /** Parte da rota (%) sem dado de risco. */
  percentualSemEstimativa: number;
  geometriaCodificada: string;
  /** 1 = menor exposição. Nula quando a comparação não foi concluída. */
  posicao: number | null;
};

export type ResultadoRotas = {
  situacao: 'concluida' | 'inconclusiva' | 'indisponivel';
  motivo:
    | null
    | 'cobertura_insuficiente'
    | 'apenas_uma_rota'
    | 'provedor_rotas_indisponivel'
    | 'sem_alternativas'
    | 'grade_indisponivel'
    | 'fora_territorio';
  versaoGrade: string | null;
  rotas: RotaAvaliada[];
};

export function avaliarRotas(origem: Coordenada, destino: Coordenada, saidaEm = new Date()) {
  return chamarAutenticado<ResultadoRotas>('/v1/rotas/avaliar', {
    base: MOCK_URL,
    metodo: 'POST',
    corpo: { origem, destino, saidaEm: saidaEm.toISOString() },
  });
}
