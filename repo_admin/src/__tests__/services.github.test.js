import {
  validateToken,
  saveToken,
  clearToken,
  getAuthStatus,
  getGithubRepos,
  getRepoPulls,
  approvePullRequest,
  mergePullRequest,
} from "../services/github";

// mock @forge/api
jest.mock("@forge/api", () => ({
  fetch: jest.fn(),
  storage: {
    setSecret: jest.fn(),
    set: jest.fn(),
    deleteSecret: jest.fn(),
    delete: jest.fn(),
    getSecret: jest.fn(),
    get: jest.fn(),
  },
}));

import { fetch, storage } from "@forge/api";

// helper to create mock fetch responses
const mockFetch = (ok, jsonData, status = 200) => {
  fetch.mockResolvedValueOnce({
    ok,
    status,
    json: jest.fn().mockResolvedValue(jsonData),
    text: jest.fn().mockResolvedValue(JSON.stringify(jsonData)),
  });
};

describe("GitHub Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validateToken succeeds", async () => {
    const fakeUser = { login: "test-user" };
    mockFetch(true, fakeUser);

    const res = await validateToken("fake-token");
    expect(fetch).toHaveBeenCalledWith("https://api.github.com/user", expect.any(Object));
    expect(res.login).toBe("test-user");
  });

  test("validateToken fails", async () => {
    mockFetch(false, { message: "Bad creds" }, 401);
    await expect(validateToken("bad-token")).rejects.toThrow("GitHub auth failed: 401");
  });

  test("saveToken stores token and login", async () => {
    await saveToken("fake-token", "acc-1", "gh-login");
    expect(storage.setSecret).toHaveBeenCalled();
    expect(storage.set).toHaveBeenCalled();
  });

  test("clearToken deletes token and login", async () => {
    await clearToken("acc-1");
    expect(storage.deleteSecret).toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalled();
  });

  test("getAuthStatus returns no token", async () => {
    storage.getSecret.mockResolvedValueOnce(null);
    const res = await getAuthStatus("acc-1");
    expect(res).toEqual({ hasToken: false, login: null });
  });

  test("getAuthStatus returns token + login", async () => {
    storage.getSecret.mockResolvedValueOnce("fake-token");
    storage.get.mockResolvedValueOnce("gh-login");
    const res = await getAuthStatus("acc-1");
    expect(res).toEqual({ hasToken: true, login: "gh-login" });
  });

  test("getGithubRepos parses repos", async () => {
    const fakeRepo = { id: 1, name: "repo1", full_name: "u/repo1", owner: { login: "u" } };
    mockFetch(true, [fakeRepo]);

    const repos = await getGithubRepos("fake-token");
    expect(repos[0].name).toBe("repo1");
  });

  test("getRepoPulls filters by Jira key", async () => {
    const fakePR = { id: 123, number: 1, title: "ABC-123 Fix bug", head: { ref: "branch" }, user: { login: "u" } };
    mockFetch(true, [fakePR]);

    const pulls = await getRepoPulls("fake-token", "owner", "repo", "open");
    expect(pulls[0].jiraKey).toBe("ABC-123");
  });

  test("approvePullRequest works", async () => {
    mockFetch(true, { id: "review-1" });

    const body = await approvePullRequest("token", "o", "r", 1);
    expect(body.id).toBe("review-1");
  });

  test("mergePullRequest works", async () => {
    mockFetch(true, { merged: true });

    const body = await mergePullRequest("token", "o", "r", 1);
    expect(body.merged).toBe(true);
  });
});
