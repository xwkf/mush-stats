import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import {
  LEADERBOARD_GAMES,
  LEADERBOARD_GAMES_BY_KEY,
  LEADERBOARD_TYPES,
} from '../constants/leaderboards.js';
import { getEmoji } from '../services/applicationEmojis.js';
import { fetchLeaderboardTop } from '../services/leaderboard.js';
import { renderLeaderboardImage } from '../services/leaderboardImage.js';

const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('⌈Mush⌋ Veja as leaderboards do Mush.');

for (const game of LEADERBOARD_GAMES) {
  data.addSubcommand((subcommand) => {
    subcommand
      .setName(game.key)
      .setDescription(`⌈Mush⌋ Veja a leaderboard do ${game.label}!`);

    if (game.modes.length > 1) {
      subcommand.addStringOption((option) =>
        option
          .setName('modo')
          .setDescription(`Modo do ${game.label}`)
          .setRequired(true)
          .addChoices(...game.modes.map((mode) => ({ name: mode.label, value: mode.key }))),
      );
    }

    return subcommand.addStringOption((option) =>
      option
        .setName('tipo')
        .setDescription('Período do ranking (padrão: Geral)')
        .setRequired(false)
        .addChoices(...LEADERBOARD_TYPES.map((type) => ({ name: type.label, value: type.key }))),
    );
  });
}

export default {
  cooldown: 5,
  data,
  async execute(interaction) {
    const loadingEmoji = getEmoji('Relogiozinho') || '⏳';
    const errorEmoji = getEmoji('Errado') || '❌';

    await interaction.reply({ content: `${loadingEmoji} **»** Carregando...` });

    const game = LEADERBOARD_GAMES_BY_KEY.get(interaction.options.getSubcommand());
    const modeKey = interaction.options.getString('modo');
    const typeKey = interaction.options.getString('tipo') ?? 'general';
    const mode = game?.modes.find((item) => item.key === modeKey) ?? game?.modes[0];
    const type = LEADERBOARD_TYPES.find((item) => item.key === typeKey) ?? LEADERBOARD_TYPES[0];

    try {
      const entries = game ? await fetchLeaderboardTop(game, mode, type, 10) : null;

      if (!entries?.length) {
        await interaction.editReply({
          content: `${errorEmoji} **»** Não foi possível buscar a leaderboard agora.`,
        });
        return;
      }

      const title = [...game.title];
      const extras = [mode.key !== 'general' ? mode.label : null, type.key !== 'general' ? type.label : null]
        .filter(Boolean)
        .join(' - ')
        .toUpperCase();

      if (extras) title.push({ text: `- ${extras}`, color: '#aaaaaa' });

      const image = await renderLeaderboardImage(entries, title, game.columns);

      await interaction.editReply({
        content: `${getEmoji('Cogumelo')} **»** Entre no **[Servidor de Suporte do BOT](<https://muu.sh/mushstats>)**!`,
        embeds: [],
        components: [],
        files: [
          new AttachmentBuilder(image, { name: `leaderboard-${game.key}-${mode.key}-${type.key}.png` }),
        ],
      });
    } catch (error) {
      logger.error(`Erro no comando /leaderboard ${game?.key} (${mode?.key}/${type.key}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível gerar a leaderboard agora.` })
        .catch(() => {});
    }
  },
};
