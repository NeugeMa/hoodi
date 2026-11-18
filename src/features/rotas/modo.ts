/**
 * Modo da comparação de rotas (a pé ou de carro), sem dependência de react-native (testável em Node).
 * O app não registra como a pessoa se desloca: o modo é só uma escolha na tela de rotas.
 * O pedido de carro depende do campo `modo` na API (A1); sem a confirmação da API, o app não mostra
 * rota a pé como se fosse de carro.
 */
export type ModoRota = 'pe' | 'carro';

export const AVISO_CARRO = 'Risco histórico geral, não específico de crime contra veículo.';

export function modoCarroLiberado(env: { flag?: string; demo: boolean }): boolean {
  return env.demo || env.flag === '1';
}

type Ponto = { latitude: number; longitude: number };

/** Corpo do POST /v1/rotas/avaliar. A pé: idêntico ao contrato v0.6 (sem `modo`). */
export function corpoDaAvaliacao(origem: Ponto, destino: Ponto, saidaEm: Date, modo: ModoRota) {
  return {
    origem: { latitude: origem.latitude, longitude: origem.longitude },
    destino: { latitude: destino.latitude, longitude: destino.longitude },
    saidaEm: saidaEm.toISOString(),
    ...(modo === 'carro' ? { modo } : {}),
  };
}

/** A pé aceita resposta sem `modo` (API v0.6). Carro só vale se a API confirmar `modo: "carro"`. */
export function respostaConfirmaModo(modo: ModoRota, resposta: { modo?: string }): boolean {
  return modo === 'pe' ? resposta.modo === undefined || resposta.modo === 'pe' : resposta.modo === 'carro';
}
