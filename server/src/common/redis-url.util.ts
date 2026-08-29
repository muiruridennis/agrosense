export function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    // rediss:// (external Render connections) needs TLS; redis:// (internal, same-region) doesn't
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}