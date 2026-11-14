import { getEmoji } from '../services/applicationEmojis.js';

const MEDALS = {
  toxic: ['Toxico'],
  yin_yang: ['Yin_Yang'],
  musician: ['Musico'],
  flash: ['Flash'],
  love_and_peace: ['Paz_e_Amor'],
  love: ['Amor'],
  imperial: ['Imperial'],
  knife_fight: ['Briga_de_Espadas'],
  quarterquell: ['Quarter_Quell_1'],
  quarterquell_2: ['Quarter_Quell_2'],
  quarterquell_3: ['Quarter_Quell_3'],
  general: ['General'],
  general_season_3: ['General_Season_3'],
  general_season_10: ['General_Season_3'],
  master: ['Master'],
  flag: ['Bandeira'],
  battery: ['Bateria'],
  wrong: ['Errado'],
  coffee: ['Cafe'],
  face: ['Carinha'],
  nicoolass: ['Nicoolass'],
  cxc: ['CxC'],
  nitro: ['Nitro'],
  bgs: ['BGS'],
  top: ['TOP'],
  arzim: ['ARZIM'],
  aluno: ['Aluno'],
  mush: ['Mush'],
  wg: ['WG'],
  grammy: ['Grammy'],
  mush_rimas: ['Mush'],
  halloween: ['Halloween'],
  youtube_spotlight: ['YT_Spotlight'],
  event_promoter: ['Promotor_de_Evento'],
  staff: ['Staff'],
  helper: ['Helper'],
  mod: ['Mod'],
  xmas: ['Natal'],
  santa_helper: ['Ajudante_de_PapaiNoel'],
  megamush: ['Megamush'],
  feijao: ['FEIJAO'],
  check: ['Correto'],
  anniversary_2022: ['Aniversario_do_Mush_2022'],
  witch_hunter: ['Cacador_de_Bruxas'],
  gingerbread_house: ['Casa_de_Gengibre'],
  alert: ['Alerta'],
  atom: ['Atomo'],
  ring: ['Anel'],
  airplane_mode: ['Modo_Aviao'],
  phone: ['Celular'],
  flower: ['Flor'],
  star: ['Estrela'],
  lucky: ['Sortudo'],
  card: ['Carta'],
  contributor: ['Contribuidor'],
  level_100: ['Nivel_100'],
  anniversary_2023: ['Aniversario_do_Mush_2023'],
  fire: ['Fogo'],
  water: ['Agua'],
  air: ['Ar'],
  pix: ['PIX'],
  artist: ['Artista'],
  sorcerer: ['Feiticeiro'],
  estacio: ['Estacio'],
  ruby: ['Ruby'],
  grana: ['Grana'],
  snowman: ['Boneco_de_Neve'],
  caca_pato: ['CacaPato'],
  snowflake: ['Floco_de_Neve'],
  mod_plus: ['ModPlus'],
  carnaval: ['Carnaval'],
  mush_league: ['Mush_League'],
  clan_clash: ['Clan_Clash'],
  partner: ['Partner'],
  biscoito_de_gengibre: ['Biscoito_de_Gengibre'],
  show_de_fogos_2024: ['Show_de_Fogos_2024'],
  show_de_fogos_2025: ['Show_de_Fogos_2025'],
  show_de_fogos_2026: ['Show_de_Fogos_2026'],
  top_cyan: ['TOP_Cyan'],
  top_dark_blue: ['TOP_Dark_Blue'],
  top_dark_red: ['TOP_Dark_Red'],
  gamescom: ['Gamescom'],
  desenhista: ['Desenhista'],
  ajudante_nasco: ['Ajudante_Nasco'],
  clan_clash_2: ['Clan_Clash_2'],
  bedwars_champions_master: ['Champions_Master'],
  bedwars_champions_diamond: ['Champions_Diamond'],
  bedwars_champions_platinum: ['Champions_Platinum'],
  bedwars_champions_gold: ['Champions_Gold'],
  bedwars_champions_silver: ['Champions_Silver'],
  skywars_champions_master: ['Champions_Master'],
  skywars_champions_diamond: ['Champions_Diamond'],
  skywars_champions_platinum: ['Champions_Platinum'],
  skywars_champions_gold: ['Champions_Gold'],
  skywars_champions_silver: ['Champions_Silver'],
  sapphire: ['Sapphire'],
  satturnni: ['Satturnni'],
  kindome: ['Kindome'],
  gay_medal: {
    emojis: ['Gay_1', 'Gay_2', 'Gay_3', 'Gay_4'],
    label: 'Gay',
  },
  feiticeiro_aprendiz: {
    emojis: ['Feiticeiro_Aprendiz_1', 'Feiticeiro_Aprendiz_2'],
    label: 'Feiticeiro Aprendiz',
  },
  feiticeiro_amador: {
    emojis: ['Feiticeiro_Amador_1', 'Feiticeiro_Amador_2'],
    label: 'Feiticeiro Amador',
  },
  feiticeiro_mestre: {
    emojis: ['Feiticeiro_Mestre_1', 'Feiticeiro_Mestre_2'],
    label: 'Feiticeiro Mestre',
  },
};

function humanize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getMedalEmoji(medalKey) {
  if (!medalKey || medalKey === 'empty') return '';

  const entry = MEDALS[medalKey];
  const emojis = Array.isArray(entry) ? entry : entry?.emojis;
  return (emojis ?? []).map((name) => getEmoji(name)).filter(Boolean).join('');
}

export function getMedalDisplay(medalKey) {
  if (!medalKey || medalKey === 'empty') return 'Nenhuma';

  const entry = MEDALS[medalKey];
  const label = Array.isArray(entry)
    ? humanize(entry[0])
    : entry?.label ?? humanize(medalKey);
  const tags = getMedalEmoji(medalKey);

  return tags ? `${tags} (${label})` : label;
}
