import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, generateKeyPairSync, sign } from 'node:crypto';
import { authenticatePublisher } from '../scripts/cloudflare-access-auth.mjs';
import worker from '../scripts/cloudflare-publication-worker.mjs';
globalThis.crypto ??= webcrypto;
const env = { ACCESS_TEAM_DOMAIN: 'https://sample.cloudflareaccess.com', ACCESS_AUD: 'audience',
  PUBLISHER_EMAILS: 'teacher@example.org' };
const encode = (x) => Buffer.from(JSON.stringify(x)).toString('base64url');
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'key1', alg: 'RS256' };
const now = 1783730000;
function token(changes = {}) {
  const payload = { iss: env.ACCESS_TEAM_DOMAIN, aud: ['audience'], exp: now + 600,
    iat: now - 30, sub: 'user-id', email: 'teacher@example.org', ...changes };
  const signingInput = encode({ alg: 'RS256', kid: 'key1' }) + '.' + encode(payload);
  return signingInput + '.' + sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');
}
const fetcher = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
test('Cloudflare Access RS256 驗簽與權限白名單', async () => {
  const req = (t) => new Request('https://example.org', { headers: { 'Cf-Access-Jwt-Assertion': t } });
  assert.equal((await authenticatePublisher(req(token()), env, fetcher, () => now * 1000)).id, 'user-id');
  assert.equal(await authenticatePublisher(req(token({ email: 'other@example.org' })), env, fetcher, () => now * 1000), null);
  assert.equal(await authenticatePublisher(req(token({ exp: now - 1 })), env, fetcher, () => now * 1000), null);
  assert.equal(await authenticatePublisher(req(token({ aud: ['wrong'] })), env, fetcher, () => now * 1000), null);
  assert.equal(await authenticatePublisher(req(token({ iss: 'https://evil.example' })), env, fetcher, () => now * 1000), null);
  const original = token();
  const tampered = original.slice(0, -2) + (original.at(-2) === 'A' ? 'B' : 'A') + original.at(-1);
  assert.equal(await authenticatePublisher(req(tampered), env, fetcher, () => now * 1000), null);
});
test('未配置資料庫 fail closed', async () => {
  const response = await worker.fetch(new Request('https://example.org/api/questions/publish', { method: 'POST' }), {});
  assert.equal(response.status, 503);
});
test('未認證拒絕發布且不觸碰 D1', async () => {
  const response = await worker.fetch(new Request('https://example.org/api/questions/publish', { method: 'POST' }),
    { ...env, PUBLICATION_DB: {} });
  assert.equal(response.status, 401);
});
