import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { getEmoji } from './applicationEmojis.js';

const MODES = [
  { key: 'total', label: 'Total', prefix: '' },
  { key: 'solo', label: 'Solo', prefix: 'solo' },
  { key: 'doubles', label: 'Duplas', prefix: 'doubles' },
  { key: 'pro', label: 'Pro', prefix: 'pro' },
];

const BUILD_BATTLE_COLOR = 0xaaaaaa;
const numberFormatter = new Intl.NumberFormat('pt-BR');

function parseColor(value, fallback = 0x5865f2) {
  if (!value) return fallback;

  const parsed = Number.parseInt(String(value).replace('#', ''), 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function getMode(modeKey) {
  return MODES.find((item) => item.key === modeKey) ?? MODES[0];
}

function getKey(prefix, field) {
  return prefix ? `${prefix}_${field}` : field;
}

function getGeneral(stats, prefix, field) {
  return Number(stats[getKey(prefix, field)] ?? 0);
}

function getPeriod(stats, field, period) {
  return Number(stats[`${field}_${period}`] ?? 0);
}

function getSessionValue(stats, baseline, field, prefix = '') {
  const key = getKey(prefix, field);
  const current = Number(stats[key] ?? 0);
  const initial = Number(baseline?.[key] ?? 0);

  return Math.max(0, current - initial);
}

function getLevelThreshold(level) {
  const numericLevel = Number(level) || 0;

  if (numericLevel <= 0) return 0;
  if (numericLevel <= 10) return numericLevel * 5000;

  return 250 * numericLevel * numericLevel + 3000 * numericLevel;
}

function getXpProgress(xp, level) {
  const currentXp = Number(xp) || 0;
  const numericLevel = Number(level) || 0;
  const floor = getLevelThreshold(numericLevel);
  const next = getLevelThreshold(numericLevel + 1);
  const earned = Math.max(0, Math.min(currentXp - floor, next - floor));

  return `[${formatNumber(earned)}/${formatNumber(next - floor)}]`;
}

function getLevelDisplay(level) {
  return `[${Number(level) || 0}✫]`;
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
  return `${icon ? `${icon}・` : ''}Build Battle (${label}): ${username}`;
}

function getWinRate(wins, played) {
  return played > 0 ? ((wins / played) * 100).toFixed(2) : '0.00';
}

function buildPeriodEmbed(player, footerIconURL, period, label) {
  const stats = player.stats?.buildbattle ?? {};
  const icon = getEmoji('icon_BuildBattle');
  const points = getPeriod(stats, 'points', period);
  const played = getPeriod(stats, 'played', period);
  const wins = getPeriod(stats, 'wins', period);
  const perfects = getPeriod(stats, 'perfects', period);
  const winstreak = getPeriod(stats, 'winstreak', period);

  const description = [
    `• **XP adquirido**: ${formatNumber(getPeriod(stats, 'xp', period))}`,
    '',
    `• **Pontos**: ${formatNumber(points)}`,
    `• **Partidas jogadas**: ${formatNumber(played)}`,
    '',
    `• **Primeiro lugar (Vitórias)**: ${formatNumber(wins)}`,
    `• **Votos Perfeitos (Recebidos)**: ${formatNumber(perfects)}`,
    `• **Winstreak**: ${formatNumber(winstreak)}`,
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

export function buildBuildBattleDailyEmbed(player, footerIconURL) {
  return buildPeriodEmbed(player, footerIconURL, 'daily', 'Diário');
}

export function buildBuildBattleMonthlyEmbed(player, footerIconURL) {
  return buildPeriodEmbed(player, footerIconURL, 'monthly', 'Mensal');
}

export function buildBuildBattleWeeklyEmbed(player, footerIconURL) {
  return buildPeriodEmbed(player, footerIconURL, 'weekly', 'Semanal');
}

export function buildBuildBattleGeneralEmbed(player, footerIconURL, modeKey = 'total') {
  const mode = getMode(modeKey);
  const stats = player.stats?.buildbattle ?? {};
  const icon = getEmoji('icon_BuildBattle');
  const level = Number(stats.level ?? 0);
  const xp = Number(stats.xp ?? 0);
  const points = getGeneral(stats, mode.prefix, 'points');
  const played = getGeneral(stats, mode.prefix, 'played');
  const wins = getGeneral(stats, mode.prefix, 'wins');
  const secondPlace = getGeneral(stats, mode.prefix, 'second_place');
  const thirdPlace = getGeneral(stats, mode.prefix, 'third_place');
  const losses = getGeneral(stats, mode.prefix, 'losses');
  const perfects = getGeneral(stats, mode.prefix, 'perfects');
  const winstreak = getGeneral(stats, mode.prefix, 'winstreak');
  const maxWinstreak = getGeneral(stats, mode.prefix, 'max_winstreak');

  const description = [
    `• **Nível**: ${getLevelDisplay(level)}`,
    `• **XP**: ${formatNumber(xp)} ➜ ${getXpProgress(xp, level)}`,
    '',
    `• **Pontos**: ${formatNumber(points)}`,
    `• **Partidas jogadas**: ${formatNumber(played)}`,
    '',
    `• **Primeiro lugar (Vitórias)**: ${formatNumber(wins)} (${getWinRate(wins, played)}%)`,
    `• **Segundo lugar**: ${formatNumber(secondPlace)}`,
    `• **Terceiro lugar**: ${formatNumber(thirdPlace)}`,
    `• **Derrotas**: ${formatNumber(losses)}`,
    '',
    `• **Votos Perfeitos (Recebidos)**: ${formatNumber(perfects)}`,
    `• **Winstreak**: ${formatNumber(winstreak)}`,
    `• **Maior Winstreak**: ${formatNumber(maxWinstreak)}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(BUILD_BATTLE_COLOR)
    .setTitle(getTitle(icon, 'Geral', player.account.username))
    .setDescription(description)
    .setThumbnail(getThumbnail(player))
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildBuildBattleSessionEmbed(player, footerIconURL, baseline, modeKey = 'total') {
  const mode = getMode(modeKey);
  const stats = player.stats?.buildbattle ?? {};
  const icon = getEmoji('icon_BuildBattle');
  const level = getSessionValue(stats, baseline, 'level');
  const xp = getSessionValue(stats, baseline, 'xp');
  const points = getSessionValue(stats, baseline, 'points', mode.prefix);
  const played = getSessionValue(stats, baseline, 'played', mode.prefix);
  const wins = getSessionValue(stats, baseline, 'wins', mode.prefix);
  const secondPlace = getSessionValue(stats, baseline, 'second_place', mode.prefix);
  const thirdPlace = getSessionValue(stats, baseline, 'third_place', mode.prefix);
  const losses = getSessionValue(stats, baseline, 'losses', mode.prefix);
  const perfects = getSessionValue(stats, baseline, 'perfects', mode.prefix);
  const winstreak = getSessionValue(stats, baseline, 'winstreak', mode.prefix);
  const maxWinstreak = getSessionValue(stats, baseline, 'max_winstreak', mode.prefix);

  const description = [
    `• **Níveis adquiridos**: ${formatNumber(level)}`,
    `• **XP adquirido**: ${formatNumber(xp)}`,
    `• **Pontos**: ${formatNumber(points)}`,
    '',
    `• **Partidas jogadas**: ${formatNumber(played)}`,
    '',
    `• **Primeiro lugar (Vitórias)**: ${formatNumber(wins)} (${getWinRate(wins, played)}%)`,
    `• **Segundo lugar**: ${formatNumber(secondPlace)}`,
    `• **Terceiro lugar**: ${formatNumber(thirdPlace)}`,
    `• **Derrotas**: ${formatNumber(losses)}`,
    '',
    `• **Votos Perfeitos (Recebidos)**: ${formatNumber(perfects)}`,
    `• **Winstreak**: ${formatNumber(winstreak)}`,
    `• **Maior Winstreak**: ${formatNumber(maxWinstreak)}`,
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

function buildModeButtons(identifier, selectedMode, customIdPrefix) {
  const buttons = MODES.map((mode) => {
    const button = new ButtonBuilder()
      .setCustomId(`${customIdPrefix}:${identifier}:${mode.key}`)
      .setLabel(mode.label)
      .setStyle(mode.key === selectedMode ? ButtonStyle.Success : ButtonStyle.Secondary);

    return button;
  });

  return new ActionRowBuilder().addComponents(buttons);
}

export function buildBuildBattleGeneralModeButtons(username, selectedMode = 'total') {
  return buildModeButtons(username, selectedMode, 'buildbattle_general');
}

export function buildBuildBattleSessionModeButtons(discordId, selectedMode = 'total') {
  return buildModeButtons(discordId, selectedMode, 'buildbattle_session');
}
