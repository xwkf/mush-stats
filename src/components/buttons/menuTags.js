import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import { fetchPlayer } from '../../services/mush.js';
import { buildTagsMessage } from '../../services/mushMenu.js';

export default {
  customId: 'menu_tags',
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

      await interaction.editReply({ content: buildTagsMessage(player) });
    } catch (error) {
      logger.error(`Erro no botão Ver Tags (${username}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível buscar as tags agora.` })
        .catch(() => {});
    }
  },
};
