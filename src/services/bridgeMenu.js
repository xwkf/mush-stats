import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getEmoji, getEmojiData } from './applicationEmojis.js';

const MODES = [
  { key: 'total', label: 'The Bridge: Total', prefix: 'bridge' },
  { key: '1v1', label: 'The Bridge: 1v1', prefix: 'bridge_solo' },
  { key: '2v2', label: 'The Bridge: 2v2', prefix: 'bridge_doubles' },
  { key: '3v3', label: 'The Bridge: 3v3', prefix: 'bridge_three' },
  { key: '4v4', label: 'The Bridge: 4v4', prefix: 'bridge_four' },
];

const LEGACY_COLORS = {
  0: 0x000000,
  1: 0x0000aa,
  2: 0x00aa00,
  3: 0x00aaaa,
  4: 0xaa0000,
  5: 0xaa00aa,
  6: 0xffaa00,
  7: 0xaaaaaa,
  8: 0x555555,
  9: 0x5555ff,
  a: 0x55ff55,
  b: 0x55ffff,
  c: 0xff5555,
  d: 0xff55ff,
  e: 0xffff55,
  f: 0xffffff,
};

const numberFormatter = new Intl.NumberFormat('pt-BR');

function parseColor(value, fallback = 0x5865f2) {
  if (!value) return fallback;

  const parsed = Number.parseInt(String(value).replace('#', ''), 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseColorValue(value) {
  if (!value) return null;

  const parsed = Number.parseInt(String(value).replace('#', ''), 16);
  return Number.isNaN(parsed) ? null : parsed;
}

function getLevelColor(levelBadge, fallback) {
  const hex = parseColorValue(levelBadge?.hex_color);
  if (hex !== null) return hex;

  const match = String(levelBadge?.format ?? '').match(/&([0-9a-f])/i);
  if (match) return LEGACY_COLORS[match[1].toLowerCase()] ?? fallback;

  return fallback;
}

function getLevelDisplay(levelBadge, level) {
  if (levelBadge?.format) {
    return String(levelBadge.format).replace(/&[0-9a-fk-or]/gi, '');
  }

  return `[${level ?? 0}]`;
}

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function formatRatio(numerator, denominator) {
  const value = denominator > 0 ? numerator / denominator : numerator > 0 ? numerator : 0;
  return value.toFixed(2);
}

function getMode(modeKey) {
  return MODES.find((item) => item.key === modeKey) ?? MODES[0];
}

function getPeriod(stats, prefix, field, period) {
  const key = `${prefix}_${field}_${period}`;
  return Number(stats[key] ?? 0);
}

function getGeneral(stats, prefix, field) {
  const key = `${prefix}_${field}`;
  return Number(stats[key] ?? 0);
}

function getSessionValue(stats, baseline, prefix, field) {
  const key = `${prefix}_${field}`;
  const current = Number(stats[key] ?? 0);
  const initial = Number(baseline?.[key] ?? 0);

  return Math.max(0, current - initial);
}

function getThumbnail(player) {
  const uuid = (player.account.unique_id ?? '').replaceAll('-', '');
  const slim = player.skin?.slim ? 'true' : 'false';

  return `https://visage.surgeplay.com/face/256/${uuid}?y=-40&slim=${slim}`;
}

function getPeriodColor(player) {
  return parseColor(player.profile_tag?.color ?? player.rank_tag?.color);
}

function getTitle(icon, label, username) {
  return `${icon ? `${icon}・` : ''}The Bridge (${label}): ${username}`;
}

function buildPeriodEmbed(player, footerIconURL, modeKey, period, label) {
  const mode = getMode(modeKey);
  const stats = player.stats?.duels ?? {};
  const icon = getEmoji('TheBridge');

  const description = [
    `• **XP adquirido**: ${formatNumber(getPeriod(stats, mode.prefix, 'xp', period))}`,
    '',
    `• **Abates**: ${formatNumber(getPeriod(stats, mode.prefix, 'kills', period))}`,
    `• **Vitórias**: ${formatNumber(getPeriod(stats, mode.prefix, 'wins', period))}`,
    `• **Winstreak**: ${formatNumber(getPeriod(stats, mode.prefix, 'winstreak', period))}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(getPeriodColor(player))
    .setTitle(getTitle(icon, label, player.account.username))
    .setDescription(description)
    .setThumbnail(getThumbnail(player))
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildBridgeDailyEmbed(player, footerIconURL, modeKey = 'total') {
  return buildPeriodEmbed(player, footerIconURL, modeKey, 'daily', 'Diário');
}

export function buildBridgeMonthlyEmbed(player, footerIconURL, modeKey = 'total') {
  return buildPeriodEmbed(player, footerIconURL, modeKey, 'monthly', 'Mensal');
}

export function buildBridgeWeeklyEmbed(player, footerIconURL, modeKey = 'total') {
  return buildPeriodEmbed(player, footerIconURL, modeKey, 'weekly', 'Semanal');
}

export function buildBridgeGeneralEmbed(player, footerIconURL, modeKey = 'total') {
  const mode = getMode(modeKey);
  const stats = player.stats?.duels ?? {};
  const icon = getEmoji('TheBridge');
  const level = Number(stats.bridge_level ?? 0);
  const levelBadge = stats.bridge_level_badge;
  const color = getLevelColor(levelBadge, getPeriodColor(player));

  const points = getGeneral(stats, mode.prefix, 'points');
  const kills = getGeneral(stats, mode.prefix, 'kills');
  const deaths = getGeneral(stats, mode.prefix, 'deaths');
  const wins = getGeneral(stats, mode.prefix, 'wins');
  const losses = getGeneral(stats, mode.prefix, 'losses');
  const played = getGeneral(stats, mode.prefix, 'played');
  const winstreak = getGeneral(stats, mode.prefix, 'winstreak');
  const maxWinstreak = getGeneral(stats, mode.prefix, 'max_winstreak');
  const winRate = played > 0 ? ((wins / played) * 100).toFixed(2) : '0.00';

  const description = [
    `• **Nível**: ${getLevelDisplay(levelBadge, level)}`,
    `• **Pontos**: ${formatNumber(points)}`,
    '',
    `• **Abates**: ${formatNumber(kills)}`,
    `• **Mortes**: ${formatNumber(deaths)}`,
    '',
    `• **Vitórias**: ${formatNumber(wins)} (${winRate}%)`,
    `• **Derrotas**: ${formatNumber(losses)}`,
    `• **Partidas jogadas**: ${formatNumber(played)}`,
    '',
    `• **Winstreak**: ${formatNumber(winstreak)}`,
    `• **Maior Winstreak**: ${formatNumber(maxWinstreak)}`,
    '',
    `• **KDR**: ${formatRatio(kills, deaths)}`,
    `• **WLR**: ${formatRatio(wins, losses)}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(getTitle(icon, 'Geral', player.account.username))
    .setDescription(description)
    .setThumbnail(getThumbnail(player))
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildBridgeSessionEmbed(player, footerIconURL, baseline, modeKey = 'total') {
  const mode = getMode(modeKey);
  const stats = player.stats?.duels ?? {};
  const icon = getEmoji('TheBridge');

  const levels = getSessionValue(stats, baseline, mode.prefix, 'level');
  const xp = getSessionValue(stats, baseline, mode.prefix, 'xp');
  const points = getSessionValue(stats, baseline, mode.prefix, 'points');
  const kills = getSessionValue(stats, baseline, mode.prefix, 'kills');
  const deaths = getSessionValue(stats, baseline, mode.prefix, 'deaths');
  const wins = getSessionValue(stats, baseline, mode.prefix, 'wins');
  const losses = getSessionValue(stats, baseline, mode.prefix, 'losses');
  const played = getSessionValue(stats, baseline, mode.prefix, 'played');
  const winstreak = getSessionValue(stats, baseline, mode.prefix, 'winstreak');
  const maxWinstreak = getSessionValue(stats, baseline, mode.prefix, 'max_winstreak');
  const winRate = played > 0 ? ((wins / played) * 100).toFixed(2) : '0.00';

  const description = [
    `• **Níveis adquiridos**: ${formatNumber(levels)}`,
    `• **XP adquirido**: ${formatNumber(xp)}`,
    `• **Pontos**: ${formatNumber(points)}`,
    '',
    `• **Abates**: ${formatNumber(kills)}`,
    `• **Mortes**: ${formatNumber(deaths)}`,
    '',
    `• **Vitórias**: ${formatNumber(wins)} (${winRate}%)`,
    `• **Derrotas**: ${formatNumber(losses)}`,
    `• **Partidas jogadas**: ${formatNumber(played)}`,
    '',
    `• **Winstreak**: ${formatNumber(winstreak)}`,
    `• **Maior Winstreak**: ${formatNumber(maxWinstreak)}`,
    '',
    `• **KDR**: ${formatRatio(kills, deaths)}`,
    `• **WLR**: ${formatRatio(wins, losses)}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(getPeriodColor(player))
    .setTitle(getTitle(icon, 'Sessão', player.account.username))
    .setDescription(description)
    .setThumbnail(getThumbnail(player))
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

function buildModeSelect(identifier, selectedMode, customId) {
  const options = MODES.map((mode) => {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(mode.label)
      .setValue(mode.key)
      .setDescription('Clique para selecionar.')
      .setDefault(mode.key === selectedMode);

    const emoji = getEmojiData('TheBridge');
    if (emoji) option.setEmoji(emoji);

    return option;
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`${customId}:${identifier}`)
    .setPlaceholder('Selecione um modo')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

export function buildBridgeModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bridge_mode');
}

export function buildBridgeGeneralModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bridge_general_mode');
}

export function buildBridgeMonthlyModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bridge_monthly_mode');
}

export function buildBridgeWeeklyModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bridge_weekly_mode');
}

export function buildBridgeSessionModeSelect(discordId, selectedMode = 'total') {
  return buildModeSelect(discordId, selectedMode, 'bridge_session_mode');
}
