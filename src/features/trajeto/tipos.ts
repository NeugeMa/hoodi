import type { NivelRisco } from '@/features/risco/nivel';

/** Onde a pessoa está agora, cruzando a posição com a grade de risco. */
export type PosicaoAtual = {
  nivel: NivelRisco;
  /** Bairro ou referência da célula. Ex.: "Bela Vista". */
  local: string;
  /** Motivo do nível, com números concretos. Vazio em "Sem dado". */
  motivo: string;
};

export type ProximoTrecho = {
  rua: string;
  nivel: 'medio' | 'alto';
  distanciaMetros: number;
};

export type Trajeto = {
  destino: string;
  minutosAteDestino: number;
  alertasRecebidos: number;
  /** Nulo quando não há trecho de risco maior pela frente. */
  proximoTrecho: ProximoTrecho | null;
};

/** Canais de aviso (F05 CA2). */
export type Canais = {
  relogio: boolean;
  pet: boolean;
  /** Já existe um hoodi Pet pareado com este celular (mesmo que desconectado agora). */
  petPareado: boolean;
};
