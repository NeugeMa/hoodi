import { ErroApi } from '@/features/api/cliente';
import { chamarAutenticado } from '@/features/conta/sessao';
import type { Coordenada } from '@/features/grade/tipos';

import { corpoDaAvaliacao, respostaConfirmaModo, type ModoRota } from './modo';

/**
 * Comparar rotas a pé ou de carro (POST /v1/rotas/avaliar, contrato v0.6 de rotas, com login).
 * A API busca até 3 rotas a pé no provedor (HeiGIT/openrouteservice, com a chave no servidor),
 * pontua cada uma na grade H3 da faixa horária da saída e devolve a ordem.
 * A API não guarda origem, destino nem o caminho. O risco é histórico (jan.–set. 2026), não previsão.
 */

/** Pontuação da rota na grade (todas as porcentagens de 0 a 100). */
export type PontuacaoRota = {
  /** Soma do risco ao longo do caminho (quanto menor, melhor). */
  acumulada: number;
  indicePorKm: number | null;
  metrosTotal: number;
  metrosComDado: number;
  percentualSemDado: number;
  percentualForaCobertura: number;
  /** Parte do caminho que conta como coberta (com dado). Abaixo de 70%: dado insuficiente. */
  coberturaPercentual: number;
  dadoInsuficiente: boolean;
};

export type RotaAvaliada = {
  rotaId: string;
  duracaoSegundos: number;
  geometria: Coordenada[];
  /** 1 = menor risco registrado. Nula quando a comparação não foi concluída. */
  posicao: number | null;
  /** Faixa horária (0 a 4) usada para a rota inteira: a da hora de saída. */
  faixa: number;
  pontuacao: PontuacaoRota;
};

export type ResultadoRotas = {
  /** Modo avaliado, quando a API informa (contrato com `modo`). */
  modo?: ModoRota;
  situacao: 'concluida' | 'inconclusiva' | 'indisponivel';
  /** Ex.: cobertura_insuficiente, apenas_uma_rota, provedor_indisponivel, grade_indisponivel, fora_territorio. */
  motivo: string | null;
  versaoGrade: string | null;
  fonteRisco?: string;
  semDado?: string;
  unidadeIndice?: string;
  aviso?: string;
  rotas: RotaAvaliada[];
};

export async function avaliarRotas(origem: Coordenada, destino: Coordenada, saidaEm = new Date(), modo: ModoRota = 'pe') {
  const resultado = await chamarAutenticado<ResultadoRotas>('/v1/rotas/avaliar', {
    metodo: 'POST',
    corpo: corpoDaAvaliacao(origem, destino, saidaEm, modo), // o contrato exige o fuso explícito (Z serve)
  });
  // API sem suporte a carro devolveria rota a pé: não mostrar como se fosse de carro.
  if (!respostaConfirmaModo(modo, resultado)) {
    return { situacao: 'indisponivel', motivo: 'modo_nao_suportado', versaoGrade: null, rotas: [] } as ResultadoRotas;
  }
  return resultado;
}

/** Texto para as recusas próprias desta chamada (422); as outras falhas usam o texto geral. */
export function mensagemDaRecusa(e: unknown, modo: ModoRota = 'pe'): string | null {
  const como = modo === 'carro' ? 'de carro' : 'a pé';
  if (!(e instanceof ErroApi) || e.status !== 422) return null;
  if (e.codigo === 'ROTA_EXTENSA') return `Esse destino fica longe demais para comparar caminhos ${como}.`;
  if (e.codigo === 'ROTA_INVALIDA') return `Não deu para traçar um caminho ${como} até esse destino. Tente outro endereço.`;
  if (e.codigo === 'SAIDA_FORA_JANELA') return 'O horário do celular parece errado. Confira a data e a hora e tente de novo.';
  return null;
}
