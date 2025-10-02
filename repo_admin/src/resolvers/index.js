import Resolver from '@forge/resolver';
import {
  approvePullRequest,
  clearToken,
  getAuthStatus,
  getGithubRepos,
  getGithubToken,
  getRepoPulls, mergePullRequest,
  saveToken,
  validateToken
} from "../services/github";
import {fetchJiraIssue} from "../services/jiraIssues";

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

resolver.define('listRepos', async ({ payload , context }) => {
  const page = payload?.page ?? 1;
  const perPage = payload?.perPage ?? 10;

  const token = await getGithubToken(context.accountId);
  const repos = await getGithubRepos(token, page, perPage);

  const hasNext = repos.length === perPage;
  const hasPrev = page > 1;

  return { repos, page, perPage, hasPrev, hasNext };
});

resolver.define('listPulls', async ({ payload, context }) => {
  const { owner, repo, state = 'open' } = payload;
  const token = await getGithubToken(context.accountId);
  return getRepoPulls(token, owner, repo, state);
});

resolver.define('getIssues', async ({ payload }) => {
  const { keys} = payload;
  return fetchJiraIssue(keys)
});


resolver.define('approvePR', async ({ payload, context }) => {
  const { owner, repo, number } = payload;
  const token = await getGithubToken(context.accountId);
  return approvePullRequest(token, owner, repo, number);
});

resolver.define('mergePR', async ({ payload, context }) => {
  const { owner, repo, number, issueKey } = payload;
  const token = await getGithubToken(context.accountId);

  return mergePullRequest(token, owner, repo, number);
});

export const handler = resolver.getDefinitions();
