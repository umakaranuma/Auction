/** In-memory cache of remote/original src → cutout data URL (session only). */
const cutoutByKey = new Map<string, string>();

function cacheKey(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `inline:${src.length}:${hashString(src)}`;
}

function hashString(s: string): string {
  let h = 5381;
  const step = Math.max(1, Math.floor(s.length / 2000));
  for (let i = 0; i < s.length; i += step) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function getCachedPlayerCutout(src: string): string | undefined {
  return cutoutByKey.get(cacheKey(src));
}

export function setCachedPlayerCutout(src: string, dataUrl: string): void {
  cutoutByKey.set(cacheKey(src), dataUrl);
}
