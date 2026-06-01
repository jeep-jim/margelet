import { cleanTrendText, isTrendNoiseToken, normalizeTrendToken } from "./trend-noise.js";

export type AttentionCandidate = {
  title: string;
  snippet: string;
  tokens: string[];
  signals: string[];
  fingerprint: string;
};

const SIGNAL_STOP = new Set([
  "это","что","как","если","или","его","её","ее","она","они","оно","уже","ещё","еще",
  "тут","там","вот","все","всё","сам","сама","сами","сейчас","сегодня","завтра","вчера",
  "который","которая","которые","которых","которое","чтобы","только","можно","нужно",
  "будет","будут","были","было","быть","через","после","перед","между","среди","очень",
  "наш","наша","наше","наши","канал","канале","канала","подписаться","подписывайтесь",
  "читать","читайте","смотреть","смотрите","открыть","реклама","партнерский","партнёрский",
  "telegram","телеграм","max","other","источник","источники","новости","news",
  "дорогие","подписчики","гости","волне","исправленного","привет","друзья","уважаемые",
  "the","and","for","with","this","that","from","are","was","were","you","your","about",
]);

const BAD_LINE_RE =
  /(подписывай|подписаться|наш канал|канал в max|в шапке профиля|ссылка в шапке|ссылка в профиле|реклама|дорогие подписчики|привет,? друзья|уважаемые подписчики)/i;

function stripEmojiAndNoise(value: string) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b(?:t\.me|max\.ru)\/\S+/gi, " ")
    .replace(/[@#][\wа-яё_.-]+/gi, " ")
    .replace(/[|•]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDisplayLine(value: string) {
  return stripEmojiAndNoise(value)
    .replace(/^[\s,.:;!?—–-]+|[\s,.:;!?—–-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSignalTokens(value: string, blockedHandles: Set<string>) {
  return stripEmojiAndNoise(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map(normalizeTrendToken)
    .filter((token) => token.length >= 3)
    .filter((token) => !SIGNAL_STOP.has(token))
    .filter((token) => !isTrendNoiseToken(token, blockedHandles))
    .filter((token) => !/^\d+$/.test(token))
    .slice(0, 32);
}

function splitUsefulLines(text: string, blockedHandles: Set<string>) {
  const cleaned = cleanTrendText(stripEmojiAndNoise(text), blockedHandles);
  const rawLines = String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(normalizeDisplayLine)
    .filter(Boolean);

  const lines = rawLines.length ? rawLines : cleaned.split(/[.!?]\s+/g);

  return lines
    .map(normalizeDisplayLine)
    .filter((line) => {
      if (line.length < 6) return false;
      if (BAD_LINE_RE.test(line)) return false;
      const tokens = extractSignalTokens(line, blockedHandles);
      return tokens.length >= 2;
    })
    .slice(0, 5);
}

function scoreLine(line: string, index: number, blockedHandles: Set<string>) {
  const tokens = extractSignalTokens(line, blockedHandles);
  let score = Math.max(0, 44 - index * 5) + tokens.length * 7;

  if (/[?？]$/.test(line)) score += 6;
  if (/[«"“]/.test(line)) score += 5;
  if (/\d/.test(line)) score += 4;
  if (line.length >= 24 && line.length <= 130) score += 14;
  if (tokens.length >= 3 && tokens.length <= 12) score += 12;
  if (tokens.some((token) => token.length >= 8)) score += 6;
  if (BAD_LINE_RE.test(line)) score -= 120;

  return score;
}

function titleFromLine(line: string) {
  const title = normalizeDisplayLine(line);
  if (!title) return "";

  const words = title.split(/\s+/).filter(Boolean);
  const limited = words.slice(0, 13).join(" ").trim();

  if (limited.length <= 108) return limited;
  return `${limited.slice(0, 105).trim()}…`;
}

function makeSnippet(lines: string[]) {
  return lines
    .slice(0, 3)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 360)
    .trim();
}

function makeSignals(tokens: string[]) {
  const seen = new Set<string>();
  const signals: string[] = [];

  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    signals.push(token);
    if (signals.length >= 5) break;
  }

  return signals;
}

function makeFingerprint(tokens: string[]) {
  const unique = Array.from(new Set(tokens));
  const strong = unique
    .filter((token) => token.length >= 4)
    .sort((a, b) => b.length - a.length || a.localeCompare(b))
    .slice(0, 8)
    .sort();

  return strong.join(" ");
}

export function tokenOverlapScore(a: string[], b: string[]) {
  const left = new Set(a);
  const right = new Set(b);
  let shared = 0;

  for (const item of left) {
    if (right.has(item)) shared += item.length >= 7 ? 1.35 : 1;
  }

  const minSize = Math.max(1, Math.min(left.size, right.size));
  return shared / minSize;
}

export function buildAttentionCandidates(
  text: string,
  blockedHandles: Set<string>,
): AttentionCandidate[] {
  const lines = splitUsefulLines(text, blockedHandles);
  if (!lines.length) return [];

  const scored = lines
    .map((line, index) => ({
      line,
      index,
      score: scoreLine(line, index, blockedHandles),
      tokens: extractSignalTokens(line, blockedHandles),
    }))
    .filter((item) => item.tokens.length >= 2)
    .sort((a, b) => b.score - a.score);

  const candidates: AttentionCandidate[] = [];

  for (const item of scored) {
    if (candidates.length >= 2) break;

    const title = titleFromLine(item.line);
    if (!title || title.length < 6) continue;

    const tokens = extractSignalTokens([item.line, ...lines.slice(0, 3)].join(" "), blockedHandles);
    const fingerprint = makeFingerprint(tokens);

    if (fingerprint.split(" ").length < 2) continue;

    const duplicate = candidates.some(
      (candidate) => tokenOverlapScore(candidate.tokens, tokens) >= 0.68,
    );

    if (duplicate) continue;

    candidates.push({
      title,
      snippet: makeSnippet(lines),
      tokens,
      signals: makeSignals(tokens),
      fingerprint,
    });
  }

  return candidates;
}
