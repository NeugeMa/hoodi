/**
 * Protocolo BLE entre o app e o hoodi Pet · PROVISÓRIO (v0)
 * A combinar com o Nando (firmware ESP32-C3). Documentado no README.
 *
 * - O Pet anuncia o nome "hoodi Pet XXXX" (XXXX = 4 últimos dígitos hex do MAC)
 *   e o serviço SERVICO_PET.
 * - Pareamento (CA9): o app gera um token de 8 bytes e escreve em CARAC_PAREAMENTO.
 *   O Pet guarda o token (NVS) e só aceita comandos que comecem com ele.
 *   Para trocar de celular, o Pet precisa ser resetado (segurar o botão).
 * - Comandos: escrever em CARAC_COMANDO = token (8 bytes) + comando (1) + argumento (1).
 */

export const SERVICO_PET = 'f3a1c0de-0001-4b6f-8f0d-686f6f646900';
export const CARAC_PAREAMENTO = 'f3a1c0de-0002-4b6f-8f0d-686f6f646900';
export const CARAC_COMANDO = 'f3a1c0de-0003-4b6f-8f0d-686f6f646900';

export const PREFIXO_NOME = 'hoodi Pet';
export const TAMANHO_TOKEN = 8;

export const COMANDO = {
  /** Mostra a carinha e vibra no padrão do nível. Argumento: NIVEL_PET. */
  alerta: 0x01,
  /** Teste (F06 CA5): passa pelas três carinhas vibrando em cada uma. Argumento: 0. */
  teste: 0x02,
  /** Desfaz o pareamento: o Pet apaga o token. Argumento: 0. */
  esquecer: 0x03,
} as const;

/** Carinha e padrão de vibração no Pet. */
export const NIVEL_PET = { tranquila: 0, atenta: 1, preocupada: 2 } as const;

export function montarComando(token: Uint8Array, comando: number, argumento = 0) {
  const bytes = new Uint8Array(TAMANHO_TOKEN + 2);
  bytes.set(token.slice(0, TAMANHO_TOKEN), 0);
  bytes[TAMANHO_TOKEN] = comando;
  bytes[TAMANHO_TOKEN + 1] = argumento;
  return bytes;
}

/** O BLE do React Native escreve valores em base64. */
export function paraBase64(bytes: Uint8Array) {
  let texto = '';
  bytes.forEach((b) => {
    texto += String.fromCharCode(b);
  });
  return btoa(texto);
}

export function paraHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function deHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** "Sinal forte · a menos de 1 m" a partir do RSSI. */
export function descreverSinal(rssi: number | null) {
  if (rssi === null) return 'Sinal desconhecido';
  if (rssi >= -60) return 'Sinal forte · a menos de 1 m';
  if (rssi >= -75) return 'Sinal médio · por perto';
  return 'Sinal fraco · aproxime do celular';
}
