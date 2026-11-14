import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import { LEADERBOARD_GAMES, LEADERBOARD_GAMES_BY_KEY } from '../constants/leaderboards.js';
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
      .setDescription(`⌈Mush⌋ Veja a leaderboard do ${game.label}!`),
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
      const entries = game ? await fetchLeaderboardTop(game, 10) : null;

      if (!entries?.length) {
        await interaction.editReply({
          content: `${errorEmoji} **»** Não foi possível buscar a leaderboard agora.`,
        });
        return;
      }

      const image = await renderLeaderboardImage(entries, game.title, game.columns);

      await interaction.editReply({
        content: `${getEmoji('Cogumelo')} **»** Entre no **[Servidor de Suporte do BOT](<https://muu.sh/mushstats>)**!`,
        embeds: [],
        components: [],
        files: [new AttachmentBuilder(image, { name: `leaderboard-${game.key}.png` })],
      });
    } catch (error) {
      logger.error(`Erro no comando /leaderboard ${game?.key}:`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível gerar a leaderboard agora.` })
        .catch(() => {});
    }
  },
};
