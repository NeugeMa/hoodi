# Prompts de IA usados no app mobile

Regra da GS ("IA como copiloto"): registrar os prompts e saber explicar cada linha.
Ferramenta: **Claude Code** (Anthropic), no app desktop, de 14 a 17/11/2026. A equipe revisou, testou
e commitou cada entrega; a IA não fez commits.

Os prompts estão resumidos na ordem em que foram feitos, com o que a IA entregou e o que a equipe decidiu.

## 1. Leitura do projeto e planejamento (14/11)

> "Tenho a produção de um projeto mobile. Vou deixar a pasta do projeto e mandar o nosso problema e produto
> (briefing da GS, design system v3, QA no Azure Boards v2 e as carinhas em JSON). Veja o que falta no mobile."

- A IA cruzou o QA v2 (F01 a F10) e o design system com o código e listou o que existia e o que faltava.
- Decisões da equipe: fazer F01, F02, F04, F08 e F09; seguir a API do Abner quando ela divergisse do QA.

## 2. Bluetooth e API (14/11)

> Prompts com as respostas do Abner e do colega (protocolo BLE v1 do Hoodi Pet, contrato da API, repositório
> do backend e o zip `hoodi-pet`).

- A IA leu o contrato OpenAPI e o protocolo BLE e apontou as diferenças com o app (protocolo provisório,
  contatos por convite em vez de SMS, grade H3 com 4 níveis).

## 3. F01 · Cadastro e acesso (15/11)

> "Crie a branch feat/api-F01 a partir da homologation e comece."
> "Refaça a tela de login/criação de conta com estas inspirações (imagens)."
> "Tire o 'Etapa 1 de 2' e a caixa de 18 anos; criar conta com nome, idade (calendário), e-mail e senha."
> "Quando eu escrever a senha, o olho do mascote fecha." · "Hoodi sempre com H maiúsculo."
> "Ao abrir o app, ele precisa ir para o Início, não para o login."

- Cliente da API com renovação automática do login; sessão no SecureStore; telas Entrar, Criar conta,
  Confirmar (link do e-mail), Esqueci a senha; Hoodi Pet como mascote que fecha os olhos na senha.

## 4. F09 · Contatos e pedido de ajuda (15/11)

> "Crie a branch para o F09." · "Siga os contatos por convite da API."

- Contatos por convite (link `hoodi://convite`), Pedir ajuda com prévia, limites de 5 contatos e
  3 pedidos por hora, pedido recebido pelo contato, push.

## 5. F04 e F08 · Comparar rotas e Perfil (15/11)

> "Crie uma branch para F04 e F08 a partir da homologation e comece a produção."

- Comparar rotas (regra do QA: trecho sem dado não compara), Perfil com preferências, Dados e privacidade,
  revogar consentimento e excluir conta.

## 6. F02, aviso antecipado e o Pet v1 do Abner (15 e 16/11)

> "Faça a F02 e o aviso do F08." · "O Abner mandou o zip com o Pet v1 e a ideia do 'vi' no Pet:
> sem clique em 15–20 s, vibra de novo o Pet e o celular; Pet desconectado vibra o celular; opção 'avisar no
> celular também'." · "Faça a exclusão de conta com o DELETE dele."

- Permissões com o motivo de cada uma, tema escuro à noite, aviso antecipado, junção do Pet v1 com o
  F02/F08, exclusão de conta pedindo a senha, pânico na API real; 18 testes automáticos.

## 7. Testes com a API (16/11)

> "Suba a API do Abner e faça todo o teste que você puder."

- A IA subiu a API localmente e testou o app de ponta a ponta (72 verificações e 9 cenários rodando o próprio
  código do app). Achou e documentou: o `dotnet run` padrão redireciona para HTTPS e o celular não conecta.

## 8. Entrega (16 e 17/11)

> "Faça tudo o que falta (menos o do Abner). Os ícones estão no design system. Quero gravar o vídeo com o
> Claude Motion pelo localhost."

- Carinhas a partir do `carinhas.json` do firmware, reconexão do Pet no trajeto, ícone e splash do design
  system, `eas.json`, modo demonstração no navegador (dados simulados, sinalizados na tela), mapa web em SVG,
  prints das telas e este arquivo.

## Como a IA foi usada

- **Para fazer:** código das telas e da lógica, testes e documentação, sempre a partir dos requisitos do QA v2,
  do design system v3 e dos contratos dos colegas.
- **Para revisar:** typecheck, lint e testes antes de cada entrega; testes de ponta a ponta com a API.
- **O que ficou com a equipe:** as decisões de produto (70% ou 100% no Comparar rotas, o nome do nível 3,
  a pressão longa do Pet), os commits, o teste no celular e com o Pet físico, e o vídeo.
