/**
 * Protocolo BLE entre o app e o hoodi Pet · versão 1 (a do firmware que está no Pet).
 * Espelho de iot/hoodi-pet/firmware/hoodi_pet/protocolo.h no repositório da API.
 * Especificação completa: iot/hoodi-pet/docs/PROTOCOLO_BLE.md.
 *
 * - O Pet anuncia o nome "hoodi Pet XXXX" e o serviço SERVICO_PET.
 * - Pareamento (CA9): é o do próprio sistema (bonding). Na primeira conexão o celular pede
 *   um código de 6 dígitos, que aparece na tela do Pet. Depois disso só este celular comanda o Pet.
 *   Para trocar de celular: segurar o botão do Pet enquanto liga (modo pareamento, 2 min).
 * - Comando (9 bytes, escrito em CARAC_COMANDO):
 *   [versão=1][tipo][sequência u32 little-endian][nível 0..3 | 0xFF][padrão | 0xFF][expressão | 0xFF]
 *   A sequência recomeça em 1 a cada conexão; comando com sequência repetida ou menor é ignorado.
 * - Evento (6 bytes, notificado em CARAC_EVENTO): [versão][1 clique | 2 pressão longa][contador u32].
 */

export const SERVICO_PET = 'a70ab40e-599a-4803-89db-3b1667e7d753';
export const CARAC_COMANDO = 'ad7790b4-bf5d-4ee2-a6b2-5faac8195117';
export const CARAC_STATUS = '147dca7f-bc45-4789-85bb-adc57bc40124';
export const CARAC_EVENTO = '6e9d9b1f-3aef-4015-a8ab-162399270a78';

export const PREFIXO_NOME = 'hoodi Pet';
export const VERSAO_PROTOCOLO = 1;

/** Valor "automático" para padrão e expressão; "sem dado" para o nível. */
export const AUTOMATICO = 0xff;

export const TIPO = { estado: 1, identificar: 2, silenciar: 3, fimTrajeto: 4 } as const;
export const PADRAO = { nenhum: 0, curto: 1, duplo: 2, longo: 3 } as const;
export const EXPRESSAO = { tranquila: 0, atenta: 1, preocupada: 2, alerta: 3, semDado: 4, dormindo: 5 } as const;
export const EVENTO = { clique: 1, pressaoLonga: 2 } as const;

export type EventoPet = { tipo: 'clique' | 'pressao-longa'; contador: number };

type Valor<T> = T[keyof T];

/** Nível do app → nível, padrão de vibração e carinha no Pet (as três carinhas da tela do Pet). */
export const NIVEL_PET = {
  tranquila: { nivel: 0, padrao: PADRAO.curto, expressao: EXPRESSAO.tranquila },
  medio: { nivel: 1, padrao: PADRAO.duplo, expressao: EXPRESSAO.atenta },
  alto: { nivel: 3, padrao: PADRAO.longo, expressao: EXPRESSAO.preocupada },
} as const;

function comSequencia(tipo: Valor<typeof TIPO>, sequencia: number) {
  if (!Number.isInteger(sequencia) || sequencia < 1 || sequencia > 0xffffffff) {
    throw new RangeError('sequência deve ser inteiro de 1 a 4294967295');
  }
  const f = new Uint8Array(9);
  f[0] = VERSAO_PROTOCOLO;
  f[1] = tipo;
  f[2] = sequencia & 0xff;
  f[3] = (sequencia >>> 8) & 0xff;
  f[4] = (sequencia >>> 16) & 0xff;
  f[5] = (sequencia >>> 24) & 0xff;
  return f;
}

/** Comando de estado: nível (ou null = "sem dado"), padrão de vibração e carinha. */
export function montarEstado(
  sequencia: number,
  nivel: number | null,
  padrao: Valor<typeof PADRAO> | typeof AUTOMATICO,
  expressao: Valor<typeof EXPRESSAO> | typeof AUTOMATICO,
) {
  const f = comSequencia(TIPO.estado, sequencia);
  f[6] = nivel === null ? AUTOMATICO : nivel;
  f[7] = padrao;
  f[8] = expressao;
  return f;
}

/** Identificar, silenciar ou fim do trajeto (sem argumentos). */
export function montarSimples(tipo: typeof TIPO.identificar | typeof TIPO.silenciar | typeof TIPO.fimTrajeto, sequencia: number) {
  return comSequencia(tipo, sequencia);
}

export function lerEvento(bytes: Uint8Array): EventoPet | null {
  if (bytes.length !== 6 || bytes[0] !== VERSAO_PROTOCOLO) return null;
  const contador = (bytes[2] | (bytes[3] << 8) | (bytes[4] << 16) | (bytes[5] << 24)) >>> 0;
  if (bytes[1] === EVENTO.clique) return { tipo: 'clique', contador };
  if (bytes[1] === EVENTO.pressaoLonga) return { tipo: 'pressao-longa', contador };
  return null;
}

/** A sequência recomeça a cada conexão (o Pet zera a dele quando conecta). */
export class Sequencia {
  private ultima = 0;
  reiniciar() {
    this.ultima = 0;
  }
  proxima() {
    this.ultima = this.ultima >= 0xffffffff ? 1 : this.ultima + 1;
    return this.ultima;
  }
}

/** O BLE do React Native troca valores em base64. */
export function paraBase64(bytes: Uint8Array) {
  let texto = '';
  bytes.forEach((b) => {
    texto += String.fromCharCode(b);
  });
  return btoa(texto);
}

export function deBase64(b64: string) {
  const texto = atob(b64);
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);
  return bytes;
}

/** "Sinal forte · a menos de 1 m" a partir do RSSI. */
export function descreverSinal(rssi: number | null) {
  if (rssi === null) return 'Sinal desconhecido';
  if (rssi >= -60) return 'Sinal forte · a menos de 1 m';
  if (rssi >= -75) return 'Sinal médio · por perto';
  return 'Sinal fraco · aproxime do celular';
}
