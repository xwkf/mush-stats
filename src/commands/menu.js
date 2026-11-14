import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../core/logger.js';
import { getEmoji } from '../services/applicationEmojis.js';
import { buildLinkAccountEmbed } from '../services/linkAccountEmbed.js';
import { getLinkedNick, saveLink } from '../services/links.js';
import { fetchParkour, fetchPlayer } from '../services/mush.js';
import { isValidNick } from '../services/playerResolver.js';
import { buildMenuButtons, buildMenuEmbed } from '../services/mushMenu.js';

const FOOTER_USER_ID = '1458632297380057316';
const FALLBACK_FOOTER_ICON =
  'https://cdn.discordapp.com/avatars/1458632297380057316/59ba9befc8cf24479b0e4eda18819e5a.png?size=2048';

async function getFooterIcon(client) {
  try {
    const user = await client.users.fetch(FOOTER_USER_ID);
    return user.displayAvatarURL({ size: 256, extension: 'png' });
  } catch {
    return FALLBACK_FOOTER_ICON;
  }
}

function getNickCandidates(user) {
  const candidates = [user.username, user.globalName]
    .filter((value) => typeof value === 'string')
    .filter((value) => isValidNick(value));

  return [...new Set(candidates)];
}

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('⌈Mush⌋ Verifique informações de um jogador.')
    .addStringOption((option) =>
      option
        .setName('nick')
        .setDescription('Nick do jogador (opcional)')
        .setRequired(false),
    ),
  async execute(interaction) {
    const loadingEmoji = getEmoji('Relogiozinho') || '⏳';
    const errorEmoji = getEmoji('Errado') || '❌';
    const botErrorEmoji = getEmoji('ErradoBOT') || errorEmoji;

    await interaction.reply({ content: `${loadingEmoji} **»** Carregando...` });

    const nick = interaction.options.getString('nick')?.trim();

    try {
      if (nick && !isValidNick(nick)) {
        await interaction.editReply({
          content: `${botErrorEmoji} **»** O nick inserido possui caracteres inválidas.`,
        });
        return;
      }

      let player = null;

      if (nick) {
        player = await fetchPlayer(nick);
      } else {
        const linkedNick = getLinkedNick(interaction.user.id);
        if (linkedNick) player = await fetchPlayer(linkedNick);

        if (!player) {
          for (const candidate of getNickCandidates(interaction.user)) {
            const candidatePlayer = await fetchPlayer(candidate);

            if (candidatePlayer?.discord?.id === interaction.user.id) {
              player = candidatePlayer;
              break;
            }
          }
        }
      }

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

      if (player.discord?.id) {
        saveLink(player.discord.id, player.account.username);
      }

      const parkour = await fetchParkour(player.account.username);
      const footerIcon = await getFooterIcon(interaction.client);

      await interaction.editReply({
        content: '',
        embeds: [buildMenuEmbed(player, parkour, footerIcon)],
        components: [buildMenuButtons(player.account.username)],
      });
    } catch (error) {
      logger.error(`Erro no comando /menu (${nick ?? interaction.user.id}):`, error);
      await interaction
        .editReply({ content: `${errorEmoji} **»** Não foi possível buscar o jogador agora.` })
        .catch(() => {});
    }
  },
};
