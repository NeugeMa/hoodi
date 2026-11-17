import { contem } from '@/features/grade/recorte';
import type { CelulaGrade, Coordenada, Limites } from '@/features/grade/tipos';

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

/** Distância em metros de um ponto até a célula (0 se está dentro). Hexágono: até a borda mais próxima. */
export function distanciaAteCelulaM(p: Coordenada, celula: CelulaGrade) {
  if (!celula.contorno) return distanciaAteRetanguloM(p, celula.limites);
  if (contem(celula, p)) return 0;
  // Plano local em metros em volta do ponto (distâncias curtas, dentro do perímetro).
  const mLat = (Math.PI / 180) * RAIO_TERRA_M;
  const mLon = mLat * Math.cos(rad(p.latitude));
  const xy = (q: Coordenada) => [(q.longitude - p.longitude) * mLon, (q.latitude - p.latitude) * mLat];
  let menor = Infinity;
  const c = celula.contorno;
  for (let i = 0; i < c.length; i++) {
    const [ax, ay] = xy(c[i]);
    const [bx, by] = xy(c[(i + 1) % c.length]);
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    menor = Math.min(menor, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return menor;
}

/** Comprimento de um caminho, em metros. */
export function comprimentoM(pontos: Coordenada[]) {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) total += distanciaM(pontos[i - 1], pontos[i]);
  return total;
}
