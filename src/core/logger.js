const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

const minLevel = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function write(level, args) {
  if (LEVELS[level] < minLevel) return;

  const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  const prefix = `${COLORS[level]}[${time}] [${level.toUpperCase()}]${RESET}`;
  const output = level === 'error' ? console.error : console.log;

  output(prefix, ...args);
}

export const logger = {
  debug: (...args) => write('debug', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
};
