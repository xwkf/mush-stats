import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import { COMPARE_CHOICES, COMPARE_MODES_BY_KEY } from '../constants/compare.js';
import { getEmoji } from '../services/applicationEmojis.js';
import { renderCompareImage } from '../services/compareImage.js';
import { isValidNick, resolvePlayer } from '../services/playerResolver.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('comparar')
    .setDescription('⌈Mush⌋ Compare as estatísticas de dois jogadores em um modo de jogo.')
    .addStringOption((option) =>
      option
        .setName('modo')
        .setDescription('Modo de jogo que será comparado')
        .setRequired(true)
        .addChoices(...COMPARE_CHOICES),
    )
    .addStringOption((option) =>
      option.setName('nick1').setDescription('Nick do primeiro jogador').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('nick2').setDescription('Nick do segundo jogador').setRequired(true),
    ),
  async execute(interaction) {
    const loadingEmoji = getEmoji('Relogiozinho') || '⏳';
    const errorEmoji = getEmoji('Errado') || '❌';
    const botErrorEmoji = getEmoji('ErradoBOT') || errorEmoji;

    await interaction.reply({ content: `${loadingEmoji} **»** Carregando...` });

    const modeKey = interaction.options.getString('modo', true);
    const nick1 = interaction.options.getString('nick1', true).trim();
    const nick2 = interaction.options.getString('nick2', true).trim();

    try {
      const mode = COMPARE_MODES_BY_KEY.get(modeKey);

      if (!mode) {
        await interaction.editReply({ content: `${botErrorEmoji} **»** Modo de jogo inválido.` });
        return;
      }

      if (!isValidNick(nick1) || !isValidNick(nick2)) {
        await interaction.editReply({
          content: `${botErrorEmoji} **»** O nick inserido possui caracteres inválidas.`,
        });
        return;
      }

      const [player1, player2] = await Promise.all([
        resolvePlayer(interaction.user, nick1),
        resolvePlayer(interaction.user, nick2),
      ]);

      const missing = [
        [nick1, player1],
        [nick2, player2],
      ]
        .filter(([, player]) => !player)
        .map(([nick]) => `**${nick}**`);

      if (missing.length > 0) {
        await interaction.editReply({
          content: `${botErrorEmoji} **»** ${
            missing.length > 1 ? 'Estes jogadores não estão registrados' : 'Este jogador não está registrado'
          }: ${missing.join(', ')}.`,
        });
        return;
      }

      const image = await renderCompareImage(mode, player1, player2);
      const attachment = new AttachmentBuilder(image, {
        name: `comparar-${mode.key}-${player1.account.username}-vs-${player2.account.username}.png`,
      });

      await interaction.editReply({
        content: `${getEmoji('Cogumelo')} **»** Entre no **[Servidor de Suporte do BOT](<https://muu.sh/mushstats>)**!`,
        embeds: [],
        components: [],
        files: [attachment],
      });
    } catch (error) {
      logger.error(`Erro no comando /comparar ${modeKey} (${nick1} x ${nick2}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível comparar os jogadores agora.` })
        .catch(() => {});
    }
  },
};
