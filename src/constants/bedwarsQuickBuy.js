// Mapeamento dos ids da Compra Rápida do Mush -> textura (Minecraft 1.8.8).
//
// As texturas vêm do repositório PrismarineJS/minecraft-assets:
//   items/<arquivo>.png  -> itens planos
//   blocks/<arquivo>.png -> blocos (renderizados em cubo isométrico)
//
// kind:
//   item   -> ícone plano em data/1.8.8/items
//   flat   -> ícone plano em data/1.8.8/blocks (ex.: escada)
//   block  -> cubo isométrico (top/side/bottom em data/1.8.8/blocks)
//   potion -> garrafa + overlay colorido
//   chest  -> baú desenhado em código
//
// count: quantidade exibida no canto do slot (igual à loja do jogo).
// glint: aplica o brilho roxo de encantamento.
// label: texto dourado no canto (ex.: nível do encantamento).

export const ITEM_ASSETS_BASE =
  process.env.ITEM_ASSETS_BASE ??
  'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.8.8';

export const QUICK_BUY_ITEMS = {
  // Blocos
  wool: { kind: 'block', top: 'wool_colored_white', count: 16 },
  clay: { kind: 'block', top: 'hardened_clay', count: 16 },
  hardened_clay: { kind: 'block', top: 'hardened_clay', count: 16 },
  glass: { kind: 'block', top: 'glass', count: 4 },
  blast_proof_glass: { kind: 'block', top: 'glass', count: 4 },
  end_stone: { kind: 'block', top: 'end_stone', count: 12 },
  ladder: { kind: 'flat', texture: 'ladder', count: 16 },
  wood: { kind: 'block', top: 'planks_oak', count: 16 },
  planks: { kind: 'block', top: 'planks_oak', count: 16 },
  obsidian: { kind: 'block', top: 'obsidian', count: 4 },
  sponge: { kind: 'block', top: 'sponge', count: 4 },

  // Espadas
  stone_sword: { kind: 'item', texture: 'stone_sword' },
  iron_sword: { kind: 'item', texture: 'iron_sword' },
  diamond_sword: { kind: 'item', texture: 'diamond_sword' },
  knockback_stick: { kind: 'item', texture: 'stick', glint: true },

  // Armaduras
  chainmail_armor: { kind: 'item', texture: 'chainmail_boots' },
  iron_armor: { kind: 'item', texture: 'iron_boots' },
  diamond_armor: { kind: 'item', texture: 'diamond_boots' },

  // Ferramentas
  shears: { kind: 'item', texture: 'shears' },
  pickaxe: { kind: 'item', texture: 'wood_pickaxe', glint: true },
  axe: { kind: 'item', texture: 'wood_axe', glint: true },

  // Arcos e flechas
  bow: { kind: 'item', texture: 'bow_standby' },
  bow_lvl1: { kind: 'item', texture: 'bow_standby' },
  bow_lvl2: { kind: 'item', texture: 'bow_standby', glint: true, label: 'I' },
  bow_lvl3: { kind: 'item', texture: 'bow_standby', glint: true, label: 'II' },
  arrow: { kind: 'item', texture: 'arrow', count: 8 },

  // Poções
  speed_potion: { kind: 'potion', color: '#7cafc6' },
  jump_potion: { kind: 'potion', color: '#22ff4c' },
  invisibility_potion: { kind: 'potion', color: '#f6f6f6' },

  // Utilidades
  golden_apple: { kind: 'item', texture: 'apple_golden' },
  silverfish: { kind: 'item', texture: 'snowball' },
  bed_bug: { kind: 'item', texture: 'snowball' },
  dream_defender: { kind: 'item', texture: 'spawn_egg' },
  fireball: { kind: 'item', texture: 'fireball' },
  tnt: { kind: 'block', top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
  ender_pearl: { kind: 'item', texture: 'ender_pearl' },
  water_bucket: { kind: 'item', texture: 'bucket_water' },
  bridge_egg: { kind: 'item', texture: 'egg' },
  magic_milk: { kind: 'item', texture: 'bucket_milk' },
  popup_tower: { kind: 'chest' },
  slingshot: { kind: 'item', texture: 'magma_cream' },
};

// Ícones da barra de categorias (linha de cima) e ids de `type: "category"`.
export const CATEGORY_ICONS = {
  quick_buy: { kind: 'item', texture: 'nether_star' },
  blocks: { kind: 'block', top: 'hardened_clay' },
  melee: { kind: 'item', texture: 'gold_sword' },
  armor: { kind: 'item', texture: 'chainmail_boots' },
  tools: { kind: 'item', texture: 'wood_pickaxe' },
  ranged: { kind: 'item', texture: 'bow_standby' },
  potions: { kind: 'item', texture: 'brewing_stand' },
  utility: { kind: 'block', top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
  rotating: { kind: 'item', texture: 'clock' },
};

export const CATEGORY_BAR = [
  'quick_buy',
  'blocks',
  'melee',
  'armor',
  'tools',
  'ranged',
  'potions',
  'utility',
  'rotating',
];

export const UNKNOWN_ITEM = { kind: 'item', texture: 'barrier' };
