import type { NivelRisco } from '@/features/risco/nivel';

/**
 * Grade de risco publicada como snapshot versionado (contrato v0.6).
 * PROPOSTA para o contrato: cada célula traz seus limites em latitude/longitude,
 * assim o app desenha a célula no mapa sem depender da escolha entre geohash e H3.
 */

export type Coordenada = { latitude: number; longitude: number };

/** Retângulo da célula no mapa. */
export type Limites = { norte: number; sul: number; leste: number; oeste: number };

/** Manifesto: diz qual é a versão mais nova e o SHA-256 do arquivo dela. */
export type ManifestoGrade = {
  versao: string;
  /** SHA-256 (hex, minúsculas) do texto exato de /grade/{versao}.json. */
  sha256: string;
};

export type FaixaHoraria = {
  id: string;
  /** Ex.: "22h–2h". */
  rotulo: string;
  /** Hora de início, 0 a 23. */
  inicio: number;
  /** Hora de fim (exclusiva), 0 a 23. Pode ser menor que o início (passa da meia-noite). */
  fim: number;
};

export type CelulaGrade = {
  /** Id da célula (geohash ou H3, decisão do contrato). */
  id: string;
  limites: Limites;
  /** Rua ou bairro de referência para mostrar no detalhe. */
  referencia: string;
  /** Nível por faixa horária (chave: FaixaHoraria.id). Faixa ausente = "sem-dado". */
  niveis: Record<string, NivelRisco>;
};

export type GradeRisco = {
  versao: string;
  /** Data de publicação dos dados (ISO). Aparece como "Dados de 3 nov.". */
  publicadoEm: string;
  /** Sempre "SSP-SP" (só dados oficiais). */
  fonte: string;
  faixas: FaixaHoraria[];
  celulas: CelulaGrade[];
};

/** Grade guardada no aparelho, com a data em que foi baixada. */
export type GradeSalva = GradeRisco & { baixadaEm: string };
