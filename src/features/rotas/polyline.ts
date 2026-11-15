import type { Coordenada } from '@/features/grade/tipos';

/**
 * Decodifica a geometria da rota que a API devolve (geometriaCodificada),
 * no formato "encoded polyline" do Google, com precisão de 5 casas.
 */
export function decodificarPolyline(codigo: string, precisao = 5): Coordenada[] {
  const fator = 10 ** precisao;
  const pontos: Coordenada[] = [];
  let indice = 0;
  let lat = 0;
  let lng = 0;

  function proximoValor() {
    let resultado = 0;
    let deslocamento = 0;
    let byte: number;
    do {
      if (indice >= codigo.length) throw new Error('polyline incompleta');
      byte = codigo.charCodeAt(indice++) - 63;
      resultado |= (byte & 0x1f) << deslocamento;
      deslocamento += 5;
    } while (byte >= 0x20);
    return resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  }

  while (indice < codigo.length) {
    lat += proximoValor();
    lng += proximoValor();
    pontos.push({ latitude: lat / fator, longitude: lng / fator });
  }
  return pontos;
}
