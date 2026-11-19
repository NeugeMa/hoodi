# Segurança e produção (front)

## O que está travado
- Modo demo: só liga em desenvolvimento ou em build com `EXPO_PUBLIC_AMBIENTE=demo`. `npm run verificar:eas` falha se `production` puder ligar o demo (roda no CI).
- Sessão: no celular fica no SecureStore. Na web, em build de produção fica só na memória; nos demais ambientes usa `localStorage`.
- Grade: manifesto inválido, CSV com colunas a mais, linha duplicada ou faixa fora do manifesto são recusados e a grade anterior continua valendo. Sem manifesto, vale o padrão do contrato v2.
- `sem_dado` nunca vira nível 0 nem gera alerta.

## Dependências
`npm audit --omit=dev --audit-level=high` aponta 36 vulnerabilidades (33 altas), todas na cadeia de build (Metro/Expo/picomatch). Não rodar `npm audit fix --force`: pode quebrar o SDK. Tratar com a atualização planejada do SDK do Expo, depois da entrega.

## Limites conhecidos
- Segundo plano: se o sistema encerrar o processo, o alerta só volta ao reabrir o app.
- Pet BLE: frame de 9 bytes sem autenticação criptográfica; protótipo.
- Promessa de privacidade de origem e destino: o app não grava rotas no histórico; falta teste automatizado que prove isso.
