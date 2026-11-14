import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import { fetchPlayer } from '../../services/mush.js';
import { buildMedalsEmbed } from '../../services/mushMenu.js';

export default {
  customId: 'menu_medals',
  async execute(interaction) {
    const username = interaction.customId.split(':')[1];
    const errorEmoji = getEmoji('Errado') || '❌';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const player = username ? await fetchPlayer(username) : null;

      if (!player) {
        await interaction.editReply({ content: `${errorEmoji} **»** Jogador não encontrado.` });
        return;
      }

      await interaction.editReply({ embeds: [buildMedalsEmbed(player)] });
    } catch (error) {
      logger.error(`Erro no botão Medalhas (${username}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível buscar as medalhas agora.` })
        .catch(() => {});
    }
  },
};
