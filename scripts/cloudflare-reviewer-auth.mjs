import { authenticatePublisher } from './cloudflare-access-auth.mjs';
// Reuse the same cryptographic Cloudflare Access JWT verification, but with a
// distinct teacher allowlist. A publisher allowlist never grants teacher rights.
export async function authenticateReviewer(request, env, fetcher = fetch, now = () => Date.now()) {
  if (typeof env.REVIEWER_EMAILS !== 'string' || !env.REVIEWER_EMAILS.trim()) return null;
  const principal = await authenticatePublisher(request, {
    ...env, PUBLISHER_EMAILS: env.REVIEWER_EMAILS,
  }, fetcher, now);
  return principal ? { ...principal, role: 'reviewer' } : null;
}
