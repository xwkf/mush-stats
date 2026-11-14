import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import {
  buildBedwarsGeneralEmbed,
  buildBedwarsGeneralModeSelect,
} from '../../services/bedwarsMenu.js';
import { fetchBedwarsLeaderboard, fetchBedwarsXpTable, fetchPlayer, findBedwarsLeaderboardEntry } from '../../services/mush.js';
import { getFooterIcon } from '../../utils/footer.js';

export default {
  customId: 'bedwars_general_mode',
  async execute(interaction) {
    const username = interaction.customId.split(':')[1];
    const mode = interaction.values[0] ?? 'total';
    const errorEmoji = getEmoji('Errado') || '❌';

    await interaction.deferUpdate();

    try {
      const [player, xpTable, leaderboard] = await Promise.all([
        username ? fetchPlayer(username) : null,
        fetchBedwarsXpTable(),
        fetchBedwarsLeaderboard(),
      ]);

      if (!player) {
        await interaction.followUp({
          content: `${errorEmoji} **»** Jogador não encontrado.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const footerIcon = await getFooterIcon(interaction.client);
      const leaderboardEntry = findBedwarsLeaderboardEntry(leaderboard, player);

      await interaction.editReply({
        embeds: [buildBedwarsGeneralEmbed(player, footerIcon, xpTable, mode, leaderboardEntry)],
        components: [buildBedwarsGeneralModeSelect(player.account.username, mode)],
      });
    } catch (error) {
      logger.error(`Erro no select de Bed Wars Geral (${username}/${mode}):`, error);
      await interaction
        .followUp({
          content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
};
