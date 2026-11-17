/** Um alerta recebido durante um trajeto (F10). Fica só no aparelho. */
export type AlertaSalvo = {
  id: number;
  /** Data e hora do alerta (ISO). */
  criadoEm: string;
  /** Só há alerta quando o nível sobe; "Sem dado" nunca alerta (F07 CA5). */
  nivel: 'medio' | 'alto';
  /** Rua ou referência do trecho. */
  trecho: string;
};

export type NovoAlerta = Omit<AlertaSalvo, 'id'>;
