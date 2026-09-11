type CachedFile = {
  headers: string[];
  rows: string[][];
  filename: string;
  timestamp: number;
};

const cache = new Map<string, CachedFile>();

const CLEANUP_MS = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of cache) {
    if (now - val.timestamp > CLEANUP_MS) cache.delete(key);
  }
}, 60_000);

export function storeFile(headers: string[], rows: string[][], filename: string): string {
  const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  cache.set(token, { headers, rows, filename, timestamp: Date.now() });
  return token;
}

export function getFile(token: string): CachedFile | null {
  return cache.get(token) ?? null;
}

export function deleteFile(token: string): void {
  cache.delete(token);
}
