import { fuzzyScoreQuery } from './fuzzySearch.js';

/** @type {{ emoji: string, keywords: string[] }[]} */
const ENTRIES = [
  { emoji: '🛒', keywords: ['cart', 'shop', 'grocery', 'store', 'market'] },
  { emoji: '🥛', keywords: ['milk', 'dairy', 'drink', 'beverage'] },
  { emoji: '🍞', keywords: ['bread', 'bakery', 'toast', 'loaf'] },
  { emoji: '🍚', keywords: ['rice', 'grain', 'basmati'] },
  { emoji: '🧈', keywords: ['butter', 'spread'] },
  { emoji: '🥚', keywords: ['egg', 'eggs'] },
  { emoji: '🧀', keywords: ['cheese', 'dairy'] },
  { emoji: '🍎', keywords: ['apple', 'fruit'] },
  { emoji: '🥬', keywords: ['vegetable', 'greens', 'lettuce', 'spinach'] },
  { emoji: '🫒', keywords: ['olive', 'oil'] },
  { emoji: '☕', keywords: ['coffee', 'cafe', 'espresso'] },
  { emoji: '🍵', keywords: ['tea', 'chai', 'green tea'] },
  { emoji: '🧂', keywords: ['salt', 'seasoning'] },
  { emoji: '🍯', keywords: ['honey', 'sweet'] },
  { emoji: '🥫', keywords: ['can', 'canned', 'tin'] },
  { emoji: '🌾', keywords: ['flour', 'wheat', 'atta', 'grain'] },
  { emoji: '🍽️', keywords: ['food', 'meal', 'plate', 'dining'] },
  { emoji: '🍕', keywords: ['pizza'] },
  { emoji: '🍔', keywords: ['burger', 'fast food'] },
  { emoji: '🍗', keywords: ['chicken', 'poultry', 'meat'] },
  { emoji: '🍜', keywords: ['noodle', 'ramen', 'soup'] },
  { emoji: '🍰', keywords: ['cake', 'dessert', 'bakery'] },
  { emoji: '🍫', keywords: ['chocolate', 'candy', 'sweet'] },
  { emoji: '🍦', keywords: ['ice cream', 'frozen', 'dessert'] },
  { emoji: '🥡', keywords: ['takeout', 'delivery', 'chinese'] },
  { emoji: '🧁', keywords: ['cupcake', 'muffin', 'bakery'] },
  { emoji: '🥪', keywords: ['sandwich', 'sub'] },
  { emoji: '🌮', keywords: ['taco', 'mexican'] },
  { emoji: '🍱', keywords: ['bento', 'lunch', 'japanese'] },
  { emoji: '🥘', keywords: ['curry', 'stew', 'cook'] },
  { emoji: '💄', keywords: ['makeup', 'lipstick', 'cosmetic', 'beauty'] },
  { emoji: '🧴', keywords: ['bottle', 'lotion', 'shampoo', 'soap', 'wash'] },
  { emoji: '🧼', keywords: ['soap', 'bar', 'hand wash'] },
  { emoji: '🪥', keywords: ['toothbrush', 'dental', 'teeth'] },
  { emoji: '💅', keywords: ['nail', 'polish', 'manicure'] },
  { emoji: '🪒', keywords: ['razor', 'shave', 'blade'] },
  { emoji: '🧖', keywords: ['spa', 'bath', 'towel'] },
  { emoji: '✨', keywords: ['sparkle', 'clean', 'new', 'shine'] },
  { emoji: '🫧', keywords: ['bubble', 'foam', 'soap'] },
  { emoji: '💆', keywords: ['massage', 'skincare', 'face'] },
  { emoji: '💊', keywords: ['medicine', 'pill', 'tablet', 'pharmacy', 'drug'] },
  { emoji: '🩹', keywords: ['bandage', 'plaster', 'first aid'] },
  { emoji: '🩺', keywords: ['doctor', 'health', 'medical'] },
  { emoji: '🧬', keywords: ['supplement', 'vitamin', 'health'] },
  { emoji: '💉', keywords: ['vaccine', 'injection', 'syringe'] },
  { emoji: '🌡️', keywords: ['thermometer', 'fever', 'temperature'] },
  { emoji: '😷', keywords: ['mask', 'face', 'flu'] },
  { emoji: '💪', keywords: ['protein', 'fitness', 'gym', 'health'] },
  { emoji: '🏥', keywords: ['hospital', 'clinic', 'medical'] },
  { emoji: '🧹', keywords: ['broom', 'sweep', 'clean'] },
  { emoji: '🧽', keywords: ['sponge', 'scrub', 'clean'] },
  { emoji: '🧻', keywords: ['tissue', 'toilet paper', 'roll', 'paper'] },
  { emoji: '🗑️', keywords: ['trash', 'garbage', 'bin', 'waste'] },
  { emoji: '🪣', keywords: ['bucket', 'mop', 'water'] },
  { emoji: '🔋', keywords: ['battery', 'power', 'aa', 'aaa'] },
  { emoji: '💡', keywords: ['bulb', 'light', 'lamp', 'led'] },
  { emoji: '🏠', keywords: ['home', 'house', 'household'] },
  { emoji: '🪴', keywords: ['plant', 'flower', 'garden'] },
  { emoji: '🔌', keywords: ['plug', 'charger', 'electric', 'power'] },
  { emoji: '📱', keywords: ['phone', 'mobile', 'smartphone'] },
  { emoji: '💻', keywords: ['laptop', 'computer', 'pc'] },
  { emoji: '🎧', keywords: ['headphone', 'earphone', 'audio'] },
  { emoji: '🖱️', keywords: ['mouse', 'computer'] },
  { emoji: '⌨️', keywords: ['keyboard', 'typing'] },
  { emoji: '📷', keywords: ['camera', 'photo'] },
  { emoji: '🔊', keywords: ['speaker', 'sound', 'audio'] },
  { emoji: '📦', keywords: ['box', 'package', 'parcel', 'delivery'] },
  { emoji: '🏷️', keywords: ['label', 'tag', 'price'] },
  { emoji: '🛍️', keywords: ['bag', 'shopping', 'retail'] },
  { emoji: '📋', keywords: ['list', 'clipboard', 'inventory'] },
  { emoji: '🔖', keywords: ['bookmark', 'mark'] },
  { emoji: '📎', keywords: ['clip', 'office', 'stationery'] },
  { emoji: '🧃', keywords: ['juice', 'drink', 'beverage'] },
  { emoji: '🥤', keywords: ['soda', 'soft drink', 'cup'] },
  { emoji: '🍌', keywords: ['banana', 'fruit'] },
  { emoji: '🍊', keywords: ['orange', 'citrus', 'fruit'] },
  { emoji: '🥔', keywords: ['potato', 'vegetable'] },
  { emoji: '🧅', keywords: ['onion', 'vegetable'] },
  { emoji: '🍅', keywords: ['tomato', 'vegetable', 'sauce'] },
  { emoji: '🫘', keywords: ['beans', 'lentil', 'dal'] },
  { emoji: '🍝', keywords: ['pasta', 'spaghetti', 'italian'] },
  { emoji: '🥣', keywords: ['cereal', 'bowl', 'breakfast'] },
  { emoji: '🧊', keywords: ['ice', 'frozen', 'cold'] },
  { emoji: '🧯', keywords: ['fire', 'safety', 'extinguisher'] },
  { emoji: '🧴', keywords: ['sanitizer', 'gel', 'hand'] },
  { emoji: '🪥', keywords: ['toothpaste', 'paste'] },
  { emoji: '🧴', keywords: ['detergent', 'laundry', 'wash'] },
  { emoji: '🧺', keywords: ['laundry', 'basket', 'clothes'] },
  { emoji: '👕', keywords: ['shirt', 'clothing', 'apparel'] },
  { emoji: '🧦', keywords: ['socks', 'clothing'] },
  { emoji: '🐾', keywords: ['pet', 'dog', 'cat', 'animal'] },
  { emoji: '🍼', keywords: ['baby', 'infant', 'formula'] },
  { emoji: '🧸', keywords: ['toy', 'kids', 'child'] },
  { emoji: '🎁', keywords: ['gift', 'present'] },
  { emoji: '♻️', keywords: ['recycle', 'eco', 'green'] },
  { emoji: '🌿', keywords: ['organic', 'natural', 'herb'] },
  { emoji: '🔧', keywords: ['tool', 'repair', 'hardware'] },
  { emoji: '🧰', keywords: ['toolbox', 'kit', 'repair'] },
  { emoji: '📺', keywords: ['tv', 'television', 'screen'] },
  { emoji: '🖨️', keywords: ['printer', 'ink', 'office'] },
  { emoji: '✏️', keywords: ['pencil', 'pen', 'stationery', 'write'] },
  { emoji: '📚', keywords: ['book', 'study', 'read'] },
  { emoji: '🧯', keywords: ['cleaning', 'spray'] },
  { emoji: '🫙', keywords: ['jar', 'container', 'pickle'] },
  { emoji: '🥜', keywords: ['peanut', 'nut', 'snack'] },
  { emoji: '🍪', keywords: ['cookie', 'biscuit', 'snack'] },
  { emoji: '🥨', keywords: ['pretzel', 'snack'] },
  { emoji: '🍿', keywords: ['popcorn', 'snack'] },
  { emoji: '🧇', keywords: ['waffle', 'breakfast'] },
  { emoji: '🥞', keywords: ['pancake', 'breakfast', 'syrup'] },
  { emoji: '🫖', keywords: ['kettle', 'tea pot'] },
  { emoji: '🧊', keywords: ['cooler', 'fridge', 'refrigerator'] },
  { emoji: '❄️', keywords: ['freezer', 'cold', 'frozen'] },
  { emoji: '🔥', keywords: ['gas', 'stove', 'cook', 'hot'] },
  { emoji: '🍳', keywords: ['pan', 'cook', 'fry', 'egg'] },
  { emoji: '🥄', keywords: ['spoon', 'utensil', 'kitchen'] },
  { emoji: '🍴', keywords: ['fork', 'cutlery', 'utensil'] },
  { emoji: '🔪', keywords: ['knife', 'kitchen', 'cut'] },
  { emoji: '🧤', keywords: ['gloves', 'cleaning', 'dish'] },
];

function dedupeCatalog(list) {
  const byEmoji = new Map();
  for (const entry of list) {
    const prev = byEmoji.get(entry.emoji);
    if (!prev) {
      byEmoji.set(entry.emoji, { emoji: entry.emoji, keywords: [...entry.keywords] });
      continue;
    }
    const seen = new Set(prev.keywords);
    for (const k of entry.keywords) {
      if (!seen.has(k)) {
        prev.keywords.push(k);
        seen.add(k);
      }
    }
  }
  return [...byEmoji.values()];
}

export const SUPPLY_EMOJI_CATALOG = dedupeCatalog(ENTRIES);

export function searchEmojiCatalog(query, { limit = 48, catalog = SUPPLY_EMOJI_CATALOG } = {}) {
  const q = (query || '').trim();
  if (!q) return catalog.slice(0, limit).map((e) => e.emoji);

  const scored = [];
  for (const entry of catalog) {
    const fields = [entry.keywords.join(' '), entry.emoji, ...entry.keywords];
    const score = fuzzyScoreQuery(q, fields);
    if (score > 0) scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry.emoji);
}
