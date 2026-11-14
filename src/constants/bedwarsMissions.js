const MISSION_LABELS = {
  upgrade_fatigue: 'Calma lá!',
  no_slingshot_wins: 'À moda antiga',
  kills: 'Lutador eficiente',
  bow_damage: 'Arqueiro',
  upgrade_sharpness_2: 'Afiado!',
};

export function getMissionLabel(key) {
  return MISSION_LABELS[key] ?? key;
}
