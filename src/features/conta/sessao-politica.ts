/**
 * Na web, o único armazenamento é o localStorage, legível por qualquer script da página.
 * Por isso, em build de produção a sessão fica só na memória (some ao recarregar a página).
 * Em desenvolvimento, homologação e demo, continua no localStorage para facilitar a pré-visualização.
 * O app nativo usa SecureStore e não passa por aqui.
 */
export function webPodePersistirSessao(ambiente: string | undefined): boolean {
  return ambiente !== 'producao';
}
