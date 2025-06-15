export const command = 'emoji';

const emojiMap = {
  // 😀 Faces
  smile: '😊',
  grin: '😁',
  joy: '😂',
  rofl: '🤣',
  sad: '😢',
  cry: '😭',
  angry: '😡',
  wow: '😮',
  kiss: '😘',
  heart_eyes: '😍',
  thinking: '🤔',
  cool: '😎',
  sleepy: '😴',
  poop: '💩',
  scared: '😱',
  blush: '😊',
  wink: '😉',
  neutral: '😐',
  confused: '😕',

  // 👍 Gestures
  thumbs: '👍',
  down: '👎',
  clap: '👏',
  ok: '👌',
  pray: '🙏',
  punch: '👊',
  wave: '👋',
  writing: '✍️',
  call: '🤙',

  // ❤️ Love / Symbols
  heart: '❤️',
  broken_heart: '💔',
  star: '⭐',
  sparkle: '✨',
  fire: '🔥',
  100: '💯',
  check: '✅',
  cross: '❌',
  question: '❓',
  exclamation: '❗',

  // 🐶 Animals
  dog: '🐶',
  cat: '🐱',
  lion: '🦁',
  tiger: '🐯',
  monkey: '🐵',
  unicorn: '🦄',
  dragon: '🐉',
  horse: '🐴',

  // 🌍 Nature
  sun: '☀️',
  moon: '🌙',
  cloud: '☁️',
  rain: '🌧️',
  snow: '❄️',
  tree: '🌳',
  flower: '🌸',
  firework: '🎆',

  // 🍔 Food
  pizza: '🍕',
  burger: '🍔',
  fries: '🍟',
  cake: '🎂',
  icecream: '🍦',
  apple: '🍎',
  banana: '🍌',
  grapes: '🍇',
  coffee: '☕',
  drink: '🍹',

  // ⚽ Activities
  soccer: '⚽',
  basketball: '🏀',
  trophy: '🏆',
  medal: '🥇',
  game: '🎮',
  music: '🎵',
  guitar: '🎸',

  // 🚗 Travel
  car: '🚗',
  bike: '🚲',
  bus: '🚌',
  train: '🚆',
  plane: '✈️',
  rocket: '🚀',
  ship: '🚢',
  map: '🗺️',

  // 💼 Work / Objects
  laptop: '💻',
  phone: '📱',
  bulb: '💡',
  lock: '🔒',
  key: '🔑',
  money: '💰',
  clock: '⏰',
  book: '📚',
  mail: '📧',
  tools: '🛠️',

  // 🏳️ Flags
  nigeria: '🇳🇬',
  usa: '🇺🇸',
  uk: '🇬🇧',
  india: '🇮🇳',
  china: '🇨🇳',
  france: '🇫🇷',
  germany: '🇩🇪',
  japan: '🇯🇵'
};

export async function execute(sock, m, jid) {
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const args = text.split(' ');
  const emojiName = args[1]?.toLowerCase();

  if (!emojiName) {
    await sock.sendMessage(jid, {
      text: '📝 Usage: `.emoji heart` or `.emoji fire`\n\nTry `.emoji list` to see available emojis.'
    });
    return;
  }

  if (emojiName === 'list') {
    const available = Object.keys(emojiMap).join(', ');
    await sock.sendMessage(jid, {
      text: `📦 *Available Emojis:*\n${available}`
    });
    return;
  }

  const emoji = emojiMap[emojiName];

  if (emoji) {
    await sock.sendMessage(jid, { text: emoji });
  } else {
    await sock.sendMessage(jid, { text: `❌ Emoji not found for: "${emojiName}". Try \`.emoji list\`` });
  }
}
