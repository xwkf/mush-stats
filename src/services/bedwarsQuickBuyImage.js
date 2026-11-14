import { Canvas, loadImage } from 'skia-canvas';
import { FontRender, defaultFontPath } from 'minecraft-font-renderer';
import { logger } from '../core/logger.js';
import {
  CATEGORY_BAR,
  CATEGORY_ICONS,
  ITEM_ASSETS_BASE,
  QUICK_BUY_ITEMS,
  UNKNOWN_ITEM,
} from '../constants/bedwarsQuickBuy.js';

// ---------------------------------------------------------------------------
// Layout (em pixels, fundo transparente)
// ---------------------------------------------------------------------------
const WIDTH = 1198;
const HEIGHT = 804;

const TITLE_PANEL = { x: 203, y: 22, w: 792, h: 51 };
const HEADER_PANEL = { x: 35, y: 95, w: 1130, h: 53 };
const SKIN_PANEL = { x: 35, y: 165, w: 375, h: 618 };
const GRID_PANEL = { x: 420, y: 165, w: 745, h: 618 };

const COL_START = 473;
const COL_PITCH = 80.5;
const ROW_START = 215;
const ROW_PITCH = 80;
const HOTBAR_Y = 742;
const SLOT_SIZE = 68;
const ICON_SIZE = 48;

const QUICK_BUY_FIRST_ROW = 2;
const QUICK_BUY_FIRST_COL = 1;
const QUICK_BUY_COLUMNS = 7;
const GRID_ROWS = 6;

const TEXT_SIZE = 8;
const COUNT_SIZE = 6;

const MC_COLORS = {
  0: [0x00, 0x00, 0x00],
  1: [0x00, 0x00, 0xaa],
  2: [0x00, 0xaa, 0x00],
  3: [0x00, 0xaa, 0xaa],
  4: [0xaa, 0x00, 0x00],
  5: [0xaa, 0x00, 0xaa],
  6: [0xff, 0xaa, 0x00],
  7: [0xaa, 0xaa, 0xaa],
  8: [0x55, 0x55, 0x55],
  9: [0x55, 0x55, 0xff],
  a: [0x55, 0xff, 0x55],
  b: [0x55, 0xff, 0xff],
  c: [0xff, 0x55, 0x55],
  d: [0xff, 0x55, 0xff],
  e: [0xff, 0xff, 0x55],
  f: [0xff, 0xff, 0xff],
};

// ---------------------------------------------------------------------------
// Fonte (minecraft-font-renderer)
// ---------------------------------------------------------------------------
let fontPromise = null;

function getFont() {
  if (!fontPromise) {
    fontPromise = (async () => {
      const renderer = new FontRender();
      await renderer.loadImages(defaultFontPath);
      return renderer;
    })().catch((error) => {
      fontPromise = null;
      throw error;
    });
  }

  return fontPromise;
}

/** Converte uma cor hex (#rrggbb) para o código `&x` mais próximo do Minecraft. */
function hexToColorCode(hex, fallback = 'f') {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
  if (!match) return `&${fallback}`;

  const value = Number.parseInt(match[1], 16);
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255];

  let best = fallback;
  let bestDistance = Infinity;

  for (const [code, color] of Object.entries(MC_COLORS)) {
    const distance = color.reduce((sum, channel, i) => sum + (channel - rgb[i]) ** 2, 0);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = code;
    }
  }

  return `&${best}`;
}

// ---------------------------------------------------------------------------
// Texturas dos itens (API: PrismarineJS/minecraft-assets, versão 1.8.8)
// ---------------------------------------------------------------------------
const textureCache = new Map();

function loadTexture(folder, name) {
  const key = `${folder}/${name}`;

  if (!textureCache.has(key)) {
    const promise = loadImage(`${ITEM_ASSETS_BASE}/${folder}/${name}.png`).catch((error) => {
      logger.warn(`Falha ao carregar textura ${key}: ${error.message}`);
      textureCache.delete(key);
      return null;
    });

    textureCache.set(key, promise);
  }

  return textureCache.get(key);
}

// Texturas animadas (relógio, bússola) vêm em tiras verticais: usa só o 1º quadro.
function frameSize(image) {
  return image.height > image.width ? image.width : image.height;
}

// ---------------------------------------------------------------------------
// Desenho de painéis e slots
// ---------------------------------------------------------------------------
function notchedRect(ctx, x, y, w, h, n = 3) {
  ctx.beginPath();
  ctx.moveTo(x + n, y);
  ctx.lineTo(x + w - n, y);
  ctx.lineTo(x + w - n, y + n);
  ctx.lineTo(x + w, y + n);
  ctx.lineTo(x + w, y + h - n);
  ctx.lineTo(x + w - n, y + h - n);
  ctx.lineTo(x + w - n, y + h);
  ctx.lineTo(x + n, y + h);
  ctx.lineTo(x + n, y + h - n);
  ctx.lineTo(x, y + h - n);
  ctx.lineTo(x, y + n);
  ctx.lineTo(x + n, y + n);
  ctx.closePath();
}

function drawPanel(ctx, { x, y, w, h }) {
  notchedRect(ctx, x, y, w, h);
  ctx.fillStyle = 'rgba(34, 38, 46, 0.82)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(12, 14, 18, 0.85)';
  ctx.stroke();
}

function drawSlot(ctx, cx, cy, variant = 'normal') {
  const x = Math.round(cx - SLOT_SIZE / 2);
  const y = Math.round(cy - SLOT_SIZE / 2);

  const fills = {
    normal: 'rgba(14, 16, 20, 0.55)',
    selected: 'rgba(104, 140, 52, 0.55)',
    pane: 'rgba(60, 66, 72, 0.50)',
  };

  ctx.fillStyle = fills[variant] ?? fills.normal;
  ctx.fillRect(x, y, SLOT_SIZE, SLOT_SIZE);

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.strokeRect(x + 1, y + 1, SLOT_SIZE - 2, SLOT_SIZE - 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(x + 2, y + 2, SLOT_SIZE - 4, 2);
}

// ---------------------------------------------------------------------------
// Ícones
// ---------------------------------------------------------------------------
function tintedCanvas(source, w, h, color, alpha = 0.5) {
  const canvas = new Canvas(w, h);
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(source, 0, 0, w, h);
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(0, 0, w, h);
  return canvas;
}

function drawFlat(ctx, image, cx, cy, def) {
  const size = frameSize(image);
  const x = Math.round(cx - ICON_SIZE / 2);
  const y = Math.round(cy - ICON_SIZE / 2);

  ctx.imageSmoothingEnabled = false;

  if (def.glint) {
    const layer = new Canvas(ICON_SIZE, ICON_SIZE);
    const lc = layer.getContext('2d');
    lc.imageSmoothingEnabled = false;
    lc.drawImage(image, 0, 0, size, size, 0, 0, ICON_SIZE, ICON_SIZE);
    ctx.drawImage(tintedCanvas(layer, ICON_SIZE, ICON_SIZE, '#8a4bff', 0.5), x, y);
    return;
  }

  ctx.drawImage(image, 0, 0, size, size, x, y, ICON_SIZE, ICON_SIZE);
}

function drawPotion(ctx, bottle, overlay, cx, cy, def) {
  const layer = new Canvas(ICON_SIZE, ICON_SIZE);
  const lc = layer.getContext('2d');
  lc.imageSmoothingEnabled = false;

  if (overlay) {
    lc.drawImage(tintedCanvas(overlay, 16, 16, def.color, 1), 0, 0, 16, 16, 0, 0, ICON_SIZE, ICON_SIZE);
  }

  lc.drawImage(bottle, 0, 0, 16, 16, 0, 0, ICON_SIZE, ICON_SIZE);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(layer, Math.round(cx - ICON_SIZE / 2), Math.round(cy - ICON_SIZE / 2));
}

/** Cubo isométrico no estilo do inventário do Minecraft. */
function drawCube(ctx, { top, left, right }, cx, cy, { shade = true, tint = null } = {}) {
  const W = ICON_SIZE;
  const H = W / 2;
  const y0 = cy - W / 2;

  const faces = [
    // [imagem, origem, vetor u (eixo x da textura), vetor v (eixo y), sombra]
    [top, [cx, y0], [W / 2, W / 4], [-W / 2, W / 4], 0],
    [left, [cx - W / 2, y0 + W / 4], [W / 2, W / 4], [0, H], 0.22],
    [right, [cx, y0 + W / 2], [W / 2, -W / 4], [0, H], 0.42],
  ];

  ctx.imageSmoothingEnabled = true;

  for (const [image, [ox, oy], [ux, uy], [vx, vy], dark] of faces) {
    if (!image) continue;
    const size = frameSize(image);

    ctx.save();
    ctx.transform(ux / size, uy / size, vx / size, vy / size, ox, oy);
    ctx.drawImage(image, 0, 0, size, size, 0, 0, size, size);

    if (tint) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = 1;
    }

    if (shade && dark > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${dark})`;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.restore();
  }
}

async function drawChest(ctx, cx, cy) {
  const planks = await loadTexture('blocks', 'planks_oak');
  drawCube(ctx, { top: planks, left: planks, right: planks }, cx, cy, { tint: '#5a3412' });

  const W = ICON_SIZE;
  const y0 = cy - W / 2;

  ctx.save();
  ctx.strokeStyle = 'rgba(20, 10, 2, 0.9)';
  ctx.lineWidth = 2;

  // linha da tampa nas duas faces laterais
  ctx.beginPath();
  ctx.moveTo(cx - W / 2, y0 + W / 4 + W * 0.18);
  ctx.lineTo(cx, y0 + W / 2 + W * 0.18);
  ctx.lineTo(cx + W / 2, y0 + W / 4 + W * 0.18);
  ctx.stroke();

  // trava dourada
  ctx.fillStyle = '#d9b44a';
  ctx.fillRect(cx - 3, y0 + W / 2 + W * 0.1, 6, 8);
  ctx.restore();
}

async function drawIcon(ctx, def, cx, cy) {
  switch (def.kind) {
    case 'item': {
      const image = await loadTexture('items', def.texture);
      if (image) drawFlat(ctx, image, cx, cy, def);
      return;
    }
    case 'flat': {
      const image = await loadTexture('blocks', def.texture);
      if (image) drawFlat(ctx, image, cx, cy, def);
      return;
    }
    case 'block': {
      const [top, side, bottom] = await Promise.all([
        loadTexture('blocks', def.top),
        def.side ? loadTexture('blocks', def.side) : null,
        def.bottom ? loadTexture('blocks', def.bottom) : null,
      ]);
      void bottom;
      drawCube(ctx, { top, left: side ?? top, right: side ?? top }, cx, cy);
      return;
    }
    case 'potion': {
      const [bottle, overlay] = await Promise.all([
        loadTexture('items', 'potion_bottle_drinkable'),
        loadTexture('items', 'potion_overlay'),
      ]);
      if (bottle) drawPotion(ctx, bottle, overlay, cx, cy, def);
      return;
    }
    case 'chest':
      await drawChest(ctx, cx, cy);
      return;
    default:
  }
}

// ---------------------------------------------------------------------------
// Resolução dos dados da API
// ---------------------------------------------------------------------------
const warnedIds = new Set();

function isEmptyId(id) {
  return !id || ['empty', 'air', 'none', 'null'].includes(String(id).toLowerCase());
}

function resolveItem(id) {
  const key = String(id).toLowerCase();
  const def = QUICK_BUY_ITEMS[key];

  if (def) return def;

  if (!warnedIds.has(key)) {
    warnedIds.add(key);
    logger.warn(`Item da Compra Rápida sem mapeamento: "${id}"`);
  }

  return UNKNOWN_ITEM;
}

function getQuickBuyIds(quickBuy) {
  const items = quickBuy?.quick_buy_layout?.items;
  if (!Array.isArray(items)) return [];

  return items.map((entry) => {
    const id = typeof entry === 'string' ? entry : entry?.id;
    return isEmptyId(id) ? null : String(id);
  });
}

function getHotbarSlots(quickBuy) {
  const slots = quickBuy?.hotbar?.slots;
  const result = Array.from({ length: 9 }, () => null);
  if (!Array.isArray(slots)) return result;

  for (const entry of slots) {
    const index = Number(entry?.slot);
    if (!Number.isInteger(index) || index < 0 || index > 8) continue;

    const first = Array.isArray(entry.items) ? entry.items[0] : null;
    if (!first || isEmptyId(first.id)) continue;

    if (first.type === 'category') {
      const def = CATEGORY_ICONS[String(first.id).toLowerCase()];
      if (def) result[index] = def;
      else result[index] = resolveItem(first.id);
      continue;
    }

    result[index] = resolveItem(first.id);
  }

  return result;
}

function buildHeaderText(player) {
  const bedwars = player.stats?.bedwars ?? {};
  const level = Number(bedwars.level ?? 0);

  // "&c[94&l❊&c]" -> insere &r antes de cada cor para que o negrito não vaze.
  const badgeFormat = bedwars.level_badge?.format ?? `&7[${level}&l✫&7]`;
  const badge = String(badgeFormat).replace(/&([0-9a-f])/gi, '&r&$1');

  const nameColor = hexToColorCode(player.best_tag?.color ?? player.profile_tag?.color, 'f');
  let text = `${badge}&r ${nameColor}${player.account.username}`;

  if (player.clan?.tag) {
    text += `&r ${hexToColorCode(player.clan.tag_color, 'f')}[${player.clan.tag}]`;
  }

  return text;
}

async function loadBust(player) {
  const uuid = String(player.account?.unique_id ?? '').replaceAll('-', '');
  const target = uuid || player.account?.username;
  if (!target) return null;

  try {
    return await loadImage(`https://vzge.me/bust/512/${encodeURIComponent(target)}.png`);
  } catch (error) {
    logger.warn(`Falha ao carregar bust de "${target}": ${error.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Render principal
// ---------------------------------------------------------------------------
function colCenter(col) {
  return COL_START + col * COL_PITCH;
}

function rowCenter(row) {
  return ROW_START + row * ROW_PITCH;
}

function drawCenteredText(font, ctx, text, centerX, centerY, size = TEXT_SIZE) {
  const { height } = font.getTextSize(text, { size });
  font.fillText(ctx, text, centerX, Math.round(centerY - height / 2), {
    shadow: true,
    size,
    align: 'center',
  });
}

/**
 * Gera a imagem (PNG com fundo transparente) do menu de Compra Rápida.
 *
 * @param {object} player     resposta de /api/player/{nick}
 * @param {object} quickBuy   resposta de /api/player/name/{nick}/bedwars
 * @returns {Promise<Buffer>}
 */
export async function renderQuickBuyImage(player, quickBuy) {
  const [font, bust] = await Promise.all([getFont(), loadBust(player)]);

  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Painéis
  drawPanel(ctx, TITLE_PANEL);
  drawPanel(ctx, HEADER_PANEL);
  drawPanel(ctx, SKIN_PANEL);
  drawPanel(ctx, GRID_PANEL);

  // Título
  drawCenteredText(
    font,
    ctx,
    '&c&lBED &f&lWARS &f&l- &e&lQUICK BUY',
    TITLE_PANEL.x + TITLE_PANEL.w / 2,
    TITLE_PANEL.y + TITLE_PANEL.h / 2,
  );

  // Cabeçalho: [nível] nick [CLAN]
  drawCenteredText(
    font,
    ctx,
    buildHeaderText(player),
    HEADER_PANEL.x + HEADER_PANEL.w / 2,
    HEADER_PANEL.y + HEADER_PANEL.h / 2,
  );

  // Skin (vzge.me/bust)
  if (bust) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(SKIN_PANEL.x, SKIN_PANEL.y, SKIN_PANEL.w, SKIN_PANEL.h);
    ctx.clip();

    const targetWidth = 330;
    const targetHeight = Math.round((bust.height / bust.width) * targetWidth);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      bust,
      Math.round(SKIN_PANEL.x + (SKIN_PANEL.w - targetWidth) / 2),
      SKIN_PANEL.y + 45,
      targetWidth,
      targetHeight,
    );
    ctx.restore();
  }

  // Slots vazios da grade (6 linhas x 9 colunas) + hotbar
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      let variant = 'normal';
      if (row === 1) variant = col === 0 ? 'selected' : 'pane';
      drawSlot(ctx, colCenter(col), rowCenter(row), variant);
    }
  }

  for (let col = 0; col < 9; col += 1) {
    drawSlot(ctx, colCenter(col), HOTBAR_Y);
  }

  // Barra de categorias
  for (let col = 0; col < CATEGORY_BAR.length; col += 1) {
    await drawIcon(ctx, CATEGORY_ICONS[CATEGORY_BAR[col]], colCenter(col), rowCenter(0));
  }

  // Itens da Compra Rápida (3 linhas x 7 colunas)
  const ids = getQuickBuyIds(quickBuy);
  const maxItems = QUICK_BUY_COLUMNS * (GRID_ROWS - QUICK_BUY_FIRST_ROW);

  for (let i = 0; i < Math.min(ids.length, maxItems); i += 1) {
    if (!ids[i]) continue;

    const def = resolveItem(ids[i]);
    const cx = colCenter(QUICK_BUY_FIRST_COL + (i % QUICK_BUY_COLUMNS));
    const cy = rowCenter(QUICK_BUY_FIRST_ROW + Math.floor(i / QUICK_BUY_COLUMNS));

    await drawIcon(ctx, def, cx, cy);

    if (def.count) {
      const text = String(def.count);
      const { width, height } = font.getTextSize(text, { size: COUNT_SIZE });
      font.fillText(ctx, text, cx + SLOT_SIZE / 2 - 6 - width, cy + SLOT_SIZE / 2 - 6 - height, {
        shadow: true,
        size: COUNT_SIZE,
      });
    }

    if (def.label) {
      const text = `&6${def.label}`;
      const { width, height } = font.getTextSize(text, { size: COUNT_SIZE });
      font.fillText(ctx, text, cx + SLOT_SIZE / 2 - 6 - width, cy + SLOT_SIZE / 2 - 6 - height, {
        shadow: true,
        size: COUNT_SIZE,
      });
    }
  }

  // Hotbar
  const hotbar = getHotbarSlots(quickBuy);

  for (let col = 0; col < 9; col += 1) {
    if (hotbar[col]) await drawIcon(ctx, hotbar[col], colCenter(col), HOTBAR_Y);
  }

  return canvas.toBuffer('png');
}
