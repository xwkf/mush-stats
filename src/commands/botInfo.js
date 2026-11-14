import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { fileURLToPath } from 'node:url';
import { getEmoji, getEmojiData } from '../services/applicationEmojis.js';

const IMAGE_PATH = fileURLToPath(new URL('../../assets/bot-info.png', import.meta.url));
const FOOTER_PATH = fileURLToPath(new URL('../../assets/footer.png', import.meta.url));
const numberFormatter = new Intl.NumberFormat('pt-BR');

async function getGuildCount(client) {
  if (!client.shard) return client.guilds.cache.size;

  try {
    const counts = await client.shard.fetchClientValues('guilds.cache.size');
    return counts.reduce((total, count) => total + count, 0);
  } catch {
    return client.guilds.cache.size;
  }
}

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('bot-info')
    .setDescription('⌈Mush⌋ Informações sobre o bot.'),
  async execute(interaction) {
    await interaction.deferReply();

    const clientId = interaction.client.application?.id ?? interaction.client.user.id;
    const authorizeUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}`;
    const guildCount = await getGuildCount(interaction.client);
    const commandCount = interaction.client.commands.size;

    const description = [
      `${getEmoji('Ticket')} **|** Em **${numberFormatter.format(guildCount)} ${guildCount === 1 ? 'servidor' : 'servidores'}** com incríveis **${numberFormatter.format(commandCount)} ${commandCount === 1 ? 'comando' : 'comandos'}**!`,
      `${getEmoji('Shine1')} **|** Rodando no Cluster **Welly** e na Shard **3**!`,
      '',
      `${getEmoji('Config')} **|** Fui programado em **[NodeJS](https://nodejs.org/)** usando a biblioteca **[discord.js](https://discord.js.org/#/)**.`,
      `${getEmoji('Person')} **|** Clique **[aqui](${authorizeUrl})** para me adicionar no seu servidor!`,
    ].join('\n');

    const embed = new EmbedBuilder()
      .setColor(16532596)
      .setTitle(`${getEmoji('MushInfo')}・Informações: Mush Stats`)
      .setDescription(description)
      .setImage('attachment://bot-info.png')
      .setFooter({
        text: 'Desenvolvido por xwqk',
        iconURL: 'attachment://footer.png',
      });

    const addButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Me adicione')
      .setURL(authorizeUrl);

    const buttonEmoji = getEmojiData('MushAdd');
    if (buttonEmoji) addButton.setEmoji(buttonEmoji);

    const row = new ActionRowBuilder().addComponents(addButton);
    const imageAttachment = new AttachmentBuilder(IMAGE_PATH).setName('bot-info.png');
    const footerAttachment = new AttachmentBuilder(FOOTER_PATH).setName('footer.png');

    await interaction.editReply({
      embeds: [embed],
      components: [row],
      files: [imageAttachment, footerAttachment],
    });
  },
};
