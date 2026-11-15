/** Modular Block Figure parts. All designs are original to Builder's Bench. */

export type FigureSlot = 'headgear' | 'expression' | 'torso' | 'legs' | 'accessory';

export interface FigurePart {
  id: string;
  name: string;
}

export const HEADGEAR: FigurePart[] = [
  { id: 'none', name: 'Bare Head' },
  { id: 'space-helmet', name: 'Space Helmet' },
  { id: 'knight-visor', name: 'Knight Visor' },
  { id: 'ninja-hood', name: 'Ninja Hood' },
  { id: 'spiky-hair', name: 'Spiky Hair' },
  { id: 'wizard-hat', name: 'Wizard Hat' },
  { id: 'royal-crown', name: 'Royal Crown' },
  { id: 'cyber-visor', name: 'Cyber Visor' },
  // Append only: share links store each part's index in its list.
  { id: 'chef-hat', name: 'Chef Hat' },
  { id: 'baseball-cap', name: 'Baseball Cap' },
  { id: 'horned-helmet', name: 'Horned Helmet' },
  { id: 'top-hat', name: 'Top Hat' },
  { id: 'headphones', name: 'Headphones' },
];

export const EXPRESSIONS: FigurePart[] = [
  { id: 'classic-smile', name: 'Classic Smile' },
  { id: 'hero-grin', name: 'Hero Grin' },
  { id: 'cool-sunglasses', name: 'Cool Sunglasses' },
  { id: 'bot-face', name: 'Bot Face' },
  { id: 'pirate-eyepatch', name: 'Pirate Eyepatch' },
  { id: 'battle-determination', name: 'Battle Determination' },
  { id: 'wink', name: 'Wink' },
  { id: 'surprised', name: 'Surprised' },
  { id: 'sleepy', name: 'Sleepy' },
  { id: 'freckles', name: 'Freckles' },
];

export const TORSOS: FigurePart[] = [
  { id: 'astronaut-suit', name: 'Astronaut Suit' },
  { id: 'castle-armor', name: 'Castle Armor' },
  { id: 'hero-emblem', name: 'Hero Emblem' },
  { id: 'ninja-tunic', name: 'Ninja Tunic' },
  { id: 'street-hoodie', name: 'Street Hoodie' },
  { id: 'cyber-mech-chest', name: 'Cyber Mech Chest' },
  { id: 'lab-coat', name: 'Lab Coat' },
  { id: 'explorer-vest', name: 'Explorer Vest' },
  { id: 'sports-jersey', name: 'Sports Jersey' },
  { id: 'chef-jacket', name: 'Chef Jacket' },
];

export const LEGS: FigurePart[] = [
  { id: 'standard-trousers', name: 'Standard Trousers' },
  { id: 'armored-greaves', name: 'Armored Greaves' },
  { id: 'utility-belt-legs', name: 'Utility Belt Legs' },
  { id: 'mech-legs', name: 'Mech Legs' },
  { id: 'shorts', name: 'Shorts' },
  { id: 'cargo-pants', name: 'Cargo Pants' },
];

export const ACCESSORIES: FigurePart[] = [
  { id: 'none', name: 'Empty Hands' },
  { id: 'laser-blaster', name: 'Laser Blaster' },
  { id: 'energy-blade', name: 'Energy Blade' },
  { id: 'broadsword', name: 'Broadsword' },
  { id: 'wrench', name: 'Wrench' },
  { id: 'tower-shield', name: 'Tower Shield' },
  { id: 'crystal-staff', name: 'Crystal Staff' },
  { id: 'magic-wand', name: 'Magic Wand' },
  { id: 'pickaxe', name: 'Pickaxe' },
  { id: 'torch', name: 'Torch' },
  { id: 'spyglass', name: 'Spyglass' },
];

export interface SlotDef {
  slot: FigureSlot;
  label: string;
  parts: FigurePart[];
  /** Which BlockFigure field stores the part id. */
  field: 'hatId' | 'headId' | 'torsoId' | 'legsId' | 'accessoryId';
  /** Color keys this slot's picker edits. */
  colorKeys: ColorKey[];
}

export type ColorKey = 'headgear' | 'head' | 'torso' | 'arms' | 'legs' | 'accessory';

export const COLOR_LABEL: Record<ColorKey, string> = {
  headgear: 'Headgear',
  head: 'Skin',
  torso: 'Torso',
  arms: 'Arms',
  legs: 'Legs',
  accessory: 'Accessory',
};

export const SLOTS: SlotDef[] = [
  { slot: 'headgear', label: 'Headgear', parts: HEADGEAR, field: 'hatId', colorKeys: ['headgear'] },
  { slot: 'expression', label: 'Expression', parts: EXPRESSIONS, field: 'headId', colorKeys: ['head'] },
  { slot: 'torso', label: 'Torso', parts: TORSOS, field: 'torsoId', colorKeys: ['torso', 'arms'] },
  { slot: 'legs', label: 'Legs', parts: LEGS, field: 'legsId', colorKeys: ['legs'] },
  { slot: 'accessory', label: 'Accessory', parts: ACCESSORIES, field: 'accessoryId', colorKeys: ['accessory'] },
];

export interface Faction {
  id: string;
  name: string;
  hex: string;
}

export const FACTIONS: Faction[] = [
  { id: 'space', name: 'Space', hex: '#2563EB' },
  { id: 'castle', name: 'Castle', hex: '#6C6E68' },
  { id: 'city', name: 'City', hex: '#F59E0B' },
  { id: 'heroes', name: 'Heroes', hex: '#EF4444' },
];

export function getFaction(id: string | undefined): Faction {
  return FACTIONS.find((f) => f.id === id) ?? FACTIONS[0];
}

export function partName(parts: FigurePart[], id: string): string {
  return parts.find((p) => p.id === id)?.name ?? id;
}
