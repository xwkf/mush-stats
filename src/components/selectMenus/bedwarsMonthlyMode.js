import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import {
  buildBedwarsMonthlyEmbed,
  buildBedwarsMonthlyModeSelect,
} from '../../services/bedwarsMenu.js';
import { fetchPlayer } from '../../services/mush.js';
import { getFooterIcon } from '../../utils/footer.js';

export default {
  customId: 'bedwars_monthly_mode',
  async execute(interaction) {
    const username = interaction.customId.split(':')[1];
    const mode = interaction.values[0] ?? 'total';
    const errorEmoji = getEmoji('Errado') || '❌';

    await interaction.deferUpdate();

    try {
      const player = username ? await fetchPlayer(username) : null;

      if (!player) {
        await interaction.followUp({
          content: `${errorEmoji} **»** Jogador não encontrado.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const footerIcon = await getFooterIcon(interaction.client);

      await interaction.editReply({
        embeds: [buildBedwarsMonthlyEmbed(player, footerIcon, mode)],
        components: [buildBedwarsMonthlyModeSelect(player.account.username, mode)],
      });
    } catch (error) {
      logger.error(`Erro no select de Bed Wars Mensal (${username}/${mode}):`, error);
      await interaction
        .followUp({
          content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
};
