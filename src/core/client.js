import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

export function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
  });

  client.commands = new Collection();
  client.cooldowns = new Collection();
  client.buttons = new Collection();
  client.selectMenus = new Collection();
  client.modals = new Collection();

  return client;
}
