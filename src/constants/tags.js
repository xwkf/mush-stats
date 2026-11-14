const TAG_LABELS = {
  member: 'Membro',
  vip: 'VIP',
  mvp: 'MVP',
  pro: 'Pro',
  ultra: 'Ultra',
  enderlore: 'Enderlore',
  vacation0: 'Férias',
  ferias_dark_green: 'Férias (Verde Escuro)',
  carnaval: 'Carnaval',
  natal: 'Natal',
  ultra_plus: 'Ultra+',
  ultra_plus_tier_0: 'Ultra+',
  beta: 'Beta',
};

function humanize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getTagLabel(tag) {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  if (tag.startsWith('ultra_plus')) return 'Ultra+';
  return humanize(tag);
}

export function getTagLabels(tags = []) {
  return [...new Set(tags.map(getTagLabel))];
}

export function formatTagLabels(labels) {
  return labels.map((label) => `**\`${label}\`**`).join(', ');
}
