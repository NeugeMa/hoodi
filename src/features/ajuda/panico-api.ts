import { MOCK_URL } from '@/features/api/cliente';
import { chamarAutenticado } from '@/features/conta/sessao';

/**
 * Pedido de ajuda (/v1/panico). Ainda no mock da API (Prism); quando a API real sair, só troca a URL.
 * O servidor avisa os contatos por push (só "tipo" e "pedidoId"); quem recebe abre o app para ver
 * nome, hora e posição. "Push enviado" não quer dizer "recebido": o app nunca afirma entrega.
 */

/** Enquanto o pânico só existe no mock, vai para EXPO_PUBLIC_MOCK_URL (veja cliente.ts). */
const BASE = MOCK_URL;

export type EstadoDespachos =
  | 'sem_destinatarios'
  | 'em_processamento'
  | 'aceito_expo'
  | 'aceito_provedor_push'
  | 'aberto_no_app'
  | 'nenhum_envio_confirmado';

export type ResumoDespachos = {
  estado: EstadoDespachos;
  total: number;
  pendentes: number;
  aceitosExpo: number;
  aceitosProvedor: number;
  abertosNoApp: number;
  falhosOuCancelados: number;
};

export type PanicoRegistrado = {
  pedidoId: string;
  registradoEm: string;
  origem: 'app' | 'watch' | 'esp32';
  resumo: ResumoDespachos;
  /** true: a mesma intenção já tinha sido registrada (mesma chave); posição original mantida. */
  reutilizado: boolean;
};

export type PanicoStatus = { pedidoId: string; registradoEm: string; resumo: ResumoDespachos };

export type PanicoRecebido = { pedidoId: string; titularNome: string; registradoEm: string };

export type PanicoDetalhe = {
  pedidoId: string;
  titularNome: string;
  registradoEm: string;
  origem: 'app' | 'watch' | 'esp32';
  latitude: number | null;
  longitude: number | null;
  observacao: string | null;
  localizacaoDisponivel: boolean;
};

export type Coordenadas = { latitude: number; longitude: number } | null;

/** A chave de idempotência evita pedido duplicado quando a rede falha e a pessoa toca de novo. */
export function enviarPanico(idempotencyKey: string, posicao: Coordenadas) {
  return chamarAutenticado<PanicoRegistrado>('/v1/panico', {
    base: BASE,
    metodo: 'POST',
    corpo: {
      idempotencyKey,
      origem: 'app',
      // As duas juntas ou as duas nulas (regra da API).
      latitude: posicao?.latitude ?? null,
      longitude: posicao?.longitude ?? null,
    },
  });
}

export function statusDoPanico(pedidoId: string) {
  return chamarAutenticado<PanicoStatus>(`/v1/panico/${encodeURIComponent(pedidoId)}/status`, { base: BASE });
}

export function panicosRecebidos() {
  return chamarAutenticado<PanicoRecebido[]>('/v1/panico/recebidos', { base: BASE });
}

export function detalheDoPanico(pedidoId: string) {
  return chamarAutenticado<PanicoDetalhe>(`/v1/panico/${encodeURIComponent(pedidoId)}`, { base: BASE });
}

/** O contato abriu o pedido no app (não prova que o push chegou). */
export function marcarAberto(pedidoId: string) {
  return chamarAutenticado<void>(`/v1/panico/${encodeURIComponent(pedidoId)}/abertura`, { base: BASE, metodo: 'POST' });
}
