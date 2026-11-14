import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import {
  buildBuildBattleGeneralEmbed,
  buildBuildBattleGeneralModeButtons,
} from '../../services/buildbattleMenu.js';
import { fetchPlayer } from '../../services/mush.js';
import { getFooterIcon } from '../../utils/footer.js';

export default {
  customId: 'buildbattle_general',
  async execute(interaction) {
    const [, username, mode = 'total'] = interaction.customId.split(':');
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
        embeds: [buildBuildBattleGeneralEmbed(player, footerIcon, mode)],
        components: [buildBuildBattleGeneralModeButtons(player.account.username, mode)],
      });
    } catch (error) {
      logger.error(`Erro no botão do Build Battle Geral (${username}/${mode}):`, error);
      await interaction
        .followUp({
          content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
};
