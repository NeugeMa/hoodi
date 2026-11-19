<p align="center">
  <img src="assets/images/logo-chapeuzinho.png" alt="Logo do Hoodi: a Chapeuzinho de capuz vermelho" width="120" />
</p>

<h1 align="center">Hoodi</h1>

<p align="center">
  <strong>Alerta de risco sem tirar o celular do bolso.</strong>
</p>


**Sumário:** [Integrantes](#integrantes) · [Documentação](#documentação) · [Hoodi](#hoodi) · [Demonstração](#demonstração) · [Como rodar](#como-rodar)
## Integrantes

| Nome | RM | Produções |
|---|---|---|
| Abner de Paiva Barbosa | RM558468 | API .NET e Hoodi Pet |
| Beatriz Vieira de Novais | RM554746 | Infra (VM Linux na Azure) e Hoodi Pet |
| Fernando Luiz Silva Antonio | RM555201 | ML (grade de risco) e Pitch |
| Mariana Neugebauer Dourado | RM550494 | App, Design System e QA |

## Documentação

| Documento | O que tem |
|---|---|
| [Funcionalidades](docs/funcionalidades.md) | Cada tela e feature (F01 a F10), com os critérios de aceite que atende |
| [Integrações](docs/integracoes.md) | API local passo a passo, modo demonstração, grade de risco, protocolo Bluetooth do Pet e development build |
| [Design e acessibilidade](docs/design-e-acessibilidade.md) | Design system v3, prints de todas as telas, ícone e splash, acessibilidade |
| [Para desenvolver](docs/desenvolvimento.md) | Estrutura de pastas, banco local e como contribuir |
| [Segurança e produção](docs/seguranca-producao.md) | O que está travado em produção e os limites conhecidos |

## Hoodi

| Campo | Resposta |
|---|---|
| **Cidade e bairro** | São Paulo · entorno da FIAP Paulista (Paulista, Bela Vista e Liberdade) |
| **Cidadão beneficiado** | Estudante do noturno, de 18 a 30 anos, que anda a pé da faculdade até o metrô ou até em casa |
| **Problema, em uma frase** | Caminhar sozinho à noite é inseguro, e tirar o celular do bolso na rua para checar o caminho é justamente o que a pessoa quer evitar |
| **Como funciona** | O app guarda no celular a grade de risco feita com dados da SSP-SP, cruza a posição com a célula e o horário e, quando o risco sobe, avisa pelo relógio (notificação) e pelo Hoodi Pet (vibração e carinha). Também compara rotas pelo menor risco registrado e avisa contatos de confiança no Pedir ajuda |
| **Indicador de impacto** | **% de trajetos feitos pela rota de menor risco registrado** (medido pelo app, no Comparar rotas) e **sensação de segurança antes e depois** (pesquisa de 1 a 5 com estudantes do noturno da FIAP Paulista) |
| **Repositórios** | App (este): https://github.com/NeugeMa/hoodi · API .NET, ML e firmware do Pet: https://github.com/APB-Abner/Hoodi |

### ODS

| ODS | Meta | Como o Hoodi contribui |
|---|---|---|
| **11 · Cidades e comunidades sustentáveis** (principal) | 11.7: espaços públicos seguros e inclusivos | Ajuda quem anda a pé até o metrô a escolher caminhos com menor risco registrado e avisa no trajeto, pelo relógio e pelo Hoodi Pet |
| **16 · Paz, justiça e instituições eficazes** | 16.1: reduzir todas as formas de violência | Usa dados públicos da SSP-SP para prevenção: evitar áreas com mais ocorrências e avisar contatos de confiança no Pedir ajuda |
| **5 · Igualdade de gênero** | 5.2: eliminar a violência contra mulheres e meninas nos espaços públicos | Quem mais teme andar sozinha à noite são as mulheres; o alerta discreto e o pedido de ajuda respondem a esse medo |
| **4 · Educação de qualidade** | 4.a: ambientes de aprendizagem seguros | O cidadão é o estudante do noturno: o trajeto até a faculdade faz parte de estudar com segurança |

### Tecnologias do app

| Para quê | Biblioteca |
|---|---|
| Base | Expo SDK 58 · React Native 0.88 · TypeScript (modo estrito) · Expo Router |
| Dados no aparelho | `expo-sqlite` (grade de risco, histórico, preferências) · `expo-secure-store` (sessão) |
| API | `fetch` com renovação automática do login ([`sessao.ts`](src/features/conta/sessao.ts)) |
| Mapa e posição | `react-native-maps` · `expo-location` · `expo-task-manager` (segundo plano) |
| Avisos | `expo-notifications` (push e aviso espelhado no relógio) · `react-native-ble-plx` (Hoodi Pet, protocolo v1) |
| Interface | Plus Jakarta Sans · Phosphor Icons · `react-native-svg` · Lottie · `@react-native-community/datetimepicker` |

## Como as partes se conectam

```
 Hoodi Pet (ESP32) ◄── Bluetooth ──►  App (este repositório)  ── HTTPS ──►  API .NET  ──►  push (Expo)  ──►  celular do contato
                                       grade salva no SQLite                 na VM Azure
                                                                                ▲
                                                                  grade de risco do ML (SSP-SP)
```

| Parte | O que faz | Onde |
|---|---|---|
| **App** | Interface do cidadão: Início, Mapa, alerta, Comparar rotas, Contatos, Pedir ajuda, Hoodi Pet | Este repositório |
| **API .NET** | Contas, contatos e convites, pedido de ajuda (pânico) com push, grade de risco e rotas | Repositório do Abner |
| **ML** | Gera a grade de risco (células H3 × faixa de horário) a partir dos registros da SSP-SP | Repositório do Abner (`data/risk`) |
| **Hoodi Pet** | Chaveiro com ESP32: vibra e mostra a carinha do risco; o botão 3 pede ajuda | Repositório do Abner (`iot/hoodi-pet`) |
| **Infra** | VM Linux na Azure com nginx e HTTPS (Let's Encrypt) na frente da API | **https://hoodi-api.canadacentral.cloudapp.azure.com** |

## Demonstração

Dá para usar o app inteiro **sem API, GPS nem Bluetooth**, com **dados simulados** e o selo **"Demonstração · dados simulados"** sempre na tela.

```bash
npm install
npx expo start --web --port 8081
```

Abra **http://localhost:8081/?demo=1**. O modo fica ligado nesse navegador até você abrir `?demo=0`.

| | |
|---|---|
| **E-mail** | `demo@hoodi.dev` |
| **Senha** | `Teste@2026` |

Na tela **Entrar**, o botão **Preencher** coloca os dois.

**Roteiro sugerido (cerca de 2 minutos):**

1. Abra o app: a abertura mostra a logo e o nome Hoodi, e o Início aparece com o Pet **dormindo** (ainda sem conta).
2. Em **Perfil > Entrar**, toque em **Preencher** e depois em **Entrar**.
3. No Início, toque em **Comparar rotas**, escreva um destino (por exemplo, "Estação Liberdade do Metrô") e toque em **Comparar rotas**.
4. Toque em **Iniciar trajeto**: a posição anda sozinha pela rota, chega o aviso antecipado e depois o alerta de risco.
5. Veja o **Mapa** com o trajeto e o **Histórico** com os alertas recebidos.
6. Em **Perfil > Contatos de segurança**, veja os contatos de exemplo. No Início, teste o **Pedir ajuda**.

**O que é simulado:** a API, a grade de risco em volta da FIAP Paulista e a caminhada. Nada sai do aparelho, e tudo volta ao início quando a página é recarregada. O modo demonstração **só liga em desenvolvimento** (ou num build com `EXPO_PUBLIC_AMBIENTE=demo`): um build de produção nunca mostra dado simulado.

No celular, com o Expo Go: crie o `.env` com `EXPO_PUBLIC_DEMO=1`, rode `npm start` e leia o QR code.

## Como rodar

**Pré-requisitos:** [Node.js](https://nodejs.org/) 20+ e o app **Expo Go** (SDK 58) no celular.

```bash
git clone https://github.com/NeugeMa/hoodi.git
cd hoodi
npm install
```

O app conversa com a API pelo endereço em `EXPO_PUBLIC_API_URL`, no arquivo `.env` da raiz (fica fora do Git). Escolha um dos caminhos:

| Caminho | Para quê | O que precisa |
|---|---|---|
| **A. API na VM** (recomendado) | Testar com conta de verdade, contatos e push, sem subir nada no PC | Só o app |
| **B. API no próprio PC** | Desenvolver ou testar mudanças na API | .NET 10, Mailpit e o repositório da API |
| **C. Modo demonstração** | Ver o app sem API | Nada: veja [Para avaliar](#para-avaliar-modo-demonstração) |

### A. Com a API na VM (Azure)

1. Crie o `.env` na raiz:
   ```
   EXPO_PUBLIC_API_URL=https://hoodi-api.canadacentral.cloudapp.azure.com
   ```
2. Rode o app e leia o QR code com o Expo Go (Android) ou com a câmera (iPhone):
   ```bash
   npm start
   ```
3. Crie a conta no app (**Perfil > Criar conta**). A VM ainda **não manda e-mail de verdade**: peça à equipe de Infra o link de confirmação (`hoodi://confirmar#token=...`) e cole no campo **Link do e-mail**, na tela Confira seu e-mail. O link vale por 30 minutos.

Na VM, o envio de push do pedido de ajuda já está ligado (`Panico__EnvioExpoHabilitado=true`) e a grade de risco já está publicada.

### B. Com a API no próprio PC

Resumo (passo a passo completo em [docs/integracoes.md](docs/integracoes.md#rodar-com-a-api-local)):

1. Clone a API (https://github.com/APB-Abner/Hoodi) e suba com o push ligado:
   ```bash
   dotnet run --project Hoodi.Api -- --urls http://0.0.0.0:5000 --environment Development --Https:RedirectEnabled=false --Panico:EnvioExpoHabilitado=true
   ```
   Sem o `--Https:RedirectEnabled=false`, o celular recebe 307 e não conecta.
2. Suba o **Mailpit** (recebe o e-mail do cadastro, em `http://localhost:8025`).
3. Publique a grade de risco uma vez, com a conta de operador ([como fazer](docs/integracoes.md#3-publicar-a-grade-de-risco-uma-vez)). Sem grade, o Mapa segue a sua posição, mas mostra **Sem dado** em todo lugar.
4. No `.env`, use o **IP do PC na rede** (no Windows, `ipconfig`), nunca `localhost`:
   ```
   EXPO_PUBLIC_API_URL=http://IP-DO-PC:5000
   ```
5. `npm start`, com o celular e o PC **na mesma rede Wi-Fi**. Se o Windows perguntar, permita o .NET e o Node na rede. Redes públicas (de faculdade, por exemplo) costumam bloquear um aparelho de falar com o outro: nesse caso, use o roteador do celular ou `npx expo start --tunnel`.

> **Navegador + API local não funcionam juntos:** a API não libera CORS, então o app aberto no navegador mostra "sem internet". Com a API, teste no celular; no navegador, use o modo demonstração.

### Bluetooth (Hoodi Pet) e push no Android: development build

O Expo Go não tem Bluetooth e, no Android, não recebe push. Para o Pet e para o push no Android é preciso o **development build** (APK gerado pelo EAS, o `eas.json` já está no projeto):

```bash
npx eas-cli@latest build --profile development --platform android
```

Instale o APK, rode `npm run start:dev` e leia o QR code pelo app instalado. Push no Android também precisa da chave do Firebase (FCM V1) no EAS. No iPhone, o development build exige conta paga da Apple; por isso, o Bluetooth é testado no Android. Detalhes em [docs/integracoes.md](docs/integracoes.md#development-build-bluetooth-e-push).

### Variáveis do `.env`

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_API_URL` | Endereço da API (VM ou IP do PC) |
| `EXPO_PUBLIC_DEMO` | `1` liga o modo demonstração (só em desenvolvimento) |
| `EXPO_PUBLIC_MODO_CARRO` | `1` mostra a opção de carro no Comparar rotas (em teste) |
| `EXPO_PUBLIC_AMBIENTE` | Definida pelos perfis do `eas.json` (`homologacao`, `producao`, `demo`); não precisa no `.env` |

## Contatos de segurança e Pedir ajuda

Os contatos são **outras contas do Hoodi**, ligadas por convite (não há SMS). **Quem aceita o seu convite passa a receber os seus pedidos de ajuda.**

```
Você convida  ──►  o contato aceita no app dele  ──►  você toca em Pedir ajuda  ──►  push no celular do contato
```

1. **Convidar:** em **Perfil > Contatos de segurança**, toque em **Convidar contato**. O app cria o convite na API e abre o menu de compartilhar com o link `hoodi://convite#codigo=...` (vale 1 hora e aparece uma vez só).
2. **Aceitar:** o contato abre o link no celular com o Hoodi (ou cola o link no campo de convite, em Contatos de segurança) e toca em **Aceitar**. Na sua lista, ele passa de **Aguardando confirmação** para **Confirmado**.
3. **Pedir ajuda:** no Início, toque em **Pedir ajuda** e confirme. Ou segure o **botão 3 do Hoodi Pet** por 3 segundos, sem tirar o celular do bolso.
4. **O contato recebe:** chega um push "pedido de ajuda"; tocar nele abre o pedido com o nome, a hora, o endereço aproximado e **Abrir no Google Maps**. Sem push, o pedido aparece em **Contatos > Pedidos de ajuda recebidos**.

**Regras que o app aplica:**

- Até **5 contatos**, contando os convites pendentes.
- Até **3 pedidos por hora**; no quarto, o app explica e diz que **não foi enviado**.
- A posição vai **arredondada para cerca de 100 m**, e um toque repetido em 120 s não vira dois pedidos.
- Sem internet, o app diz na hora que o pedido **não foi enviado**; nunca mostra "enviado" sem ter saído.
- Convite e pedido nunca pedem login, senha, dinheiro ou instalação, e terminam com "Se não reconhece, ignore".

**Para testar com duas pessoas:** cada uma cria a sua conta (caminho A ou B). A pessoa **A** convida, a pessoa **B** aceita, e a **A** toca em Pedir ajuda: o push chega no celular da **B**. O push funciona no **iPhone pelo Expo Go** (testado em 19/11) e no Android só com o development build. O app registra o token do aparelho na API depois de entrar (`PUT /v1/push/tokens`).

Telas e critérios de aceite em [docs/funcionalidades.md](docs/funcionalidades.md#contatos-de-segurança-e-pedir-ajuda-f09).

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o app para o Expo Go |
| `npm run start:dev` | Sobe o app para o development build |
| `npm run web` | Abre o app no navegador |
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run lint` | Roda o ESLint |
| `npm run test:pet` | 61 testes das regras sem tela: protocolo do Pet, alerta, grade H3, contrato da grade, rotas, lugares e modo demonstração |
| `npm run verificar:eas` | Garante que o build de produção não liga o modo demonstração |

O CI do GitHub roda lint, testes, typecheck e `verificar:eas` em todo pull request. No Windows, um teste da grade pode falhar só porque o Git troca o fim de linha do CSV de exemplo (no CI, em Linux, passa).
