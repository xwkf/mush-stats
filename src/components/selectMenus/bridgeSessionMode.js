import { MessageFlags } from 'discord.js';
import { logger } from '../../core/logger.js';
import { getEmoji } from '../../services/applicationEmojis.js';
import {
  buildBridgeSessionEmbed,
  buildBridgeSessionModeSelect,
} from '../../services/bridgeMenu.js';
import { getActiveBridgeSession } from '../../services/bridgeSessions.js';
import { fetchPlayer } from '../../services/mush.js';
import { getFooterIcon } from '../../utils/footer.js';

export default {
  customId: 'bridge_session_mode',
  async execute(interaction) {
    const discordId = interaction.customId.split(':')[1];
    const mode = interaction.values[0] ?? 'total';
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
      const session = getActiveBridgeSession(discordId);

      if (!session) {
        await interaction.followUp({
          content: `${errorEmoji} **»** Sessão não encontrada. Use \`/bridge sessao\` para iniciar uma nova.`,
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
        embeds: [buildBridgeSessionEmbed(player, footerIcon, session.baseline, mode)],
        components: [buildBridgeSessionModeSelect(discordId, mode)],
      });
    } catch (error) {
      logger.error(`Erro no select do The Bridge Sessão (${discordId}/${mode}):`, error);
      await interaction
        .followUp({
          content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  },
};
