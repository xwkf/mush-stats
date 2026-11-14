import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import {
  buildBedwarsMissionsEmbed,
  buildBedwarsMissionsSelect,
} from '../../services/bedwarsMenu.js';
import { fetchMissions, fetchPlayer } from '../../services/mush.js';
import { getFooterIcon } from '../../utils/footer.js';

export default {
  customId: 'bedwars_missions_mode',
  async execute(interaction) {
    const username = interaction.customId.split(':')[1];
    const mode = interaction.values[0] ?? 'total';
    const errorEmoji = getEmoji('Errado') || '❌';

    await interaction.deferUpdate();

    try {
      const [player, missions] = await Promise.all([
        username ? fetchPlayer(username) : null,
        username ? fetchMissions(username) : null,
      ]);

      if (!player || !missions) {
        await interaction.followUp({
          content: `${errorEmoji} **»** Não foi possível buscar as missões agora.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const footerIcon = await getFooterIcon(interaction.client);

      await interaction.editReply({
        embeds: [buildBedwarsMissionsEmbed(player, missions, footerIcon, mode)],
        components: [buildBedwarsMissionsSelect(player.account.username, mode)],
      });
    } catch (error) {
      logger.error(`Erro no select de missões do Bed Wars (${username}/${mode}):`, error);
      await interaction
        .followUp({
          content: `${errorEmoji} **»** Não foi possível buscar as missões agora.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
};
