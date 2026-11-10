const decoder = new TextDecoder();
function base64url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid token');
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
  return bytes;
}
function jsonPart(part) { return JSON.parse(decoder.decode(base64url(part))); }
function config(env) {
  if (!/^https:\/\/[a-zA-Z0-9.-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN || '')
    || !env.ACCESS_AUD || !env.PUBLISHER_EMAILS) throw new Error('Cloudflare Access configuration missing');
}
export async function authenticatePublisher(request, env, fetcher = fetch, now = () => Date.now()) {
  config(env);
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 8192) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = jsonPart(parts[0]);
    const claims = jsonPart(parts[1]);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
    const issuer = env.ACCESS_TEAM_DOMAIN.replace(/\/$/, '');
    const time = Math.floor(now() / 1000);
    if (claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD)
      || typeof claims.exp !== 'number' || claims.exp <= time
      || typeof claims.iat !== 'number' || claims.iat > time + 60
      || (claims.nbf !== undefined && claims.nbf > time)
      || typeof claims.sub !== 'string' || !claims.sub
      || typeof claims.email !== 'string') return null;
    const allowed = env.PUBLISHER_EMAILS.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(claims.email.toLowerCase())) return null;
    const response = await fetcher(issuer + '/cdn-cgi/access/certs', { redirect: 'error' });
    if (!response.ok) return null;
    const jwks = await response.json();
    const jwk = jwks.keys?.find((x) => x.kid === header.kid && x.kty === 'RSA' && (!x.alg || x.alg === 'RS256'));
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64url(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
    return valid ? { id: claims.sub, email: claims.email.toLowerCase(), role: 'publisher' } : null;
  } catch { return null; }
}
