const RULES = [
  {
    category: 'grocery',
    emoji: '🛒',
    emojis: ['🛒', '🥛', '🍞', '🍚', '🧈', '🥚', '🧀', '🍎', '🥬', '🫒', '☕', '🍵', '🧂', '🍯', '🥫', '🌾'],
    keywords: [
      'milk', 'bread', 'rice', 'flour', 'sugar', 'salt', 'oil', 'butter', 'egg', 'eggs',
      'cheese', 'yogurt', 'cereal', 'pasta', 'noodle', 'dal', 'lentil', 'beans', 'tea',
      'coffee', 'juice', 'water bottle', 'snack', 'chips', 'biscuit', 'cookie', 'honey',
      'jam', 'ketchup', 'sauce', 'spice', 'masala', 'onion', 'potato', 'tomato', 'vegetable',
      'fruit', 'apple', 'banana', 'orange', 'grocery', 'atta', 'ghee',
    ],
  },
  {
    category: 'food',
    emoji: '🍽️',
    emojis: ['🍽️', '🍕', '🍔', '🍗', '🍜', '🍰', '🍫', '🍦', '🥡', '🧁', '🥪', '🌮', '🍱', '🥘'],
    keywords: [
      'meal', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'sandwich', 'chicken',
      'fish', 'meat', 'frozen', 'ice cream', 'chocolate', 'candy', 'sweet', 'restaurant',
      'takeout', 'delivery', 'ready to eat', 'instant', 'noodle cup', 'ramen',
    ],
  },
  {
    category: 'cosmetics',
    emoji: '💄',
    emojis: ['💄', '🧴', '🧼', '🪥', '💅', '🪒', '🧖', '✨', '🫧', '💆'],
    keywords: [
      'shampoo', 'conditioner', 'soap', 'body wash', 'lotion', 'cream', 'moisturizer',
      'sunscreen', 'perfume', 'deodorant', 'toothpaste', 'toothbrush', 'razor', 'shaving',
      'makeup', 'lipstick', 'foundation', 'serum', 'face wash', 'skincare', 'hair oil',
      'nail', 'cosmetic', 'beauty', 'facewash',
    ],
  },
  {
    category: 'health',
    emoji: '💊',
    emojis: ['💊', '🩹', '🩺', '🧬', '💉', '🌡️', '😷', '🧴', '💪', '🏥'],
    keywords: [
      'medicine', 'tablet', 'pill', 'vitamin', 'supplement', 'bandage', 'first aid',
      'thermometer', 'mask', 'sanitizer', 'hand sanitizer', 'paracetamol', 'ibuprofen',
      'aspirin', 'cough', 'cold', 'pain relief', 'protein powder', 'pharmacy', 'health',
    ],
  },
  {
    category: 'household',
    emoji: '🧹',
    emojis: ['🧹', '🧽', '🧻', '🫧', '🗑️', '🪣', '🔋', '💡', '🧴', '🏠', '🪴'],
    keywords: [
      'detergent', 'dishwash', 'dish soap', 'cleaner', 'bleach', 'tissue', 'toilet paper',
      'paper towel', 'trash bag', 'garbage bag', 'sponge', 'mop', 'broom', 'vacuum',
      'battery', 'bulb', 'light bulb', 'tape', 'foil', 'wrap', 'ziploc', 'laundry',
      'fabric softener', 'air freshener', 'insect', 'pest',
    ],
  },
  {
    category: 'electronics',
    emoji: '🔌',
    emojis: ['🔌', '🔋', '📱', '💻', '🎧', '🖱️', '⌨️', '📷', '🔊', '💡'],
    keywords: [
      'charger', 'cable', 'usb', 'adapter', 'battery pack', 'power bank', 'headphone',
      'earphone', 'speaker', 'mouse', 'keyboard', 'hdmi', 'extension cord', 'bulb led',
    ],
  },
];

const OTHER_POOL = ['📦', '🏷️', '🛍️', '📋', '✨', '🔖', '📎'];

const RULE_BY_CATEGORY = Object.fromEntries(RULES.map((r) => [r.category, r]));

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

/** Stable pick from a pool so the same name always gets the same emoji. */
export function pickEmojiFromPool(pool, seed) {
  if (!pool?.length) return '📦';
  const s = seed || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

function emojiPoolForCategory(category) {
  const rule = RULE_BY_CATEGORY[category];
  if (rule?.emojis?.length) return rule.emojis;
  if (rule?.emoji) return [rule.emoji];
  return OTHER_POOL;
}

/** Longest keyword substring match in text (used to tune emoji pool). */
function longestKeywordMatch(haystack) {
  let best = null;
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw) && (!best || kw.length > best.keyword.length)) {
        best = { rule, keyword: kw };
      }
    }
  }
  return best;
}

/**
 * Guess emoji from item text: category pool + stable hash(seed).
 * Uses longest keyword hit to prefer that category's pool; otherwise `category` arg.
 */
export function guessEmoji(name, brand = '', category = 'other') {
  const haystack = normalize(`${name} ${brand}`);
  const tokens = tokenize(haystack);
  const seed = tokens.length ? tokens.join('|') : haystack || 'item';

  const kw = longestKeywordMatch(haystack);
  const poolCategory = kw?.rule.category || category || 'other';
  const pool = emojiPoolForCategory(poolCategory);

  // Mix keyword + tokens into seed so "milk" vs "bread" differ within grocery pool
  const pickSeed = kw ? `${kw.keyword}:${seed}` : seed;
  return pickEmojiFromPool(pool, pickSeed);
}

export function suggestCategory(name, brand = '') {
  const haystack = normalize(`${name} ${brand}`);
  let best = { category: 'other', score: 0 };

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) score += kw.length;
    }
    if (score > best.score) best = { category: rule.category, score };
  }

  return best.category;
}

export function suggestCategoryAndEmoji(name, brand = '') {
  const category = suggestCategory(name, brand);
  const emoji = guessEmoji(name, brand, category);
  return { category, emoji };
}

export function formatCategory(cat) {
  if (!cat) return 'Other';
  return cat
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
