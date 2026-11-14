import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getEmoji, getEmojiData } from './applicationEmojis.js';
import { getMissionLabel } from '../constants/bedwarsMissions.js';

const MODES = [
  { key: 'total', label: 'Bed Wars: Total', prefix: '', emoji: 'papel' },
  { key: 'mega', label: 'Bed Wars: Mega', prefix: 'mega', emoji: 'bedwars' },
  { key: 'solo', label: 'Bed Wars: Solo', prefix: 'solo', emoji: 'bedwars' },
  { key: 'doubles', label: 'Bed Wars: Duplas', prefix: 'doubles', emoji: 'bedwars' },
  { key: 'trios', label: 'Bed Wars: Trios', prefix: '3v3v3v3', emoji: 'bedwars' },
  { key: 'quartetos', label: 'Bed Wars: Quartetos', prefix: '4v4v4v4', emoji: 'bedwars' },
  { key: '1v1', label: 'Bed Wars: 1v1', prefix: '1v1', emoji: 'bedwars' },
  { key: '2v2', label: 'Bed Wars: 2v2', prefix: '2v2', emoji: 'bedwars' },
  { key: '3v3', label: 'Bed Wars: 3v3', prefix: '3v3', emoji: 'bedwars' },
  { key: '4v4', label: 'Bed Wars: 4v4', prefix: '4v4', emoji: 'bedwars' },
  { key: '4s', label: 'Bed Wars: 4s', prefix: '4v4v4v4', emoji: 'bedwars' },
];

const MISSION_MODES = [
  { key: 'total', label: 'Bed Wars (Missões): Total', emoji: 'Missions' },
  { key: 'daily', label: 'Bed Wars (Missões): Diárias', emoji: 'LimeDye' },
  { key: 'weekly', label: 'Bed Wars (Missões): Semanais', emoji: 'YellowDye' },
];

const MISSION_COLORS = {
  total: 0xee4266,
  daily: 0x75c41c,
  weekly: 0xd8c927,
};

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

function getXpProgress(xp, level, table) {
  if (!table) return null;

  const currentXp = Number(xp);
  const floor = Number(table[level]);
  const next = Number(table[Number(level) + 1]);

  if (
    !Number.isFinite(currentXp) ||
    !Number.isFinite(floor) ||
    !Number.isFinite(next) ||
    next <= floor
  ) {
    return null;
  }

  const earned = Math.max(0, Math.min(currentXp - floor, next - floor));
  return `[${formatNumber(earned)}/${formatNumber(next - floor)}]`;
}

function getDaily(stats, prefix, field) {
  const key = prefix ? `${prefix}_${field}_daily` : `${field}_daily`;
  return stats[key] ?? 0;
}

function getMonthly(stats, prefix, field) {
  const key = prefix ? `${prefix}_${field}_monthly` : `${field}_monthly`;
  return stats[key] ?? 0;
}

function getGeneral(stats, prefix, field) {
  const key = prefix ? `${prefix}_${field}` : field;
  return Number(stats[key] ?? 0);
}

function formatRatio(numerator, denominator) {
  const value = denominator > 0 ? numerator / denominator : numerator > 0 ? numerator : 0;
  return value.toFixed(2);
}

function isMissionCompleted(mission) {
  return Boolean(mission && typeof mission === 'object' && mission.completed_at);
}

function getMissionCounts(missions) {
  const entries = Object.entries(missions ?? {});
  const completed = entries.filter(([, mission]) => isMissionCompleted(mission));
  const inProgress = entries.filter(([, mission]) => !isMissionCompleted(mission));

  return { entries, completed, inProgress };
}

function formatMissionList(entries) {
  return entries.map(([key]) => `• **${getMissionLabel(key)}**`).join('\n');
}

function getNextMissionReset(date) {
  if (!date) return null;

  const base = new Date(`${date}T00:00:00-03:00`);
  if (Number.isNaN(base.getTime())) return null;

  return Math.floor((base.getTime() + 24 * 60 * 60 * 1000) / 1000);
}

export function buildBedwarsDailyEmbed(player, footerIconURL, modeKey = 'total') {
  const mode = MODES.find((item) => item.key === modeKey) ?? MODES[0];
  const stats = player.stats?.bedwars ?? {};
  const uuid = (player.account.unique_id ?? '').replaceAll('-', '');
  const slim = player.skin?.slim ? 'true' : 'false';
  const icon = getEmoji('BedWars');

  const description = [
    `• **Níveis adquiridos**: ${formatNumber(getDaily(stats, mode.prefix, 'level'))}`,
    `• **XP adquirido**: ${formatNumber(getDaily(stats, mode.prefix, 'xp'))}`,
    '',
    `• **Camas quebradas**: ${formatNumber(getDaily(stats, mode.prefix, 'beds_broken'))}`,
    '',
    `• **Abates**: ${formatNumber(getDaily(stats, mode.prefix, 'kills'))}`,
    `• **Abates finais**: ${formatNumber(getDaily(stats, mode.prefix, 'final_kills'))}`,
    '',
    `• **Vitórias**: ${formatNumber(getDaily(stats, mode.prefix, 'wins'))}`,
    `• **Winstreak**: ${formatNumber(getDaily(stats, mode.prefix, 'winstreak'))}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(parseColor(player.profile_tag?.color ?? player.rank_tag?.color))
    .setTitle(`${icon ? `${icon}・` : ''}Bed Wars (Diário): ${player.account.username}`)
    .setDescription(description)
    .setThumbnail(`https://visage.surgeplay.com/face/256/${uuid}?y=-40&slim=${slim}`)
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildBedwarsMonthlyEmbed(player, footerIconURL, modeKey = 'total') {
  const mode = MODES.find((item) => item.key === modeKey) ?? MODES[0];
  const stats = player.stats?.bedwars ?? {};
  const uuid = (player.account.unique_id ?? '').replaceAll('-', '');
  const slim = player.skin?.slim ? 'true' : 'false';
  const icon = getEmoji('BedWars');

  const description = [
    `• **Níveis adquiridos**: ${formatNumber(getMonthly(stats, mode.prefix, 'level'))}`,
    `• **XP adquirido**: ${formatNumber(getMonthly(stats, mode.prefix, 'xp'))}`,
    '',
    `• **Camas quebradas**: ${formatNumber(getMonthly(stats, mode.prefix, 'beds_broken'))}`,
    '',
    `• **Abates**: ${formatNumber(getMonthly(stats, mode.prefix, 'kills'))}`,
    `• **Abates finais**: ${formatNumber(getMonthly(stats, mode.prefix, 'final_kills'))}`,
    '',
    `• **Vitórias**: ${formatNumber(getMonthly(stats, mode.prefix, 'wins'))}`,
    `• **Winstreak**: ${formatNumber(getMonthly(stats, mode.prefix, 'winstreak'))}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(parseColor(player.profile_tag?.color ?? player.rank_tag?.color))
    .setTitle(`${icon ? `${icon}・` : ''}Bed Wars (Mensal): ${player.account.username}`)
    .setDescription(description)
    .setThumbnail(`https://visage.surgeplay.com/face/256/${uuid}?y=-40&slim=${slim}`)
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildBedwarsGeneralEmbed(player, footerIconURL, xpTable, modeKey = 'total') {
  const mode = MODES.find((item) => item.key === modeKey) ?? MODES[0];
  const stats = player.stats?.bedwars ?? {};
  const uuid = (player.account.unique_id ?? '').replaceAll('-', '');
  const slim = player.skin?.slim ? 'true' : 'false';
  const icon = getEmoji('BedWars');
  const level = Number(stats.level ?? 0);
  const xp = Number(stats.xp ?? 0);
  const xpProgress = getXpProgress(xp, level, xpTable);
  const levelColor = getLevelColor(
    stats.level_badge,
    parseColor(player.profile_tag?.color ?? player.rank_tag?.color),
  );

  const bedsBroken = getGeneral(stats, mode.prefix, 'beds_broken');
  const bedsLost = getGeneral(stats, mode.prefix, 'beds_lost');
  const kills = getGeneral(stats, mode.prefix, 'kills');
  const deaths = getGeneral(stats, mode.prefix, 'deaths');
  const assists = getGeneral(stats, mode.prefix, 'assists');
  const finalKills = getGeneral(stats, mode.prefix, 'final_kills');
  const finalDeaths = getGeneral(stats, mode.prefix, 'final_deaths');
  const finalAssists = getGeneral(stats, mode.prefix, 'final_assists');
  const wins = getGeneral(stats, mode.prefix, 'wins');
  const losses = getGeneral(stats, mode.prefix, 'losses');
  const gamesPlayed = getGeneral(stats, mode.prefix, 'games_played');
  const winstreak = getGeneral(stats, mode.prefix, 'winstreak');
  const maxWinstreak = getGeneral(stats, mode.prefix, 'max_winstreak');
  const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(2) : '0.00';

  const description = [
    `• **Nível**: ${getLevelDisplay(stats.level_badge, level)}`,
    `• **XP**: ${formatNumber(xp)}${xpProgress ? ` ➜ ${xpProgress}` : ''}`,
    '',
    `• **Camas quebradas**: ${formatNumber(bedsBroken)}`,
    `• **Camas perdidas**: ${formatNumber(bedsLost)}`,
    '',
    `• **Abates**: ${formatNumber(kills)}`,
    `• **Mortes**: ${formatNumber(deaths)}`,
    `• **Assistências**: ${formatNumber(assists)}`,
    '',
    `• **Abates finais**: ${formatNumber(finalKills)}`,
    `• **Mortes finais**: ${formatNumber(finalDeaths)}`,
    `• **Assistências finais**: ${formatNumber(finalAssists)}`,
    '',
    `• **Vitórias**: ${formatNumber(wins)} (${winRate}%)`,
    `• **Derrotas**: ${formatNumber(losses)}`,
    `• **Partidas jogadas**: ${formatNumber(gamesPlayed)}`,
    '',
    `• **Winstreak**: ${formatNumber(winstreak)}`,
    `• **Maior Winstreak**: ${formatNumber(maxWinstreak)}`,
    '',
    `• **KDR**: ${formatRatio(kills, deaths)}`,
    `• **WLR**: ${formatRatio(wins, losses)}`,
    `• **FKDR**: ${formatRatio(finalKills, finalDeaths)}`,
    `• **BBLR**: ${formatRatio(bedsBroken, bedsLost)}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(levelColor)
    .setTitle(`${icon ? `${icon}・` : ''}Bed Wars (Geral): ${player.account.username}`)
    .setDescription(description)
    .setThumbnail(`https://visage.surgeplay.com/face/256/${uuid}?y=-40&slim=${slim}`)
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });
}

export function buildBedwarsMissionsEmbed(
  player,
  missions,
  footerIconURL,
  modeKey = 'total',
) {
  const mode = MISSION_MODES.find((item) => item.key === modeKey) ?? MISSION_MODES[0];
  const stats = player.stats?.missions ?? {};
  const bedwarsMissions = missions?.bedwars ?? {};
  const uuid = (player.account.unique_id ?? '').replaceAll('-', '');
  const slim = player.skin?.slim ? 'true' : 'false';
  const icon = getEmoji('Missions');

  const embed = new EmbedBuilder()
    .setColor(MISSION_COLORS[mode.key] ?? MISSION_COLORS.total)
    .setTitle(`${icon ? `${icon}・` : ''}Bed Wars (Missões): ${player.account.username}`)
    .setThumbnail(`https://visage.surgeplay.com/face/256/${uuid}?y=-40&slim=${slim}`)
    .setFooter({
      text: 'Desenvolvido por xwqk',
      iconURL: footerIconURL,
    });

  if (mode.key === 'total') {
    const daily = getMissionCounts(bedwarsMissions.daily);
    const weekly = getMissionCounts(bedwarsMissions.weekly);

    embed.addFields(
      {
        name: `${getEmoji('LimeDye')} » Missões Diárias (Total):`,
        value: [
          `• **Missões recebidas**: ${formatNumber(stats.bedwars_daily_given ?? 0)}`,
          `• **Missões completadas**: ${formatNumber(stats.bedwars_daily_completed ?? 0)}`,
          `• **Missões em progresso**: ${formatNumber(daily.inProgress.length)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: `${getEmoji('YellowDye')} » Missões Semanais (Total):`,
        value: [
          `• **Missões recebidas**: ${formatNumber(stats.bedwars_weekly_given ?? 0)}`,
          `• **Missões completadas**: ${formatNumber(stats.bedwars_weekly_completed ?? 0)}`,
          `• **Missões em progresso**: ${formatNumber(weekly.inProgress.length)}`,
        ].join('\n'),
        inline: false,
      },
    );

    return embed;
  }

  const type = mode.key === 'weekly' ? 'weekly' : 'daily';
  const { entries, completed, inProgress } = getMissionCounts(bedwarsMissions[type]);
  const reset = getNextMissionReset(bedwarsMissions.date);
  const completedValue = completed.length
    ? formatMissionList(completed)
    : '• Nenhuma missão ainda foi completada';
  const inProgressValue = inProgress.length
    ? formatMissionList(inProgress)
    : '• Nenhuma missão em progresso';

  if (reset) embed.setDescription(`• **Novas missões**: <t:${reset}:R>`);

  embed.addFields(
    {
      name: `${getEmoji('Completed')} » Missões Completadas (${completed.length}/${entries.length}):`,
      value: completedValue,
      inline: false,
    },
    {
      name: `${getEmoji('InProgress')} » Missões Em progresso (${inProgress.length}):`,
      value: inProgressValue,
      inline: false,
    },
  );

  return embed;
}

export function buildBedwarsMissionsSelect(username, selectedMode = 'total') {
  const options = MISSION_MODES.map((mode) => {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(mode.label)
      .setValue(mode.key)
      .setDescription('Clique para selecionar.')
      .setDefault(mode.key === selectedMode);

    const emoji = getEmojiData(mode.emoji);
    if (emoji) option.setEmoji(emoji);

    return option;
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`bedwars_missions_mode:${username}`)
    .setPlaceholder('Selecione um tipo de missão')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

function buildModeSelect(username, selectedMode, customId) {
  const options = MODES.map((mode) => {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(mode.label)
      .setValue(mode.key)
      .setDescription('Clique para selecionar.')
      .setDefault(mode.key === selectedMode);

    const emoji = getEmojiData(mode.emoji);
    if (emoji) option.setEmoji(emoji);

    return option;
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`${customId}:${username}`)
    .setPlaceholder('Selecione um modo')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

export function buildBedwarsModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bedwars_mode');
}

export function buildBedwarsGeneralModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bedwars_general_mode');
}

export function buildBedwarsMonthlyModeSelect(username, selectedMode = 'total') {
  return buildModeSelect(username, selectedMode, 'bedwars_monthly_mode');
}
