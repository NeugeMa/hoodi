# Teste de campo: alerta em segundo plano (prazo: 18/11, 18h)

Objetivo: provar, em aparelho real, que o alerta de área de risco chega com a tela apagada. Sem este teste, o segundo plano não deve ser apresentado como funcionando.

## Preparação
1. Development build instalada no aparelho (`eas build --profile development`), não Expo Go.
2. Permissão de localização "sempre" concedida pela tela de Permissões do app; notificações permitidas.
3. Economia de bateria desligada para o hoodi (Android: sem restrição em segundo plano).
4. Uma célula de nível alto conhecida na grade (a da fixture serve) e a faixa horária atual.

## Roteiro
| # | Ação | Esperado | Resultado |
|---|---|---|---|
| 1 | Abrir o app, ativar o acompanhamento, ir para a tela inicial do aparelho | Ícone/indicador de localização ativo | |
| 2 | Apagar a tela por 10 min parado | Nenhum alerta; app vivo | |
| 3 | Caminhar para dentro de uma célula de nível alto (tela apagada) | Notificação "entrando em área" em até ~1 min | |
| 4 | Permanecer na célula por mais de 2 min | Sem alerta repetido antes de 2 min | |
| 5 | Sair e reentrar | Novo alerta após o intervalo mínimo | |
| 6 | Encerrar o app pelo seletor de apps (forçar parada) | Sem alerta (limite conhecido) | |
| 7 | Reabrir o app | Alerta volta a funcionar | |
| 8 | Célula `sem_dado` | Nunca alerta | |

## Critério de decisão
- Passos 1 a 5 e 8 ok: apresentar o alerta em segundo plano.
- Falha em 3: usar o plano B, demonstrar com o app aberto, e dizer na apresentação que o segundo plano depende de teste adicional.
- Passo 6 é limite do sistema operacional, não defeito: dizer isso explicitamente.
