import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import { getEmoji } from '../services/applicationEmojis.js';
import { ensureBridgeSession } from '../services/bridgeSessions.js';
import {
  buildBridgeDailyEmbed,
  buildBridgeGeneralEmbed,
  buildBridgeGeneralModeSelect,
  buildBridgeModeSelect,
  buildBridgeMonthlyEmbed,
  buildBridgeMonthlyModeSelect,
  buildBridgeSessionEmbed,
  buildBridgeSessionModeSelect,
  buildBridgeWeeklyEmbed,
  buildBridgeWeeklyModeSelect,
} from '../services/bridgeMenu.js';
import { buildLinkAccountEmbed } from '../services/linkAccountEmbed.js';
import { isValidNick, resolvePlayer } from '../services/playerResolver.js';
import { getFooterIcon } from '../utils/footer.js';

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('⌈Mush⌋ Verifique as estatísticas de um jogador no The Bridge.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('geral')
        .setDescription('⌈Mush⌋ Verifique as estatisticas Gerais de um jogador no The Bridge.')
        .addStringOption((option) =>
          option
            .setName('nick')
            .setDescription('Nick do jogador (opcional)')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('mensal')
        .setDescription('⌈Mush⌋ Verifique as estatisticas Mensais de um jogador no The Bridge.')
        .addStringOption((option) =>
          option
            .setName('nick')
            .setDescription('Nick do jogador (opcional)')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('semanal')
        .setDescription('⌈Mush⌋ Verifique as estatisticas Semanais de um jogador no The Bridge.')
        .addStringOption((option) =>
          option
            .setName('nick')
            .setDescription('Nick do jogador (opcional)')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('diario')
        .setDescription('⌈Mush⌋ Verifique as estatisticas Diarias de um jogador no The Bridge.')
        .addStringOption((option) =>
          option
            .setName('nick')
            .setDescription('Nick do jogador (opcional)')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sessao')
        .setDescription('⌈Mush⌋ Verifique as estatisticas por Sessão no The Bridge.'),
    ),
  async execute(interaction) {
    const loadingEmoji = getEmoji('Relogiozinho') || '⏳';
    const errorEmoji = getEmoji('Errado') || '❌';
    const botErrorEmoji = getEmoji('ErradoBOT') || errorEmoji;
    const subcommand = interaction.options.getSubcommand();

    await interaction.reply({ content: `${loadingEmoji} **»** Carregando...` });

    const nick = interaction.options.getString('nick')?.trim();

    try {
      if (nick && !isValidNick(nick)) {
        await interaction.editReply({
          content: `${botErrorEmoji} **»** O nick inserido possui caracteres inválidas.`,
        });
        return;
      }

      const player = await resolvePlayer(
        interaction.user,
        nick,
        subcommand === 'semanal' ? 'weekly' : undefined,
      );

      if (!player) {
        if (nick) {
          await interaction.editReply({
            content: `${botErrorEmoji} **»** Este jogador não está registrado.`,
          });
        } else {
          await interaction.editReply({ embeds: [buildLinkAccountEmbed()] });
        }
        return;
      }

      const footerIcon = await getFooterIcon(interaction.client);

      if (subcommand === 'geral') {
        await interaction.editReply({
          content: '',
          embeds: [buildBridgeGeneralEmbed(player, footerIcon)],
          components: [buildBridgeGeneralModeSelect(player.account.username)],
        });
        return;
      }

      if (subcommand === 'mensal') {
        await interaction.editReply({
          content: '',
          embeds: [buildBridgeMonthlyEmbed(player, footerIcon)],
          components: [buildBridgeMonthlyModeSelect(player.account.username)],
        });
        return;
      }

      if (subcommand === 'semanal') {
        await interaction.editReply({
          content: '',
          embeds: [buildBridgeWeeklyEmbed(player, footerIcon)],
          components: [buildBridgeWeeklyModeSelect(player.account.username)],
        });
        return;
      }

      if (subcommand === 'sessao') {
        const session = ensureBridgeSession(interaction.user.id, player);

        await interaction.editReply({
          content: '',
          embeds: [buildBridgeSessionEmbed(player, footerIcon, session.baseline)],
          components: [buildBridgeSessionModeSelect(interaction.user.id)],
        });
        return;
      }

      await interaction.editReply({
        content: '',
        embeds: [buildBridgeDailyEmbed(player, footerIcon)],
        components: [buildBridgeModeSelect(player.account.username)],
      });
    } catch (error) {
      logger.error(`Erro no comando /bridge ${subcommand} (${nick ?? interaction.user.id}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.` })
        .catch(() => {});
    }
  },
};
