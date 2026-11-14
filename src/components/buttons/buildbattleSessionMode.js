import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import {
  buildBuildBattleSessionEmbed,
  buildBuildBattleSessionModeButtons,
} from '../../services/buildbattleMenu.js';
import { getActiveBuildBattleSession } from '../../services/buildbattleSessions.js';
import { fetchPlayer } from '../../services/mush.js';
import { getFooterIcon } from '../../utils/footer.js';

export default {
  customId: 'buildbattle_session',
  async execute(interaction) {
    const [, discordId, mode = 'total'] = interaction.customId.split(':');
    const errorEmoji = getEmoji('Errado') || '❌';

    if (!discordId || discordId !== interaction.user.id) {
      await interaction.reply({
        content: `${errorEmoji} **»** Este menu não pertence a você.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferUpdate();

    try {
      const session = getActiveBuildBattleSession(discordId);

      if (!session) {
        await interaction.followUp({
          content: `${errorEmoji} **»** Sessão não encontrada. Use \`/buildbattle sessao\` para iniciar uma nova.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const player = await fetchPlayer(session.username);

      if (!player) {
        await interaction.followUp({
          content: `${errorEmoji} **»** Jogador da sessão não encontrado.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const footerIcon = await getFooterIcon(interaction.client);

      await interaction.editReply({
        embeds: [buildBuildBattleSessionEmbed(player, footerIcon, session.baseline, mode)],
        components: [buildBuildBattleSessionModeButtons(discordId, mode)],
      });
    } catch (error) {
      logger.error(`Erro no botão do Build Battle Sessão (${discordId}/${mode}):`, error);
      await interaction
        .followUp({
          content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
};
