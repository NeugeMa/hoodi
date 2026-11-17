<p align="center">
  <img src="assets/images/logo-chapeuzinho.png" alt="Logo do Hoodi: a Chapeuzinho de capuz vermelho" width="120" />
</p>

<h1 align="center">Hoodi</h1>

<p align="center">
  <strong>Alerta de risco sem tirar o celular do bolso.</strong><br />
</p>


**Sumário:** [Integrantes](#integrantes) · [Documentação](#documentação) · [Tecnologias](#tecnologias) · [Ficha](#ficha-da-citizentech) · [ODS](#ods) · [Vídeo](#vídeo) · [Para avaliar](#para-avaliar) · [Prints](#prints) · [Como rodar](#como-rodar)

## Integrantes

| Nome | RM |
|---|---|
| Abner de Paiva Barbosa | RM558468 |
| Beatriz Vieira de Novais | RM554746 |
| Fernando Luiz Silva Antonio | RM555201 |
| Mariana Neugebauer Dourado | RM550494 |

## Documentação

| Documento | O que tem |
|---|---|
| [Funcionalidades](docs/funcionalidades.md) | Cada tela e feature (F01 a F10), com os critérios de aceite que atende |
| [Integrações](docs/integracoes.md) | API local, modo demonstração, grade de risco, protocolo Bluetooth do Pet e development build |
| [Design e acessibilidade](docs/design-e-acessibilidade.md) | Como o app segue o design system v3, ícone e splash, acessibilidade |
| [Para desenvolver](docs/desenvolvimento.md) | Estrutura de pastas, banco local e como contribuir |
| [prompts.md](prompts.md) | Registro do uso de IA (regra da GS) |

## Tecnologias

| Para quê | Biblioteca |
|---|---|
| Base | Expo SDK 58 · React Native 0.88 · TypeScript (modo estrito) · Expo Router |
| Dados no aparelho | `expo-sqlite` (grade de risco, histórico, preferências) · `expo-secure-store` (sessão) |
| API | `fetch` com renovação automática do login ([`sessao.ts`](src/features/conta/sessao.ts)) |
| Mapa e posição | `react-native-maps` · `expo-location` |
| Avisos | `expo-notifications` (espelhada no relógio) · `react-native-ble-plx` (Hoodi Pet, protocolo v1) |
| Interface | Plus Jakarta Sans · Phosphor Icons · `react-native-svg` · Lottie · `@react-native-community/datetimepicker` |

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | Hoodi |
| **Cidade e bairro** | São Paulo · entorno da FIAP Paulista (Paulista, Bela Vista e Liberdade) |
| **Cidadão beneficiado** | Estudante do noturno, de 18 a 30 anos, que anda a pé da faculdade até o metrô ou até em casa |
| **Problema, em uma frase** | Caminhar sozinho à noite é inseguro, e tirar o celular do bolso na rua para checar o caminho é justamente o que a pessoa quer evitar |
| **Como funciona** | O app guarda no celular a grade de risco feita com dados da SSP-SP, cruza a posição com a célula e o horário e, quando o risco sobe, avisa pelo relógio (notificação) e pelo Hoodi Pet (vibração e carinha). Também compara rotas pelo menor risco registrado e avisa contatos de confiança no Pedir ajuda |
| **O que cada parte faz** | **App (este repositório):** a interface do cidadão · **API .NET:** contas, contatos, pedido de ajuda e rotas · **ML:** a grade de risco · **Hoodi Pet (ESP32):** o alerta no bolso · **Infra Linux:** hospeda a API |
| **Repositórios** | App (este): https://github.com/NeugeMa/hoodi · API .NET (Abner): https://github.com/APB-Abner/Hoodi |
| **Indicador de impacto** | **% de trajetos feitos pela rota de menor risco registrado** (medido pelo app, no Comparar rotas) e **sensação de segurança antes e depois** (pesquisa de 1 a 5 com estudantes do noturno da FIAP Paulista) |
| **ODS conectados** | **11** (meta 11.7), **16** (16.1), **5** (5.2) e **4** (4.a): veja [ODS](#ods) |

## ODS

| ODS | Meta | Como o Hoodi contribui |
|---|---|---|
| **11 · Cidades e comunidades sustentáveis** (principal) | 11.7: espaços públicos seguros e inclusivos | Ajuda quem anda a pé até o metrô a escolher caminhos com menor risco registrado e avisa no trajeto, pelo relógio e pelo Hoodi Pet |
| **16 · Paz, justiça e instituições eficazes** | 16.1: reduzir todas as formas de violência | Usa dados públicos da SSP-SP para prevenção: evitar áreas com mais ocorrências e avisar contatos de confiança no Pedir ajuda |
| **5 · Igualdade de gênero** | 5.2: eliminar a violência contra mulheres e meninas nos espaços públicos | Quem mais teme andar sozinha à noite são as mulheres; o alerta discreto e o pedido de ajuda respondem a esse medo |
| **4 · Educação de qualidade** | 4.a: ambientes de aprendizagem seguros | O cidadão é o estudante do noturno: o trajeto até a faculdade faz parte de estudar com segurança |

## Vídeo

**Lançamento (90 s):** [assistir ao vídeo](docs/video/hoodi-lancamento.mp4)

**App rodando (até 3 min):** _link a adicionar_

## Para avaliar

Dá para usar o app inteiro **sem subir a API**, no **modo demonstração**: ele já vem com uma conta de teste e dados simulados.

| | |
|---|---|
| **E-mail** | `demo@hoodi.dev` |
| **Senha** | `Teste@2026` |

Na tela **Entrar**, o botão **Preencher** coloca os dois.

**No navegador (o jeito mais rápido):**

```bash
npm install
npx expo start --web --port 8081
```

Abra **http://localhost:8081/?demo=1**. O modo fica ligado nesse navegador até você abrir `?demo=0`.

**No celular, com o Expo Go:** crie o arquivo `.env` na raiz com `EXPO_PUBLIC_DEMO=1`, rode `npm start` e leia o QR code.

**Roteiro sugerido (cerca de 2 minutos):**

1. Abra o app: a abertura mostra a logo e o nome Hoodi, e o Início aparece com o Pet **dormindo** (ainda sem conta).
2. Em **Perfil > Entrar**, toque em **Preencher** e depois em **Entrar**.
3. No Início, toque em **Comparar rotas**, escreva um destino (por exemplo, "Estação Liberdade do Metrô") e toque em **Comparar rotas**.
4. Toque em **Iniciar trajeto**: a posição anda sozinha pela rota, chega o aviso antecipado e depois o alerta de risco.
5. Veja o **Mapa** com o trajeto e o **Histórico** com os alertas recebidos.
6. Em **Perfil > Contatos de segurança**, veja os contatos de exemplo. No Início, teste o **Pedir ajuda**.
7. Em **Perfil > Dados e privacidade**, veja o que fica guardado no aparelho.

**O que é simulado:** a API (contas, contatos, pedido de ajuda e rotas), a grade de risco em volta da FIAP Paulista e a caminhada. Nada sai do aparelho, e as contas, os contatos e os pedidos simulados voltam ao início quando o app é recarregado. O selo **"Demonstração · dados simulados"** fica sempre no topo da tela, para nada se passar por dado real. Bluetooth (Hoodi Pet) e push precisam do development build e da API: veja [Como rodar](#como-rodar).

## Prints

No navegador, no [modo demonstração](#3-modo-demonstração-no-navegador) (dados simulados), em tamanho de celular.

| Início | Mapa | Comparar rotas | Em trajeto |
|:-:|:-:|:-:|:-:|
| <img src="docs/prints/inicio.png" width="180" alt="Início" /> | <img src="docs/prints/mapa.png" width="180" alt="Mapa de risco" /> | <img src="docs/prints/comparar-rotas.png" width="180" alt="Comparar rotas" /> | <img src="docs/prints/inicio-em-trajeto.png" width="180" alt="Início em trajeto" /> |
| **Mapa com o trajeto** | **Alerta de risco** | **Pedir ajuda** | **Pedido registrado** |
| <img src="docs/prints/mapa-com-trajeto.png" width="180" alt="Mapa com o trajeto" /> | <img src="docs/prints/alerta-risco-medio.png" width="180" alt="Alerta de risco médio" /> | <img src="docs/prints/pedir-ajuda.png" width="180" alt="Pedir ajuda" /> | <img src="docs/prints/pedido-registrado.png" width="180" alt="Pedido registrado" /> |
| **Entrar** | **Criar conta** | **Contatos** | **Perfil** |
| <img src="docs/prints/entrar.png" width="180" alt="Entrar" /> | <img src="docs/prints/criar-conta.png" width="180" alt="Criar conta" /> | <img src="docs/prints/contatos.png" width="180" alt="Contatos de segurança" /> | <img src="docs/prints/perfil.png" width="180" alt="Perfil" /> |
| **Abertura** | **Permissões** | **Relógio** | **Dados e privacidade** |
| <img src="docs/prints/intro.png" width="180" alt="Abertura animada com a logo e o nome Hoodi" /> | <img src="docs/prints/permissoes.png" width="180" alt="Permissões" /> | <img src="docs/prints/relogio.png" width="180" alt="Configurar o relógio" /> | <img src="docs/prints/privacidade.png" width="180" alt="Dados e privacidade" /> |


## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 20+ e o app **Expo Go** (SDK 58) no celular.

```bash
npm install
```

### 1. No celular, com o Expo Go

```bash
npm start
```

Leia o QR code com o Expo Go (Android) ou com a câmera (iPhone). Celular e computador na mesma rede Wi-Fi; se não conectar, use `npx expo start --tunnel`.

### 2. Com a API do Abner

Crie o arquivo `.env` na raiz com o IP do computador na rede (não `localhost`):

```
EXPO_PUBLIC_API_URL=http://IP-DO-PC:5000
```

A API fica no repositório do Abner: **https://github.com/APB-Abner/Hoodi**. Suba a API com `--Https:RedirectEnabled=false` (sem ele o celular não conecta), e o **Mailpit** (recebe o e-mail do cadastro). Para o Mapa ter células, a grade de risco precisa ser publicada uma vez na API.

Em desenvolvimento, **o e-mail de confirmação não chega no Gmail**: ele aparece no Mailpit, em `http://localhost:8025` no PC. Copie o link `hoodi://confirmar#token=...` e cole em **Link do e-mail**, na tela Confira seu e-mail. Passo a passo completo em [docs/integracoes.md](docs/integracoes.md#rodar-com-a-api-local).

### 3. Modo demonstração no navegador

Para o vídeo e os prints, sem API, GPS ou Bluetooth, com **dados simulados** e o selo "Demonstração · dados simulados" na tela:

```bash
npx expo start --web --port 8081
```

Abra **http://localhost:8081/?demo=1** e entre com a conta de teste. Roteiro e conta em [Para avaliar](#para-avaliar); detalhes técnicos em [docs/integracoes.md](docs/integracoes.md#modo-demonstração-no-navegador-vídeo-e-prints).

Segue o modelo da API: os contatos são **outras contas do hoodi**, ligadas por convite (não há SMS). Quem aceita o convite passa a receber os pedidos de ajuda de quem convidou.

| Tela | Rota | O que faz | QA |
|---|---|---|---|
| Contatos de segurança | `/contatos` (Perfil) | Quem recebe seus pedidos (**Confirmado** ou **Aguardando confirmação**), até 5; **Convidar contato**; de quem você é contato, com **Sair**; pedidos recebidos; campo para colar um convite | CA1, CA2, CA3, CA6, CA9 |
| Convite | `/convite` | Aberta pelo link `hoodi://convite#codigo=...`: explica o que muda e oferece **Aceitar** ou **Recusar** | CA1, CA2 |
| Pedir ajuda | `/pedir-ajuda` (Início) | Confirmação com a prévia do que os contatos veem; único botão vermelho | CA4, CA5, CA7, CA8 |
| Pedido recebido | `/ajuda/[id]` | Para o contato: nome, hora, endereço aproximado em texto e **Abrir no Google Maps** | CA4 |

- **Convite:** o app cria o código na API e abre o menu de compartilhar com o link. O código só aparece uma vez (regra da API); se a pessoa sair da tela, cria outro. Convites pendentes podem ser cancelados. A API só mostra o nome de quem convidou depois do aceite.
- **Limites (o app aplica, a API ainda não):** 5 contatos contando os convites pendentes (CA3) e 3 pedidos de ajuda por hora (CA7). No quarto pedido, o app explica e diz que **não foi enviado**.
- **Sem internet (CA8):** o app diz na hora que o pedido não foi enviado, nunca mostra "enviado".
- **Pedido de ajuda:** vai com a posição **arredondada para cerca de 100 m** (endereço aproximado) e uma chave de idempotência reaproveitada por 120 s, para um toque repetido não virar dois pedidos. A tela mostra a situação sem prometer entrega ("o aviso saiu", nunca "recebido").
- **Mensagem (CA5):** convite e pedido não pedem login, senha, dinheiro nem instalação e terminam com "Se não reconhece, ignore".
- **Push:** depois de entrar, o app registra o token Expo do aparelho na API (`PUT /v1/push/tokens`), e tocar no aviso abre o pedido. Precisa de development build com projeto EAS (`extra.eas.projectId`); sem isso, o contato vê o pedido em **Contatos > Pedidos de ajuda recebidos**.
- **Estado da API:** contatos, convites, push e o **pânico** (`/v1/panico`, v0.6) já estão na API do Abner. O envio do push vem desligado por padrão na API (`Panico__EnvioExpoHabilitado=false`): para a demo, ligue na VM; desligado, o pedido fica registrado e o contato vê em "Pedidos recebidos". O **Comparar rotas** e a **grade de risco** também vêm da API (v0.6).

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run lint` | Roda o ESLint |
| `npm run test:pet` | 27 testes das regras sem tela: protocolo do Pet, alerta, aviso antecipado, grade H3 e comparação de rotas |
