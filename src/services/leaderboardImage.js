import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, loadImage } from 'skia-canvas';
import { logger } from '../core/logger.js';
import { formatNumber } from '../utils/format.js';
import {
  drawPanel,
  drawText,
  getFont,
  nearestMcColor,
  parseColorCodes,
} from '../utils/mcText.js';

// ---------------------------------------------------------------------------
// Layout (px) — medido sobre o modelo 1612x801
// ---------------------------------------------------------------------------
const WIDTH = 1612;
const HEIGHT = 801;
const BACKGROUND_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'assets',
  'quickbuy-banner.png',
);

const TITLE_PANEL = { x: 367, y: 35, w: 878, h: 66, bevel: 4 };

const HEADER_Y = 129;
const ROW_TOP = 189;
const ROW_PITCH = 59;
const BOX_H = 48;
const ROWS = 10;

const POS_BOX = { x: 35, w: 82 };
const HEAD_BOX = { x: 127, w: 43 };
const NAME_BOX = { x: 178, w: 684 };
const HEADER_PLAYER = { x: 127, w: 735 };
const HEAD_SIZE = 32;

// Área das colunas de estatísticas (o número de colunas varia por jogo, de 2 a 5)
const STATS_X = 870;
const STATS_W = 720; // 870 -> 1590
const COLUMN_GAP = 10;

function buildColumns(fields) {
  const count = Math.max(1, fields.length);
  const usable = STATS_W - COLUMN_GAP * (count - 1);
  const totalWeight = fields.reduce((sum, field) => sum + (field.weight ?? 1), 0);

  let x = STATS_X;
  return fields.map((field) => {
    const width = usable * ((field.weight ?? 1) / totalWeight);
    const column = {
      key: field.key,
      label: field.label.toUpperCase(),
      format: field.format,
      x: Math.round(x),
      w: Math.round(width),
    };

    x += width + COLUMN_GAP;
    return column;
  });
}

function formatValue(value, format) {
  if (format === 'ratio') return Number.isInteger(value) ? formatNumber(value) : value.toFixed(2);
  return formatNumber(value);
}

const TEXT_SIZE = 3;
const TITLE_SIZE = 6;

const POSITION_COLORS = { 1: '#ffff55', 2: '#aaaaaa', 3: '#ffaa00' };

let backgroundPromise = null;

function getBackground() {
  if (!backgroundPromise) {
    backgroundPromise = loadImage(BACKGROUND_PATH).catch((error) => {
      logger.warn(`Falha ao carregar o fundo do /leaderboard: ${error.message}`);
      backgroundPromise = null;
      return null;
    });
  }

  return backgroundPromise;
}

async function loadHead(entry) {
  const targets = [...new Set([entry.uuid, entry.username].filter(Boolean))];

  for (const target of targets) {
    try {
      return await loadImage(`https://visage.surgeplay.com/face/64/${encodeURIComponent(target)}.png`);
    } catch {
      // tenta o próximo alvo
    }
  }

  return null;
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

  ctx.save();
  ctx.filter = 'blur(8px)';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    background,
    (background.width - sourceWidth) / 2,
    (background.height - sourceHeight) / 2,
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

function nameSegments(entry) {
  const segments = [{ text: entry.username, color: nearestMcColor(entry.nameColor) }];

  if (entry.clan) {
    segments.push({ text: `[${entry.clan.tag}]`, color: nearestMcColor(entry.clan.color) });
  }

  return segments;
}

function levelSegments(entry) {
  if (entry.badge) {
    const parsed = parseColorCodes(entry.badge, '#aaaaaa');
    if (parsed.length > 0) return parsed;
  }

  return [{ text: `[${entry.level ?? 0}]`, color: '#aaaaaa', join: true }];
}

/**
 * Gera a imagem (PNG) do ranking do Bed Wars.
 *
 * @param {Array}  entries  top 10 normalizado (ver services/leaderboard.js)
 * @param {Array}  title    segmentos do título [{ text, color }]
 * @param {Array}  fields   colunas do jogo ({ label, format })
 * @returns {Promise<Buffer>}
 */
export async function renderLeaderboardImage(entries, title, fields) {
  const COLUMNS = buildColumns(fields);
  const rows = entries.slice(0, ROWS);
  const [font, background, heads] = await Promise.all([
    getFont(),
    getBackground(),
    Promise.all(rows.map((entry) => loadHead(entry))),
  ]);

  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  drawBackground(ctx, background);

  // Título
  drawPanel(ctx, TITLE_PANEL);
  drawText(font, ctx, title, TITLE_PANEL.x + TITLE_PANEL.w / 2, TITLE_PANEL.y + TITLE_PANEL.h / 2, {
    size: TITLE_SIZE,
    bold: true,
    shadow: 0.58,
  });

  // Cabeçalho
  const headerCy = HEADER_Y + BOX_H / 2;
  const header = (box, label) => {
    drawPanel(ctx, { x: box.x, y: HEADER_Y, w: box.w, h: BOX_H, alpha: 0.4 });
    drawText(font, ctx, [{ text: label, color: '#ffffff' }], box.x + box.w / 2, headerCy, {
      size: TEXT_SIZE,
    });
  };

  header(POS_BOX, 'Nº');
  header(HEADER_PLAYER, 'JOGADOR');
  COLUMNS.forEach((column) => header(column, column.label));

  // Linhas
  rows.forEach((entry, index) => {
    const top = ROW_TOP + index * ROW_PITCH;
    const cy = top + BOX_H / 2;

    drawPanel(ctx, { x: POS_BOX.x, y: top, w: POS_BOX.w, h: BOX_H });
    drawPanel(ctx, { x: HEAD_BOX.x, y: top, w: HEAD_BOX.w, h: BOX_H });
    drawPanel(ctx, { x: NAME_BOX.x, y: top, w: NAME_BOX.w, h: BOX_H });
    COLUMNS.forEach((column) => drawPanel(ctx, { x: column.x, y: top, w: column.w, h: BOX_H }));

    drawText(
      font,
      ctx,
      [{ text: `${entry.position}º`, color: POSITION_COLORS[entry.position] ?? '#ffffff' }],
      POS_BOX.x + POS_BOX.w / 2,
      cy,
      { size: TEXT_SIZE },
    );

    const head = heads[index];
    if (head) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        head,
        Math.round(HEAD_BOX.x + (HEAD_BOX.w - HEAD_SIZE) / 2),
        Math.round(cy - HEAD_SIZE / 2),
        HEAD_SIZE,
        HEAD_SIZE,
      );
    }

    drawText(font, ctx, nameSegments(entry), NAME_BOX.x + 8, cy, {
      size: TEXT_SIZE,
      align: 'left',
    });

    COLUMNS.forEach((column, columnIndex) => {
      const segments =
        column.format === 'badge'
          ? levelSegments(entry)
          : [
              {
                text: formatValue(entry.values[column.key] ?? 0, column.format),
                color: '#ffffff',
              },
            ];

      drawText(font, ctx, segments, column.x + column.w / 2, cy, { size: TEXT_SIZE });
    });
  });

  return canvas.toBuffer('png');
}
