import Resolver from '@forge/resolver';
import {clearToken, getAuthStatus, saveToken, validateToken} from "../services/github";


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

export const handler = resolver.getDefinitions();
