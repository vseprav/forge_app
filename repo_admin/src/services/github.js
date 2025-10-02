import {fetch, storage} from '@forge/api';

const tokenKey = (accountId) => `gh-token:${accountId}`;
const loginKey = (accountId) => `gh-login:${accountId}`;

function extractJiraKey(text) {
  if (!text) return null;
  const match = text.match(/\b[A-Z][A-Z0-9]+-\d+\b/);
  return match ? match[0] : null;
}

export const validateToken = async (token) => {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub auth failed: ${res.status} ${text}`);
  }

  return (await res.json());
};

export const saveToken = async (token, accountId, userLogin) => {
  await storage.setSecret(tokenKey(accountId), token);
  await storage.set(loginKey(accountId), userLogin);
};

export const clearToken = async (accountId) => {
  await storage.deleteSecret(tokenKey(accountId));
  await storage.delete(loginKey(accountId));
  return {ok: true};
}

export const getAuthStatus = async (accountId) => {
  const token = await storage.getSecret(tokenKey(accountId));
  if (!token) {
    return {hasToken: false, login: null};
  }

  const login = (await storage.get(loginKey(accountId)));
  return {hasToken: true, login: login ?? null};
}

export const getGithubToken = async (accountId) => {
  return storage.getSecret(tokenKey(accountId));
}

const getGithubHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

export const getGithubRepos = async (
  token,
  page = 1,
  perPage = 10,
  sort = 'updated',
  direction = 'desc',
) => {
  const res = await fetch(
    `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=${sort}&direction=${direction}`,
    {
      headers: getGithubHeaders(token)
    });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API failed: ${res.status} ${text}`);
  }

  const repos = await res.json();
  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    owner: r.owner?.login,
    html_url: r.html_url,
    language: r.language,
    visibility: r.visibility,
    default_branch: r.default_branch,
    pushed_at: r.pushed_at,
    open_issues_count: r.open_issues_count,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    clone_url: r.clone_url,
    created_at: r.created_at,
    updated_at: r.updated_at,
    permissions: {
      admin: r.permissions?.admin,
      push: r.permissions?.push,
    },
  }));
}

export const getRepoPulls = async (token, owner, repo, state) => {
  if (!token) throw new Error('GitHub token missing');

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`,
    {
      headers: getGithubHeaders(token)
    });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API failed: ${res.status} ${text}`);
  }
  const data = await res.json();

  return data.map((pr) => {
    const jiraKey = extractJiraKey(pr.title) || extractJiraKey(pr.head?.ref);
    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      branch: pr.head?.ref,
      html_url: pr.html_url,
      user: pr.user?.login,
      created_at: pr.created_at,
      jiraKey,
    };
  })
    .filter((pr) => !!pr.jiraKey);
}
