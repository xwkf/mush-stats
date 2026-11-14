import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import { getEmoji } from '../services/applicationEmojis.js';
import { deleteAllSessions } from '../services/sessionStore.js';

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('reiniciar')
    .setDescription('⌈Mush⌋ Reinicie suas estatisticas de sessão')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sessão')
        .setDescription('⌈Mush⌋ Reinicie suas estatisticas de sessão'),
    ),
  async execute(interaction) {
    const successEmoji = getEmoji('Correto') || '✅';
    const errorEmoji = getEmoji('Errado') || '❌';

    try {
      deleteAllSessions(interaction.user.id);

      await interaction.reply({
        content: `${successEmoji} **»** Suas estatísticas de sessão de todos os modos foram **resetadas** com sucesso!`,
      });
    } catch (error) {
      logger.error(`Erro ao reiniciar a sessão de ${interaction.user.id}:`, error);
      await interaction.reply({
        content: `${errorEmoji} **»** Não foi possível reiniciar sua sessão agora.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
