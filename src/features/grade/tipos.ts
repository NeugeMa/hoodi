import type { NivelRisco } from '@/features/risco/nivel';

/**
 * Grade de risco do app. Vem da API (snapshot H3 v2, contrato v0.6: CSV convertido no aparelho
 * por grade-h3.ts) ou da grade simulada do modo demonstração (células retangulares).
 */

export type Coordenada = { latitude: number; longitude: number };

/** Retângulo da célula no mapa. */
export type Limites = { norte: number; sul: number; leste: number; oeste: number };

/** Versão publicada da grade (GET /v1/risco/versao-atual). */
export type VersaoGrade = {
  versao: string;
  /** SHA-256 (hex, minúsculas) dos bytes exatos do CSV de /v1/risco/grade. */
  sha256: string;
  publicadoEm: string;
  /** Manifesto do produtor (ML): faixas, período dos dados, fonte, aviso. */
  manifest: ManifestoProdutor;
};

/** Parte do manifesto do produtor que o app usa. */
export type ManifestoProdutor = {
  fonte?: { orgao?: string };
  /** Período dos registros, ex.: ["2026-01-01", "2026-09-30"]. */
  janela_dados?: [string, string];
  faixas?: { faixa: number; faixa_nome: string; intervalo_horas: string }[];
  aviso?: string;
};

export type FaixaHoraria = {
  id: string;
  /** Ex.: "22h–2h". */
  rotulo: string;
  /** Hora de início, 0 a 23. */
  inicio: number;
  /** Hora de fim (exclusiva), 1 a 24. Pode ser menor que o início (passa da meia-noite). */
  fim: number;
};

export type CelulaGrade = {
  /** Id da célula (H3 resolução 9 na grade da API). */
  id: string;
  /** Retângulo que envolve a célula (filtro rápido; na demonstração é a própria célula). */
  limites: Limites;
  /** Contorno exato da célula (hexágono H3). Sem contorno, a célula é o retângulo de `limites`. */
  contorno?: Coordenada[];
  /** Rua ou bairro de referência para mostrar no detalhe. Vazio quando a grade não traz (API). */
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
  /** Período dos registros (ex.: jan. a set. 2026), quando a grade informa. */
  periodo?: { inicio: string; fim: string };
  faixas: FaixaHoraria[];
  celulas: CelulaGrade[];
};

/** Grade guardada no aparelho, com a data em que foi baixada. */
export type GradeSalva = GradeRisco & { baixadaEm: string };
