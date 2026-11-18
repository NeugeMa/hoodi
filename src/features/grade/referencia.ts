import * as Location from 'expo-location';

import type { CelulaGrade } from './tipos';

/**
 * Nome de rua para as células da grade da API, que só traz o código H3.
 * O próprio celular converte o CENTRO da célula (não a posição da pessoa) em rua ou bairro,
 * com o geocodificador do sistema, como já faz no Comparar rotas. Nada vai para o servidor do Hoodi.
 * O nome fica na célula em memória; enquanto não chega (ou sem internet), os textos ficam sem a rua.
 */

const pedidos = new Map<string, Promise<string>>();
/** Falhou: espera 1 minuto antes de tentar a mesma célula de novo. */
const ESPERA_MS = 60_000;
const falhas = new Map<string, number>();

function centro(celula: CelulaGrade) {
  const pontos = celula.contorno ?? [];
  if (!pontos.length) {
    const l = celula.limites;
    return { latitude: (l.norte + l.sul) / 2, longitude: (l.leste + l.oeste) / 2 };
  }
  return {
    latitude: pontos.reduce((s, p) => s + p.latitude, 0) / pontos.length,
    longitude: pontos.reduce((s, p) => s + p.longitude, 0) / pontos.length,
  };
}

/** Preenche `celula.referencia` (uma vez por célula) e devolve o nome; '' se não deu. */
export function preencherReferencia(celula: CelulaGrade): Promise<string> {
  if (celula.referencia) return Promise.resolve(celula.referencia);
  const falhou = falhas.get(celula.id);
  if (falhou && Date.now() - falhou < ESPERA_MS) return Promise.resolve('');
  let pedido = pedidos.get(celula.id);
  if (!pedido) {
    pedido = Location.reverseGeocodeAsync(centro(celula))
      .then(([r]) => {
        const nome = r?.street || r?.district || r?.name || '';
        if (nome) celula.referencia = nome;
        else falhar(celula.id);
        return nome;
      })
      .catch(() => {
        falhar(celula.id); // tenta de novo mais tarde (ex.: voltou a internet)
        return '';
      });
    pedidos.set(celula.id, pedido);
  }
  return pedido;
}

function falhar(id: string) {
  pedidos.delete(id);
  falhas.set(id, Date.now());
}
