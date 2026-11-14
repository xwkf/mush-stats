import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, loadImage } from 'skia-canvas';
import { FontRender, defaultFontPath } from 'minecraft-font-renderer';
import { logger } from '../core/logger.js';
import { readModeStats } from '../constants/compare.js';
import { formatNumber } from '../utils/format.js';

// ---------------------------------------------------------------------------
// Layout (px) — medido sobre o modelo 1920x939
// ---------------------------------------------------------------------------
const WIDTH = 1920;
const HEIGHT = 939;
const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BACKGROUND_PATH = join(ROOT_DIR, 'assets', 'quickbuy-banner.png'); // mesmo fundo do quickbuy
const ASSETS_DIR = join(ROOT_DIR, 'assets', 'compare');

const TITLE_PANEL = { x: 522, y: 38, w: 883, h: 66, bevel: 4 };

const NAME_Y = 132;
const NAME_H = 60;
const NAME_W = 744;

const BOX_H = 135;
const BOX_PITCH = 141; // 135 + 6 de espaço
const BOX_TOP = 205;
const STAT_W = 391;
const SKIN_W = 336;

// Jogador da esquerda: [stats][skin]  |  jogador da direita: [skin][stats]
const LEFT = { nameX: 45, statX: 45, skinX: 453 };
const RIGHT = { nameX: 1132, skinX: 1132, statX: 1486 };

const SKIN_Y = BOX_TOP;
const SKIN_H = BOX_H * 4 + (BOX_PITCH - BOX_H) * 3; // 4 caixas + 3 espaços (205 -> 763)
const SCORE_Y = BOX_TOP + BOX_PITCH * 4; // 769

const LABEL_OFFSET = 37; // centro do rótulo em relação ao topo da caixa
const VALUE_OFFSET = 97; // centro do valor em relação ao topo da caixa

// Imagens fixas (VS, troféu, caveira) — posições absolutas no modelo
const VS_POS = { x: 807, y: 386 };
const TROPHY_POS = { x: 476, y: 784 };
const SKULL_POS = { x: 1357, y: 787 };
const SCORE_LEFT_CX = 663;
const SCORE_RIGHT_CX = 1263;
const SCORE_CY = 836;

// Tamanhos de fonte (o minecraft-font-renderer usa `size` como escala inteira)
const TITLE_SIZE = 6;
const NAME_SIZE = 5;
const LABEL_SIZE = 5;
const VALUE_SIZE = 6;
const SCORE_SIZE = 12;

// Direção da skin (visage.surgeplay.com): ambos olham para o centro (VS).
//  - jogador da esquerda olha para a direita (->) => ?y=40
//  - jogador da direita olha para a esquerda (<-) => ?y=-40
const SKIN_VIEW_LEFT = '?y=40';
const SKIN_VIEW_RIGHT = '?y=-40';
const SKIN_BASE = 'https://visage.surgeplay.com/full/832';

const COLOR_WIN = '#55ff55';
const COLOR_LOSE = '#ff5555';
const COLOR_TIE = '#ffff55';
const COLOR_WHITE = '#ffffff';

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
// Recursos (fonte, fundo, imagens fixas)
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

const imageCache = new Map();

function loadLocalImage(path, label) {
  if (!imageCache.has(path)) {
    imageCache.set(
      path,
      loadImage(path).catch((error) => {
        logger.warn(`Falha ao carregar ${label} do /comparar: ${error.message}`);
        imageCache.delete(path);
        return null;
      }),
    );
  }

  return imageCache.get(path);
}

const getBackground = () => loadLocalImage(BACKGROUND_PATH, 'o fundo');
const getAsset = (name) => loadLocalImage(join(ASSETS_DIR, `${name}.png`), name);

async function loadSkin(player, view) {
  const uuid = String(player.account?.unique_id ?? '').replaceAll('-', '');
  const targets = [...new Set([uuid, player.account?.username].filter(Boolean))];

  for (const target of targets) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await loadImage(`${SKIN_BASE}/${encodeURIComponent(target)}.png${view}`);
      } catch (error) {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }

        logger.warn(
          `Falha ao carregar skin de "${target}": ${error.message || error.code || 'erro desconhecido'}`,
        );
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const value = Number.parseInt(String(hex).replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function shade(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

/** Converte #rrggbb da API para a cor `&x` mais próxima do Minecraft (devolve #rrggbb). */
function nearestMcColor(hex, fallback = COLOR_WHITE) {
  if (!/^#?[0-9a-f]{6}$/i.test(String(hex ?? '').trim())) return fallback;

  const rgb = hexToRgb(String(hex).trim());
  let best = null;
  let bestDistance = Infinity;

  for (const color of Object.values(MC_COLORS)) {
    const distance = color.reduce((sum, channel, i) => sum + (channel - rgb[i]) ** 2, 0);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }

  return `#${best.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

// ---------------------------------------------------------------------------
// Texto (minecraft-font-renderer)
//
// O texto é desenhado em branco numa camada temporária e depois pintado com a cor
// pedida (aceita qualquer #rrggbb, não só as cores &0-&f), com sombra escurecida.
// ---------------------------------------------------------------------------
function renderSegment(font, text, size, bold) {
  const code = bold ? '&f&l' : '&f';
  const { width, height } = font.getTextSize(`${code}${text}`, { size });
  const pad = size * 2;
  const w = Math.ceil(width) + pad * 2;
  const h = Math.ceil(height) + pad * 2;

  const canvas = new Canvas(w, h);
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  font.fillText(context, `${code}${text}`, pad, pad, { shadow: false, size });

  return { canvas, width, height, pad, w, h };
}

function tint(source, color) {
  const canvas = new Canvas(source.w, source.h);
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.drawImage(source.canvas, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = color;
  context.fillRect(0, 0, source.w, source.h);
  return canvas;
}

/**
 * Desenha uma linha de texto centralizada em (cx, cy).
 * @param segments [{ text, color, join? }] — `join` cola o segmento no anterior (sem espaço).
 */
function drawText(font, ctx, segments, cx, cy, { size, bold = false, shadow = 0.2 } = {}) {
  const parts = segments.map((segment) => ({
    ...segment,
    layer: renderSegment(font, segment.text, size, bold),
  }));

  const gap = size * (bold ? 3 : 4);
  const advances = parts.map((part, index) => (index > 0 && !part.join ? gap : 0));
  const total = parts.reduce((sum, part, index) => sum + part.layer.width + advances[index], 0);
  const height = Math.max(...parts.map((part) => part.layer.height));

  const offset = Math.max(1, Math.round(size * 0.4));
  let x = Math.round(cx - total / 2);
  const y = Math.round(cy - height / 2);

  ctx.imageSmoothingEnabled = false;

  parts.forEach((part, index) => {
    x += advances[index];
    const color = part.color ?? COLOR_WHITE;
    const { layer } = part;

    if (shadow > 0) {
      ctx.drawImage(tint(layer, shade(color, shadow)), x - layer.pad + offset, y - layer.pad + offset);
    }

    ctx.drawImage(tint(layer, color), x - layer.pad, y - layer.pad);
    x += layer.width;
  });
}

// ---------------------------------------------------------------------------
// Painéis
// ---------------------------------------------------------------------------
function roundedRect(ctx, x, y, w, h, radius = 8) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Painel escuro translúcido com a faixa clara embaixo (como no modelo). */
function drawPanel(ctx, { x, y, w, h, bevel = 6 }) {
  roundedRect(ctx, x, y + bevel, w, h, 7);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fill();

  roundedRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.fill();
}

function drawBackground(ctx, background) {
  if (!background) {
    ctx.fillStyle = '#1b1d22';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }

  const padding = 32;
  const drawWidth = WIDTH + padding * 2;
  const drawHeight = HEIGHT + padding * 2;
  const scale = Math.max(drawWidth / background.width, drawHeight / background.height);
  const sourceWidth = drawWidth / scale;
  const sourceHeight = drawHeight / scale;
  const sourceX = (background.width - sourceWidth) / 2;
  const sourceY = (background.height - sourceHeight) / 2;

  ctx.save();
  ctx.filter = 'blur(8px)';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    background,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -padding,
    -padding,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
}

function drawSkin(ctx, image, panel) {
  if (!image) return;

  const scale = Math.min((panel.w - 16) / image.width, (panel.h - 40) / image.height);
  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);
  const targetX = Math.round(panel.x + (panel.w - targetWidth) / 2);
  const targetY = Math.round(panel.y + (panel.h - targetHeight) / 2);

  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, targetX, targetY, targetWidth, targetHeight);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------
function formatValue(value, format) {
  if (format === 'ratio') {
    return Number.isInteger(value) ? formatNumber(value) : value.toFixed(2);
  }

  return formatNumber(value);
}

/** Compara pelo valor exibido (ratios com 2 casas) para evitar "empate" colorido errado. */
function compareValues(a, b, format) {
  const left = format === 'ratio' ? Math.round(a * 100) : a;
  const right = format === 'ratio' ? Math.round(b * 100) : b;
  return Math.sign(left - right);
}

function headerSegments(player) {
  const nameColor = nearestMcColor(player.best_tag?.color ?? player.profile_tag?.color);
  const segments = [{ text: player.account.username, color: nameColor }];

  if (player.clan?.tag) {
    segments.push({
      text: `[${player.clan.tag}]`,
      color: nearestMcColor(player.clan.tag_color),
    });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Render principal
// ---------------------------------------------------------------------------
/**
 * Gera a imagem (PNG) do /comparar.
 *
 * @param {object} mode      item de COMPARE_MODES
 * @param {object} left      resposta de /api/player/{nick1}
 * @param {object} right     resposta de /api/player/{nick2}
 * @returns {Promise<Buffer>}
 */
export async function renderCompareImage(mode, left, right) {
  const [font, background, vs, trophy, skull, leftSkin, rightSkin] = await Promise.all([
    getFont(),
    getBackground(),
    getAsset('vs'),
    getAsset('trophy'),
    getAsset('skull'),
    loadSkin(left, SKIN_VIEW_LEFT),
    loadSkin(right, SKIN_VIEW_RIGHT),
  ]);

  const leftValues = readModeStats(left, mode);
  const rightValues = readModeStats(right, mode);

  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  drawBackground(ctx, background);

  // Painéis
  drawPanel(ctx, TITLE_PANEL);

  for (const side of [LEFT, RIGHT]) {
    drawPanel(ctx, { x: side.nameX, y: NAME_Y, w: NAME_W, h: NAME_H, bevel: 4 });
    drawPanel(ctx, { x: side.skinX, y: SKIN_Y, w: SKIN_W, h: SKIN_H });
    drawPanel(ctx, { x: side.skinX, y: SCORE_Y, w: SKIN_W, h: BOX_H });

    for (let row = 0; row < mode.fields.length; row += 1) {
      drawPanel(ctx, { x: side.statX, y: BOX_TOP + row * BOX_PITCH, w: STAT_W, h: BOX_H });
    }
  }

  // Título
  drawText(font, ctx, mode.title, TITLE_PANEL.x + TITLE_PANEL.w / 2, TITLE_PANEL.y + TITLE_PANEL.h / 2, {
    size: TITLE_SIZE,
    bold: true,
    shadow: 0.58,
  });

  // Nomes: nick [CLAN]
  for (const [side, player] of [
    [LEFT, left],
    [RIGHT, right],
  ]) {
    drawText(font, ctx, headerSegments(player), side.nameX + NAME_W / 2, NAME_Y + NAME_H / 2, {
      size: NAME_SIZE,
    });
  }

  // Skins
  drawSkin(ctx, leftSkin, { x: LEFT.skinX, y: SKIN_Y, w: SKIN_W, h: SKIN_H });
  drawSkin(ctx, rightSkin, { x: RIGHT.skinX, y: SKIN_Y, w: SKIN_W, h: SKIN_H });

  // Estatísticas (verde = melhor, vermelho = pior, amarelo = empate)
  let leftScore = 0;
  let rightScore = 0;

  mode.fields.forEach((field, row) => {
    const top = BOX_TOP + row * BOX_PITCH;
    const result = compareValues(leftValues[row], rightValues[row], field.format);

    if (result > 0) leftScore += 1;
    if (result < 0) rightScore += 1;

    const colors =
      result === 0 ? [COLOR_TIE, COLOR_TIE] : result > 0 ? [COLOR_WIN, COLOR_LOSE] : [COLOR_LOSE, COLOR_WIN];

    [
      [LEFT, leftValues[row], colors[0]],
      [RIGHT, rightValues[row], colors[1]],
    ].forEach(([side, value, color]) => {
      const cx = side.statX + STAT_W / 2;

      drawText(font, ctx, [{ text: field.label, color: COLOR_WHITE }], cx, top + LABEL_OFFSET, {
        size: LABEL_SIZE,
        bold: true,
      });
      drawText(font, ctx, [{ text: formatValue(value, field.format), color }], cx, top + VALUE_OFFSET, {
        size: VALUE_SIZE,
      });
    });
  });

  // VS, placar, troféu e caveira (troféu sempre do lado de quem fez mais pontos)
  const leftWins = leftScore > rightScore;
  const rightWins = rightScore > leftScore;
  const trophyRight = { x: WIDTH - TROPHY_POS.x - (trophy?.width ?? 0), y: TROPHY_POS.y };
  const skullLeft = { x: WIDTH - SKULL_POS.x - (skull?.width ?? 0), y: SKULL_POS.y };

  ctx.imageSmoothingEnabled = false;
  if (vs) ctx.drawImage(vs, VS_POS.x, VS_POS.y);

  if (leftWins) {
    if (trophy) ctx.drawImage(trophy, TROPHY_POS.x, TROPHY_POS.y);
    if (skull) ctx.drawImage(skull, SKULL_POS.x, SKULL_POS.y);
  } else if (rightWins) {
    if (trophy) ctx.drawImage(trophy, trophyRight.x, trophyRight.y);
    if (skull) ctx.drawImage(skull, skullLeft.x, skullLeft.y);
  }

  const leftColor = leftWins ? COLOR_WIN : rightWins ? COLOR_LOSE : COLOR_TIE;
  const rightColor = rightWins ? COLOR_WIN : leftWins ? COLOR_LOSE : COLOR_TIE;

  drawText(font, ctx, [{ text: String(leftScore), color: leftColor }], SCORE_LEFT_CX, SCORE_CY, {
    size: SCORE_SIZE,
  });
  drawText(font, ctx, [{ text: String(rightScore), color: rightColor }], SCORE_RIGHT_CX, SCORE_CY, {
    size: SCORE_SIZE,
  });

  return canvas.toBuffer('png');
}
