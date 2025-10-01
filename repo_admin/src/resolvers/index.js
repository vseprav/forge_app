import Resolver from '@forge/resolver';

const {storage, fetch} = require('@forge/api');

const resolver = new Resolver();

const tokenKey = (accountId) => `gh-token:${accountId}`;
const loginKey = (accountId) => `gh-login:${accountId}`;

resolver.define('validateAndSaveToken', async ({ payload, context }) => {
  const raw = (payload?.token || '').trim();
  if (!raw) throw new Error('Token is required');

  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${raw}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub auth failed: ${res.status} ${text}`);
  }
  const me = await res.json();

  await storage.setSecret(tokenKey(context.accountId), raw);
  await storage.set(loginKey(context.accountId), me.login);

  return { login: me.login };
});

resolver.define('getAuthStatus', async ({context}) => {
  const token = await storage.getSecret(tokenKey(context.accountId));
  if (!token) return {hasToken: false};
  const login = await storage.get(loginKey(context.accountId));
  return {hasToken: true, login: login || null};
});

resolver.define('clearToken', async ({context}) => {
  await storage.deleteSecret(tokenKey(context.accountId));
  await storage.delete(loginKey(context.accountId));
  return {ok: true};
});

export const handler = resolver.getDefinitions();
