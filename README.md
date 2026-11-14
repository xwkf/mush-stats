# Mush Stats

Bot de Discord não oficial para consultar estatísticas de jogadores no MushMC.

![Banner](assets/banner.png)

## Recursos

- `/menu [nick]`: perfil do jogador, clan, amigos, skin, parkour, tags e medalhas.
- `/bedwars geral [nick]`: estatísticas gerais do Bed Wars, com nível, XP e seleção de modo.
- `/bedwars mensal [nick]`: estatísticas mensais do Bed Wars, com seleção de modo.
- `/bedwars diario [nick]`: estatísticas diárias do Bed Wars, com seleção de modo.
- `/bedwars missoes [nick]`: missões diárias, semanais e totais do Bed Wars.
- `/bedwars quickbuy [nick]`: imagem (fundo transparente) do menu de Compra Rápida e da hotbar do jogador.
- Resolução automática da conta vinculada ao Discord, com fallback pelo nick do usuário.
- Select menus para alternar entre Total, Mega, Solo, Duplas, Trios, Quartetos, 1v1, 2v2, 3v3, 4v4 e 4s.
- Select menu de missões para alternar entre Total, Diárias e Semanais.
- Emojis da aplicação sincronizados automaticamente a partir de `src/emojis`.

## Comandos

| Comando | Descrição |
| --- | --- |
| `/menu [nick]` | Mostra o perfil completo do jogador. |
| `/bedwars geral [nick]` | Mostra as estatísticas gerais do Bed Wars. |
| `/bedwars mensal [nick]` | Mostra as estatísticas mensais do Bed Wars. |
| `/bedwars diario [nick]` | Mostra as estatísticas diárias do Bed Wars. |
| `/bedwars missoes [nick]` | Mostra as missões diárias, semanais e totais do Bed Wars. |
| `/bedwars quickbuy [nick]` | Gera a imagem da Compra Rápida e da hotbar do jogador no Bed Wars. |

O parâmetro `nick` é opcional. Sem ele, o bot tenta usar a conta vinculada ao Discord de quem executou o comando.

## Requisitos

- Node.js 20 ou superior
- Um bot criado no Discord Developer Portal
- Token e Client ID do bot

## Instalação

```bash
git clone https://github.com/xwkf/mush-stats.git
cd mush-stats
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha as variáveis obrigatórias:

```env
DISCORD_TOKEN=seu_token
CLIENT_ID=id_do_bot
```

Opcionalmente, defina `GUILD_ID` para registrar os comandos apenas em um servidor específico:

```env
GUILD_ID=id_do_servidor
```

## Executando

```bash
npm run force
npm start
```

O `npm start` executa automaticamente o registro dos comandos antes de iniciar o bot.

Se o bot já estiver rodando, reinicie-o após alterações em comandos ou componentes.

## Scripts

| Script | Função |
| --- | --- |
| `npm start` | Registra os comandos e inicia o bot com watch mode. |
| `npm run dev` | Igual ao `npm start`. |
| `npm run force` | Força o registro dos comandos e remove duplicatas. |
| `npm run deploy` | Também registra os comandos usando a mesma lógica anti-duplicação. |
| `npm run start:prod` | Registra os comandos e inicia o bot sem watch mode. |

## Como os comandos são registrados

Os comandos são registrados por servidor para ficarem disponíveis imediatamente. Os comandos globais são limpos para evitar duplicação.

Se um comando não aparecer no Discord após o registro, pressione `Ctrl+R` ou reinicie o cliente. A remoção de comandos globais pode levar alguns instantes para refletir no cache do cliente.

## Estrutura do projeto

```text
src/
  commands/          Comandos de barra
  components/        Botões, selects e modais
  constants/         Tags, medalhas e outros dados fixos
  core/              Loader e logger
  data/              Links e registro de emojis (gerados em tempo de execução)
  emojis/            Imagens sincronizadas como emojis da aplicação
  events/            Eventos do Discord
  handlers/          Carregamento de comandos e componentes
  services/          API do Mush, embeds e resolução de jogadores
  utils/             Utilitários compartilhados
  config.js          Configuração via variáveis de ambiente
  force-deploy.js    Registro imediato e anti-duplicação
  index.js           Entrada do bot
```

## API utilizada

- `GET https://mush.com.br/api/player/{name|uuid|profileid}`
- `GET https://mush.com.br/api/player/name/{username}/parkour`
- `GET https://mush.com.br/api/player/name/{username}/missions`
- `GET https://mush.com.br/api/player/name/{username}/bedwars` (`quick_buy_layout` e `hotbar`)
- `GET https://mush.com.br/api/games/bedwars/xptable`
- `GET https://vzge.me/bust/512/{uuid}.png` (skin)
- `GET https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.8.8/{items|blocks}/{textura}.png` (ícones dos itens)

Este projeto não é afiliado ao MushMC.
