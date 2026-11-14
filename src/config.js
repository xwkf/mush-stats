import { config as loadEnv } from 'dotenv';

loadEnv({ quiet: true });

const required = ['DISCORD_TOKEN', 'CLIENT_ID'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }
}

function parseIds(value) {
  return (value ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID?.trim() || null,
  ownerIds: parseIds(process.env.OWNER_IDS),
  defaultCooldown: Number(process.env.DEFAULT_COOLDOWN ?? 3),
  presence: {
    status: process.env.PRESENCE_STATUS ?? 'online',
    activity: process.env.PRESENCE_ACTIVITY ?? 'by xwqk | Cluster Welly - Shard: 3',
    type: process.env.PRESENCE_TYPE ?? 'Playing',
  },
};
