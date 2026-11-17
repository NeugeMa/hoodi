import type { Coordenada, Limites } from '@/features/grade/tipos';

const RAIO_TERRA_M = 6_371_000;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distância em metros entre dois pontos (haversine). */
export function distanciaM(a: Coordenada, b: Coordenada) {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

/** Distância em metros de um ponto até um retângulo (0 se o ponto está dentro). */
export function distanciaAteRetanguloM(p: Coordenada, l: Limites) {
  const lat = Math.min(Math.max(p.latitude, l.sul), l.norte);
  const lon = Math.min(Math.max(p.longitude, l.oeste), l.leste);
  return distanciaM(p, { latitude: lat, longitude: lon });
}

/** Comprimento de um caminho, em metros. */
export function comprimentoM(pontos: Coordenada[]) {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) total += distanciaM(pontos[i - 1], pontos[i]);
  return total;
}
