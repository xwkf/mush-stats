const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  }).format(date);
}

export function formatDuration(milliseconds) {
  const seconds = Math.floor(Number(milliseconds) / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
