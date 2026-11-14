import { Events, MessageFlags } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../core/logger.js';

export default {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand()) return await handleCommand(client, interaction);
      if (interaction.isButton()) return await handleComponent(client, interaction, 'buttons');
      if (interaction.isAnySelectMenu()) return await handleComponent(client, interaction, 'selectMenus');
      if (interaction.isModalSubmit()) return await handleComponent(client, interaction, 'modals');
    } catch (error) {
      logger.error(`Erro na interação de ${interaction.user.tag}:`, error);
      await respondWithError(interaction);
    }
  },
};

async function handleCommand(client, interaction) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Comando não encontrado: ${interaction.commandName}`);
    return;
  }

  const cooldown = command.cooldown ?? config.defaultCooldown;
  const key = `${command.data.name}:${interaction.user.id}`;
  const now = Date.now();
  const expiresAt = client.cooldowns.get(key) ?? 0;

  if (now < expiresAt) {
    const remaining = ((expiresAt - now) / 1000).toFixed(1);
    return interaction.reply({
      content: `Aguarde ${remaining}s para usar este comando novamente.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (cooldown > 0) client.cooldowns.set(key, now + cooldown * 1000);

  await command.execute(interaction);
}

async function handleComponent(client, interaction, collectionName) {
  const collection = client[collectionName];
  const handler = collection.get(interaction.customId) ?? collection.get(interaction.customId.split(':')[0]);

  if (!handler) {
    logger.warn(`Componente não encontrado: ${interaction.customId}`);
    return;
  }

  await handler.execute(interaction);
}

async function respondWithError(interaction) {
  const payload = {
    content: 'Ocorreu um erro ao processar esta interação.',
    flags: MessageFlags.Ephemeral,
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => {});
  } else {
    await interaction.reply(payload).catch(() => {});
  }
}
