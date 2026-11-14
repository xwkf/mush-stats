import { Canvas } from 'skia-canvas';
import { FontRender, defaultFontPath } from 'minecraft-font-renderer';

// ---------------------------------------------------------------------------
// Utilidades de texto/painel (minecraft-font-renderer + skia-canvas)
// ---------------------------------------------------------------------------
export const MC_COLORS = {
  0: '#000000',
  1: '#0000aa',
  2: '#00aa00',
  3: '#00aaaa',
  4: '#aa0000',
  5: '#aa00aa',
  6: '#ffaa00',
  7: '#aaaaaa',
  8: '#555555',
  9: '#5555ff',
  a: '#55ff55',
  b: '#55ffff',
  c: '#ff5555',
  d: '#ff55ff',
  e: '#ffff55',
  f: '#ffffff',
};

let fontPromise = null;

export function getFont() {
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

export function hexToRgb(hex) {
  const value = Number.parseInt(String(hex).replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function shade(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

/** Cor #rrggbb da API -> cor do Minecraft mais próxima (#rrggbb). */
export function nearestMcColor(hex, fallback = '#ffffff') {
  if (!/^#?[0-9a-f]{6}$/i.test(String(hex ?? '').trim())) return fallback;

  const rgb = hexToRgb(String(hex).trim());
  let best = fallback;
  let bestDistance = Infinity;

  for (const color of Object.values(MC_COLORS)) {
    const distance = hexToRgb(color).reduce((sum, channel, i) => sum + (channel - rgb[i]) ** 2, 0);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }

  return best;
}

/**
 * Converte um texto com códigos "&x" (ex.: "&1[1021&lΩ&1]") em segmentos coloridos.
 * Cada segmento sai com `join: true` (colados uns nos outros).
 */
export function parseColorCodes(text, baseColor = '#ffffff') {
  const segments = [];
  let color = baseColor;
  let bold = false;
  let buffer = '';

  const flush = () => {
    if (buffer) segments.push({ text: buffer, color, bold, join: true });
    buffer = '';
  };

  const input = String(text ?? '');

  for (let i = 0; i < input.length; i += 1) {
    if ((input[i] === '&' || input[i] === '§') && i + 1 < input.length) {
      const code = input[i + 1].toLowerCase();

      if (code in MC_COLORS) {
        flush();
        color = MC_COLORS[code];
        bold = false;
        i += 1;
        continue;
      }

      if (code === 'l' || code === 'r' || 'kmno'.includes(code)) {
        flush();
        if (code === 'l') bold = true;
        if (code === 'r') {
          color = baseColor;
          bold = false;
        }
        i += 1;
        continue;
      }
    }

    buffer += input[i];
  }

  flush();
  return segments;
}

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
 * Desenha uma linha de texto.
 * @param segments [{ text, color, bold?, join? }] — `join` cola no segmento anterior.
 * @param align 'center' (x = centro) | 'left' (x = início do texto)
 */
export function drawText(
  font,
  ctx,
  segments,
  x,
  cy,
  { size, bold = false, shadow = 0.2, align = 'center', gap = size * 4 } = {},
) {
  const parts = segments.map((segment) => ({
    ...segment,
    layer: renderSegment(font, segment.text, size, segment.bold ?? bold),
  }));

  const advances = parts.map((part, index) => (index > 0 && !part.join ? gap : 0));
  const total = parts.reduce((sum, part, index) => sum + part.layer.width + advances[index], 0);
  const height = Math.max(...parts.map((part) => part.layer.height));
  const offset = Math.max(1, Math.round(size * 0.4));

  let cursor = Math.round(align === 'left' ? x : x - total / 2);
  const y = Math.round(cy - height / 2);

  ctx.imageSmoothingEnabled = false;

  parts.forEach((part, index) => {
    cursor += advances[index];
    const color = part.color ?? '#ffffff';
    const { layer } = part;

    if (shadow > 0) {
      ctx.drawImage(tint(layer, shade(color, shadow)), cursor - layer.pad + offset, y - layer.pad + offset);
    }

    ctx.drawImage(tint(layer, color), cursor - layer.pad, y - layer.pad);
    cursor += layer.width;
  });

  return total;
}

export function roundedRect(ctx, x, y, w, h, radius = 8) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Painel escuro translúcido com a faixa clara embaixo. */
export function drawPanel(ctx, { x, y, w, h, bevel = 5, alpha = 0.58, fill = '0, 0, 0' }) {
  roundedRect(ctx, x, y + bevel, w, h, 7);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fill();

  roundedRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = `rgba(${fill}, ${alpha})`;
  ctx.fill();
}
