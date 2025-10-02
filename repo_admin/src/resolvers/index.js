import Resolver from '@forge/resolver';
import {clearToken, getAuthStatus, getGithubRepos, getGithubToken, saveToken, validateToken} from "../services/github";


const resolver = new Resolver();

resolver.define('validateAndSaveToken', async ({payload, context}) => {
  const token = (payload?.token || '').trim();
  if (!token) throw new Error('Token is required');

  const user = await validateToken(token);
  await saveToken(token, context.accountId, user.login);

  return {login: user.login};
});

resolver.define('getAuthStatus', async ({context}) => {
  return getAuthStatus(context.accountId);
});

resolver.define('clearToken', async ({context}) => {
  return clearToken(context.accountId);
});

resolver.define('listRepos', async ({ context }) => {
  const token = await getGithubToken(context.accountId);
  const repos = await getGithubRepos(token);

  return repos.map(r => {
    return {
      name: r.name,
      full_name: r.full_name,
      language: r.language,
    }
  });
});

export const handler = resolver.getDefinitions();
