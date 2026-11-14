import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import { getEmoji } from '../services/applicationEmojis.js';
import {
  buildBedwarsDailyEmbed,
  buildBedwarsGeneralEmbed,
  buildBedwarsGeneralModeSelect,
  buildBedwarsModeSelect,
  buildBedwarsMissionsEmbed,
  buildBedwarsMissionsSelect,
  buildBedwarsMonthlyEmbed,
  buildBedwarsMonthlyModeSelect,
} from '../services/bedwarsMenu.js';
import { fetchBedwarsXpTable, fetchMissions } from '../services/mush.js';
import { resolvePlayer } from '../services/playerResolver.js';
import { getFooterIcon } from '../utils/footer.js';

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('bedwars')
    .setDescription('⌈Mush⌋ Verifique as estatísticas de um jogador no Bed Wars.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('geral')
        .setDescription('⌈Mush⌋ Verifique as estatisticas Gerais de um jogador no Bed Wars')
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
        .setDescription('⌈Mush⌋ Verifique as estatisticas Mensais de um jogador no Bed Wars.')
        .addStringOption((option) =>
          option
            .setName('nick')
            .setDescription('Nick do jogador (opcional)')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('missoes')
        .setDescription('⌈Mush⌋ Verifique as missões de um jogador no Bed Wars.')
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
        .setDescription('⌈Mush⌋ Verifique as estatisticas Diarias de um jogador no Bed Wars.')
        .addStringOption((option) =>
          option
            .setName('nick')
            .setDescription('Nick do jogador (opcional)')
            .setRequired(false),
        ),
    ),
  async execute(interaction) {
    const loadingEmoji = getEmoji('Relogiozinho') || '⏳';
    const errorEmoji = getEmoji('Errado') || '❌';
    const subcommand = interaction.options.getSubcommand();

    await interaction.reply({ content: `${loadingEmoji} **»** Carregando...` });

    const nick = interaction.options.getString('nick')?.trim();

    try {
      const player = await resolvePlayer(interaction.user, nick);

      if (!player) {
        const message = nick
          ? `Jogador \`${nick}\` não encontrado.`
          : `Nenhuma conta vinculada ao seu Discord foi encontrada. Use \`/bedwars ${subcommand} <nick>\` uma vez para vincular.`;

        await interaction.editReply({ content: `${errorEmoji} **»** ${message}` });
        return;
      }

      const footerIcon = await getFooterIcon(interaction.client);

      if (subcommand === 'geral') {
        const xpTable = await fetchBedwarsXpTable();

        await interaction.editReply({
          content: '',
          embeds: [buildBedwarsGeneralEmbed(player, footerIcon, xpTable)],
          components: [buildBedwarsGeneralModeSelect(player.account.username)],
        });
        return;
      }

      if (subcommand === 'mensal') {
        await interaction.editReply({
          content: '',
          embeds: [buildBedwarsMonthlyEmbed(player, footerIcon)],
          components: [buildBedwarsMonthlyModeSelect(player.account.username)],
        });
        return;
      }

      if (subcommand === 'missoes') {
        const missions = await fetchMissions(player.account.username);

        if (!missions) {
          await interaction.editReply({
            content: `${errorEmoji} **»** Não foi possível buscar as missões agora.`,
          });
          return;
        }

        await interaction.editReply({
          content: '',
          embeds: [buildBedwarsMissionsEmbed(player, missions, footerIcon)],
          components: [buildBedwarsMissionsSelect(player.account.username)],
        });
        return;
      }

      await interaction.editReply({
        content: '',
        embeds: [buildBedwarsDailyEmbed(player, footerIcon)],
        components: [buildBedwarsModeSelect(player.account.username)],
      });
    } catch (error) {
      logger.error(`Erro no comando /bedwars ${subcommand} (${nick ?? interaction.user.id}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.` })
        .catch(() => {});
    }
  },
};
