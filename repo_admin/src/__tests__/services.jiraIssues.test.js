import { extractJiraKey, fetchJiraIssue, transitionIssueToDone } from "../services/jiraIssues";
import { requestJira, route } from "@forge/api";


jest.mock("@forge/api", () => ({
  requestJira: jest.fn(),
  route: (strings, ...values) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] || ""), ""),
}));

describe("extractJiraKey", () => {
  test("returns null for empty string", () => {
    expect(extractJiraKey("")).toBeNull();
  });

  test("finds Jira key in text", () => {
    expect(extractJiraKey("Fixes bug in PROJ-123 feature")).toBe("PROJ-123");
  });

  test("returns first match if multiple keys exist", () => {
    expect(extractJiraKey("Refs PROJ-456 and ABC-789")).toBe("PROJ-456");
  });
});

describe("fetchJiraIssue", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns [] if no keys provided", async () => {
    const result = await fetchJiraIssue([]);
    expect(result).toEqual([]);
  });

  test("fetches issue details successfully", async () => {
    requestJira.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        key: "PROJ-123",
        fields: {
          summary: "Fix login bug",
          status: { name: "In Progress" },
          assignee: { displayName: "Andriy" },
        },
      }),
    });

    const result = await fetchJiraIssue(["PROJ-123"]);
    expect(result).toEqual([
      {
        key: "PROJ-123",
        summary: "Fix login bug",
        status: "In Progress",
        assignee: "Andriy",
      },
    ]);
    expect(requestJira).toHaveBeenCalledWith("/rest/api/3/issue/PROJ-123");
  });
});

describe("transitionIssueToDone", () => {
  beforeEach(() => jest.clearAllMocks());

  test("transitions issue when 'Done' is available", async () => {
    // 1st call: get transitions
    requestJira.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transitions: [{ id: "31", name: "Done" }],
      }),
    });

    // 2nd call: perform transition
    requestJira.mockResolvedValueOnce({
      ok: true,
      text: async () => "OK",
    });

    const result = await transitionIssueToDone("PROJ-123");
    expect(result).toEqual({ ok: true, issueKey: "PROJ-123" });
    expect(requestJira).toHaveBeenCalledWith(
      "/rest/api/3/issue/PROJ-123/transitions",
      expect.any(Object)
    );
  });

  test("fails when no Done transition exists", async () => {
    requestJira.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transitions: [{ id: "10", name: "In Progress" }],
      }),
    });

    const result = await transitionIssueToDone("PROJ-999");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No 'Done' transition/);
  });
});
