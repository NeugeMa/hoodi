import { TelaPet } from './tela-pet';

/**
 * Versão web (pré-visualização): o Lottie nativo não roda no navegador sem uma
 * dependência extra, então aqui aparece a carinha "procurando". No celular, o radar.
 */
export function AnimacaoBusca({ ativo }: { ativo: boolean }) {
  return <TelaPet carinha="procurando" corMoldura={ativo ? '#1F7A6B' : '#8A8A92'} />;
}
