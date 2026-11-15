import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import {
  LEADERBOARD_GAMES,
  LEADERBOARD_GAMES_BY_KEY,
  getModeChoices,
  getTypeChoices,
  getVariant,
} from '../constants/leaderboards.js';
import { getEmoji } from '../services/applicationEmojis.js';
import { fetchLeaderboardTop } from '../services/leaderboard.js';
import { renderLeaderboardImage } from '../services/leaderboardImage.js';

const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('⌈Mush⌋ Veja as leaderboards do Mush.');

for (const game of LEADERBOARD_GAMES) {
  data.addSubcommand((subcommand) =>
    subcommand
      .setName(game.key)
      .setDescription(`⌈Mush⌋ Veja a leaderboard do ${game.label}!`)
      .addStringOption((option) =>
        option
          .setName('modo')
          .setDescription('Escolha o modo do ranking.')
          .setRequired(false)
          .addChoices(...getModeChoices(game)),
      )
      .addStringOption((option) =>
        option
          .setName('tipo')
          .setDescription('Escolha a estatística do ranking.')
          .setRequired(false)
          .addChoices(...getTypeChoices(game)),
      ),
  );
}

export default {
  cooldown: 5,
  data,
  async execute(interaction) {
    const loadingEmoji = getEmoji('Relogiozinho') || '⏳';
    const errorEmoji = getEmoji('Errado') || '❌';

    await interaction.reply({ content: `${loadingEmoji} **»** Carregando...` });

    const game = LEADERBOARD_GAMES_BY_KEY.get(interaction.options.getSubcommand());

    try {
      if (!game) {
        await interaction.editReply({ content: `${errorEmoji} **»** Leaderboard inválida.` });
        return;
      }

      const modeKey = interaction.options.getString('modo');
      const requestedType = interaction.options.getString('tipo');
      let variant = modeKey ? getVariant(game, modeKey) : game.variants[0];

      if (!variant) {
        await interaction.editReply({ content: `${errorEmoji} **»** Modo inválido.` });
        return;
      }

      if (requestedType && !modeKey) {
        const typeVariant = game.variants.find((item) =>
          item.columns.some((column) => column.key === requestedType),
        );

        if (typeVariant) variant = typeVariant;
      }

      const type = variant.columns.find((column) => column.key === requestedType);
      const selectedType = type ?? variant.columns[0];

      if (requestedType && !type) {
        await interaction.editReply({
          content: `${errorEmoji} **»** Esse tipo não existe no modo **${variant.label}**.`,
        });
        return;
      }

      const entries = await fetchLeaderboardTop(game, variant, selectedType.key, 10);

      if (!entries?.length) {
        await interaction.editReply({
          content: `${errorEmoji} **»** Não foi possível buscar a leaderboard agora.`,
        });
        return;
      }

      const image = await renderLeaderboardImage(
        entries,
        variant.title ?? game.title,
        variant.columns,
      );

      await interaction.editReply({
        content: `${getEmoji('Cogumelo')} **»** Entre no **[Servidor de Suporte do BOT](<https://muu.sh/mushstats>)**!`,
        embeds: [],
        components: [],
        files: [
          new AttachmentBuilder(image, {
            name: `leaderboard-${game.key}-${variant.key}-${selectedType.key}.png`,
          }),
        ],
      });
    } catch (error) {
      logger.error(`Erro no comando /leaderboard ${game?.key}:`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível gerar a leaderboard agora.` })
        .catch(() => {});
    }
  },
};
