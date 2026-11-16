# Prompts de IA

Regra da GS: registrar os prompts usados e saber explicar o resultado.
Ferramenta: **Claude Code** (Anthropic). Cada entrega foi revisada, testada e commitada pela equipe.

[← Voltar ao README](README.md)

## Design e interface

| Prompt | Resultado |
|---|---|
| "Refaça a tela de login e de criação de conta a partir destas inspirações (imagens), seguindo o design system v3." | Entrar e Criar conta com o Hoodi Pet como mascote no topo |
| "Quando a pessoa estiver digitando a senha, o olho do mascote fica fechado." | Carinha de olhos fechados no campo de senha |
| "Deixe as duas telas na mesma proporção e tire os textos de apoio dos campos." | Topo igual em Entrar e Criar conta, formulário mais limpo |
| "Os campos ficam ilegíveis com o teclado aberto no celular." | Pet encolhe para o topo e o rodapé some com o teclado |
| "Use os ícones do design system (PDF) para o ícone e a splash do app." | Ícone, ícone adaptativo do Android, favicon e splash clara e escura |
| "Ao abrir o app, mostre uma animação de introdução com a palavra Hoodi e a logo, e caia no Início. Sem login, o Pet fica dormindo." | Abertura animada e Pet dormindo sem conta |
| "Implemente as carinhas do `carinhas.json` (o mesmo do firmware do Pet)." | Carinhas do app iguais às do visor do Pet (18 × 12) |

## Integração com a API

| Prompt | Resultado |
|---|---|
| "Leia o contrato OpenAPI do backend e diga o que muda no app em relação ao QA." | Lista das diferenças (cadastro em duas etapas, contatos por convite, grade H3) |
| "Ligue o cadastro, o login, a renovação do token e o esqueci a senha à API." | Cliente da API com renovação automática e sessão no SecureStore (F01) |
| "Siga os contatos por convite da API em vez do SMS do QA." | Contatos por link de convite e pedido de ajuda (F09) |
| "Faça a exclusão de conta com o DELETE do backend." | Excluir conta pedindo a senha (F08) |
| "Suba a API localmente e teste o app de ponta a ponta." | 72 verificações; achou o redirecionamento para HTTPS que impede o celular de conectar |

## Bluetooth e Hoodi Pet

| Prompt | Resultado |
|---|---|
| "Junte o protocolo BLE v1 do Pet (zip do colega) com o nosso código." | Pareamento com código, comando de 9 bytes e carinha seguindo o nível |
| "Quando o Pet vibrar por risco, espere o clique no Pet; sem clique, vibre o Pet e o celular de novo. Pet desconectado vibra o celular." | Reforço do alerta e opção "Avisar no celular também" |
| "Se o Pet cair no meio do trajeto, avise e tente reconectar." | Notificação de desconexão e reconexão automática (F06 CA8) |

## Regras do produto (QA v2)

| Prompt | Resultado |
|---|---|
| "Veja o que falta no mobile cruzando o QA no Azure e o design system com o código." | Mapa de F01 a F10: o que existia e o que faltava |
| "Compare rotas com a regra de 70% e mostre no cartão quanto do caminho está sem dado." | Comparar rotas sem tratar "sem dado" como área tranquila (F04) |

## O que ficou com a equipe

As decisões de produto (regra de 70%, ODS, nome do nível 3), os commits, o teste no celular e com o Pet físico, e o vídeo.
