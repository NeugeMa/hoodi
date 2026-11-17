import type { NivelRisco } from '@/features/risco/nivel';

import type { CelulaGrade, Coordenada, FaixaHoraria, GradeRisco } from './tipos';

/**
 * Centro da área coberta na demo: FIAP Paulista (Av. Paulista, 1106).
 * Usado para enquadrar o mapa enquanto a posição da pessoa ainda não é conhecida.
 */
export const CENTRO_PERIMETRO: Coordenada = { latitude: -23.5641, longitude: -46.6527 };

/** Faixa horária que vale agora (ou na hora informada). */
export function faixaAtual(faixas: FaixaHoraria[], agora = new Date()): FaixaHoraria | null {
  const h = agora.getHours();
  return (
    faixas.find((f) => (f.inicio <= f.fim ? h >= f.inicio && h < f.fim : h >= f.inicio || h < f.fim)) ??
    null
  );
}

/** Nível da célula numa faixa. Faixa sem dado ou ausente vira "sem-dado", nunca tranquila. */
export function nivelNaFaixa(celula: CelulaGrade, faixa: FaixaHoraria | null): NivelRisco {
  if (!faixa) return 'sem-dado';
  return celula.niveis[faixa.id] ?? 'sem-dado';
}

/** Ponto dentro do polígono (ray casting; células pequenas, então lat/lng como plano basta). */
export function dentroDoPoligono(p: Coordenada, poligono: Coordenada[]) {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (
      a.latitude > p.latitude !== b.latitude > p.latitude &&
      p.longitude < ((b.longitude - a.longitude) * (p.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude
    ) {
      dentro = !dentro;
    }
  }
  return dentro;
}

/** A coordenada está dentro da célula (hexágono H3 ou, na demonstração, retângulo). */
export function contem(celula: CelulaGrade, p: Coordenada) {
  const l = celula.limites;
  if (p.latitude > l.norte || p.latitude < l.sul || p.longitude > l.leste || p.longitude < l.oeste) return false;
  return celula.contorno ? dentroDoPoligono(p, celula.contorno) : true;
}

/** Célula que contém a coordenada; nula se estiver fora da área coberta. */
export function celulaEm(grade: GradeRisco, p: Coordenada): CelulaGrade | null {
  return grade.celulas.find((c) => contem(c, p)) ?? null;
}

/** Contorno da célula, na ordem que o mapa espera para desenhar o polígono. */
export function cantos(celula: CelulaGrade): Coordenada[] {
  if (celula.contorno) return celula.contorno;
  const l = celula.limites;
  return [
    { latitude: l.norte, longitude: l.oeste },
    { latitude: l.norte, longitude: l.leste },
    { latitude: l.sul, longitude: l.leste },
    { latitude: l.sul, longitude: l.oeste },
  ];
}

export type Trecho = { pontos: [Coordenada, Coordenada]; nivel: NivelRisco };

/**
 * Divide o caminho do trajeto em trechos e dá a cada um o nível da célula
 * onde fica o meio do trecho. Trecho fora da grade conta como "sem-dado".
 */
export function trechosColoridos(
  grade: GradeRisco,
  caminho: Coordenada[],
  faixa: FaixaHoraria | null,
): Trecho[] {
  const trechos: Trecho[] = [];
  for (let i = 0; i < caminho.length - 1; i++) {
    const a = caminho[i];
    const b = caminho[i + 1];
    const meio = { latitude: (a.latitude + b.latitude) / 2, longitude: (a.longitude + b.longitude) / 2 };
    const celula = celulaEm(grade, meio);
    trechos.push({ pontos: [a, b], nivel: celula ? nivelNaFaixa(celula, faixa) : 'sem-dado' });
  }
  return trechos;
}
