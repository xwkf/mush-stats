import { ActivityType, Events } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../core/logger.js';
import { syncApplicationEmojis } from '../services/applicationEmojis.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      await syncApplicationEmojis(client);
    } catch (error) {
      logger.error('Falha ao sincronizar emojis da aplicação:', error);
    }

    const type = ActivityType[config.presence.type] ?? ActivityType.Playing;

    client.user.setPresence({
      status: config.presence.status,
      activities: [{ name: config.presence.activity, type }],
    });

    logger.info(`Conectado como ${client.user.tag}`);
    logger.info(`Servidores: ${client.guilds.cache.size} | Usuários em cache: ${client.users.cache.size}`);
  },
};
