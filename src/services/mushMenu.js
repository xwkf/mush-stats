import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getEmoji, getEmojiData } from './applicationEmojis.js';
import { getMedalDisplay, getMedalEmoji } from '../constants/medals.js';
import { formatTagLabels, getTagLabels } from '../constants/tags.js';

export function parseColor(value, fallback = 0x5865f2) {
  if (!value) return fallback;

  const parsed = Number.parseInt(String(value).replace('#', ''), 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function formatTimestamp(value) {
  if (!value) return 'Não disponível.';
  return `<t:${Math.floor(Number(value) / 1000)}:R>`;
}

function plural(value, singular, pluralForm) {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function formatParkour(parkour) {
  if (!parkour) return 'Não disponível.';

  const times = Object.values(parkour)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (times.length === 0) return 'Não disponível.';

  const total = Math.min(...times);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const parts = [];
  if (hours > 0) parts.push(plural(hours, 'hora', 'horas'));
  if (minutes > 0) parts.push(plural(minutes, 'minuto', 'minutos'));
  if (seconds > 0 || parts.length === 0) parts.push(plural(seconds, 'segundo', 'segundos'));

  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`;
}

export function buildMenuEmbed(player, parkour, footerIconURL) {
  const uuid = (player.account.unique_id ?? '').replaceAll('-', '');
  const slim = player.skin?.slim ? 'true' : 'false';
  const rank = player.rank_tag?.name ?? 'Membro';
  const profileTag = player.profile_tag?.name ?? rank;
  const accountType = player.account.type === 'premium' ? 'Original' : 'Pirata';
  const discord = player.discord?.id ? `<@${player.discord.id}>` : null;
  const clan = player.clan ? `[${player.clan.tag}] ${player.clan.name}` : 'Sem clan';
  const friends = `${player.friends?.count ?? 0}/${player.friends?.limit ?? 200}`;
  const muted = player.muted ?? player.silenced ?? false;
  const mutes = player.mute_count ?? player.mutes ?? 0;
  const blacklistBans = player.ban_blacklist_count ?? 0;

  const description = [
    `\`•\` **Rank**: ${rank}`,
    `\`•\` **Tag de Perfil**: ${profileTag}`,
    `\`•\` **Medalha selecionada**: ${getMedalDisplay(player.medal)}`,
    `\`•\` **Conta**: ${accountType}`,
    `\`•\` **Online**: ${player.connected ? 'Sim' : 'Não'}`,
    ...(discord ? [`\`•\` **Discord vinculado**: ${discord}`] : []),
    `\`•\` **Clan**: ${clan}`,
    `\`•\` **Amigos**: ${friends}`,
    `\`•\` **Skin**: [Clique aqui](https://mc-heads.net/download/${uuid})`,
    '',
    `\`•\` **Recorde do Parkour**: ${formatParkour(parkour)}`,
    `\`•\` **Primeiro login**: ${formatTimestamp(player.first_login)}`,
    `\`•\` **Último login**: ${formatTimestamp(player.last_login)}`,
    '',
    `\`•\` **Banido**: ${player.banned ? 'Sim' : 'Não'}`,
    `\`•\` **Silenciado**: ${muted ? 'Sim' : 'Não'}`,
    `\`•\` **Bans para Blacklist (#)**: ${blacklistBans}/3`,
    `\`•\` **Contagem de Mutes (#)**: ${mutes}`,
  ].join('\n');

  const color = parseColor(player.profile_tag?.color ?? player.rank_tag?.color);
  const titleIcon = getEmoji('Minecraft');

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${titleIcon ? `${titleIcon}・` : ''}Menu: ${player.account.username}`)
    .setDescription(description)
    .setThumbnail(`https://visage.surgeplay.com/face/256/${uuid}?y=-40&slim=${slim}`)
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildMenuButtons(username) {
  const tagsButton = new ButtonBuilder()
    .setCustomId(`menu_tags:${username}`)
    .setLabel('Ver Tags')
    .setStyle(ButtonStyle.Secondary);

  const medalsButton = new ButtonBuilder()
    .setCustomId(`menu_medals:${username}`)
    .setLabel('Ver Medalhas')
    .setStyle(ButtonStyle.Secondary);

  const tagsEmoji = getEmojiData('Etiqueta');
  if (tagsEmoji) tagsButton.setEmoji(tagsEmoji);

  const medalsEmoji = getEmojiData('Medals');
  if (medalsEmoji) medalsButton.setEmoji(medalsEmoji);

  return new ActionRowBuilder().addComponents(tagsButton, medalsButton);
}

export function buildTagsMessage(player) {
  const labels = getTagLabels(player.tags ?? []);
  const header = `### ${getEmoji('Etiqueta')} **»** Tags de **${player.account.username}** (${labels.length}):`;
  const line = labels.length ? `**➜** ${formatTagLabels(labels)}` : '**➜** Nenhuma tag.';
  return `${header}\n${line}`;
}

export function buildMedalsEmbed(player) {
  const medals = [...new Set(player.medals ?? [])]
    .filter((medal) => medal !== 'empty')
    .map(getMedalEmoji)
    .filter(Boolean);
  const header = `### ${getEmoji('Medals')} **»** Medalhas de **${player.account.username}** (${medals.length}):`;
  const description = medals.length
    ? `${header}\n${medals.join(', ')}`
    : `${header}\nNenhuma medalha.`;

  return new EmbedBuilder()
    .setColor(parseColor(player.profile_tag?.color ?? player.rank_tag?.color))
    .setDescription(description);
}
