export const STOP_WORDS = new Set([
  'дай','найди','покажи','что','как','где','кто','про','для','это','есть','мне','нам','или','еще','ещё','сейчас','сегодня','вот','там','тут','на','по','из','от','за','без','при','под','над','тебе','меня','будет','быть','очень','просто','можно','надо','нужно','стал','стала','стали','самый','самая','самое','бро','друг','ок','ладно','ага','давай','хочу','можем','поговорить','общаться','поболтать','поболтаться',
  'the','and','for','with','about','show','find','give','what','how','where','who','please','now','today','is','are','was','were','me','you','can','could','would','should',
  'el','la','los','las','que','como','para','por','con','sobre','de','der','die','das','und','was','wie','wo','über',
]);

export const PRONOUN_HINTS = ['он','она','они','его','ее','её','him','her','it','they','them','he','she'];

export function normalize(text: string) {
  return text.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-яіїєґ0-9@#\s-]/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenize(text: string) {
  return normalize(text)
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 18);
}

export function compactText(text: string, max = 360) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

export function detectLanguage(query: string, fallback: string) {
  if (/[а-яёіїєґ]/i.test(query)) return 'ru';
  if (/\b(hi|hello|news|show|find|what|why|how|video|photo|recipe|thanks)\b/i.test(query)) return 'us';
  return fallback === 'ru' || fallback === 'us' ? fallback : 'us';
}
