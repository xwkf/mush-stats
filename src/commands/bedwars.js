import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from 'discord.js';
import { logger } from '../core/logger.js';
import { getEmoji, getEmojiData } from '../services/applicationEmojis.js';
import {
  buildBedwarsDailyEmbed,
  buildBedwarsGeneralEmbed,
  buildBedwarsGeneralModeSelect,
  buildBedwarsModeSelect,
  buildBedwarsMissionsEmbed,
  buildBedwarsMissionsSelect,
  buildBedwarsMonthlyEmbed,
  buildBedwarsMonthlyModeSelect,
  buildBedwarsSessionEmbed,
  buildBedwarsSessionModeSelect,
  buildBedwarsWeeklyEmbed,
  buildBedwarsWeeklyModeSelect,
} from '../services/bedwarsMenu.js';
import { ensureSession } from '../services/bedwarsSessions.js';
import { renderQuickBuyImage } from '../services/bedwarsQuickBuyImage.js';
import { buildLinkAccountEmbed } from '../services/linkAccountEmbed.js';
import {
  fetchBedwarsLeaderboard,
  fetchBedwarsQuickBuy,
  fetchBedwarsXpTable,
  fetchMissions,
  findBedwarsLeaderboardEntry,
} from '../services/mush.js';
import { isValidNick, resolvePlayer } from '../services/playerResolver.js';
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
        .setName('semanal')
        .setDescription('⌈Mush⌋ Verifique as estatisticas Semanais de um jogador no Bed Wars.')
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
        .setDescription('⌈Mush⌋ Verifique as estatisticas por Sessão no Bed Wars.'),
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
        .setName('quickbuy')
        .setDescription('⌈Mush⌋ Verifique o menu de Compra Rápida de um jogador no Bed Wars.')
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
        const [xpTable, leaderboard] = await Promise.all([
          fetchBedwarsXpTable(),
          fetchBedwarsLeaderboard(),
        ]);
        const leaderboardEntry = findBedwarsLeaderboardEntry(leaderboard, player);

        await interaction.editReply({
          content: '',
          embeds: [buildBedwarsGeneralEmbed(player, footerIcon, xpTable, 'total', leaderboardEntry)],
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

      if (subcommand === 'quickbuy') {
        const quickBuy = await fetchBedwarsQuickBuy(player.account.username);

        if (!quickBuy) {
          await interaction.editReply({
            content: `${errorEmoji} **»** Não foi possível buscar a Compra Rápida agora.`,
          });
          return;
        }

        const image = await renderQuickBuyImage(player, quickBuy);
        const attachment = new AttachmentBuilder(image, {
          name: `quickbuy-${player.account.username}.png`,
        });
        const code = quickBuy.quick_buy_layout?.code;
        const components = [];

        if (code) {
          const quickBuyEmoji = getEmojiData('QuickBuy');
          const button = new ButtonBuilder()
            .setCustomId(`quickbuy_copy:${interaction.user.id}:${code}`)
            .setLabel('Copiar Menu')
            .setStyle(ButtonStyle.Secondary);

          if (quickBuyEmoji) {
            button.setEmoji({ id: quickBuyEmoji.id, name: 'QuickBuy' });
          }

          components.push(new ActionRowBuilder().addComponents(button));
        }

        await interaction.editReply({
          content: `${getEmoji('Cogumelo')} **»** Entre no **[Servidor de Suporte do BOT](<https://muu.sh/mushstats>)**!`,
          embeds: [],
          components,
          files: [attachment],
        });
        return;
      }

      if (subcommand === 'semanal') {
        await interaction.editReply({
          content: '',
          embeds: [buildBedwarsWeeklyEmbed(player, footerIcon)],
          components: [buildBedwarsWeeklyModeSelect(player.account.username)],
        });
        return;
      }

      if (subcommand === 'sessao') {
        const session = ensureSession(interaction.user.id, player);

        await interaction.editReply({
          content: '',
          embeds: [buildBedwarsSessionEmbed(player, footerIcon, session.baseline)],
          components: [buildBedwarsSessionModeSelect(interaction.user.id)],
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
