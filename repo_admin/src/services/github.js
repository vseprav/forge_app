import {fetch, storage} from '@forge/api';

const tokenKey = (accountId) => `gh-token:${accountId}`;
const loginKey = (accountId) => `gh-login:${accountId}`;

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

export const getGithubRepos = async (token, page = 1, perPage = 10) => {
  const res = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
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
    permissions: {
      admin: r.permissions?.admin,
      push: r.permissions?.push,
    },
  }));
}
