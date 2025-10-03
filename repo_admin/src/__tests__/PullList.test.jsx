import React from "react";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import "@testing-library/jest-dom";
import PullList from "../frontend/components/PullList/PullList";
import {invoke} from "@forge/bridge";

// mock forge bridge
jest.mock("@forge/bridge", () => ({
  invoke: jest.fn(),
}));

// mock window.alert to avoid side effects
global.alert = jest.fn();

describe("PullList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading state initially", async () => {
    invoke.mockResolvedValueOnce([]); // listPulls returns nothing
    render(<PullList owner="user" repo="repo"/>);
    expect(screen.getByText(/Loading PRs…/i)).toBeInTheDocument();
  });

  test("renders error state", async () => {
    invoke.mockRejectedValueOnce(new Error("Failed to fetch"));
    render(<PullList owner="user" repo="repo"/>);
    expect(await screen.findByText(/Failed to fetch/i)).toBeInTheDocument();
  });

  test("renders empty state when no PRs", async () => {
    invoke.mockResolvedValueOnce([]); // listPulls -> []
    render(<PullList owner="user" repo="repo"/>);
    expect(
      await screen.findByText(/No open pull requests linked to Jira issues/i)
    ).toBeInTheDocument();
  });

  test("renders PR with Jira issue", async () => {
    const prs = [
      {
        id: 1,
        number: 42,
        title: "Fix bug MDP-7",
        branch: "feature/bugfix",
        html_url: "http://github.com/user/repo/pull/42",
        user: "test-author",
        created_at: "2024-01-01T00:00:00Z",
        jiraKey: "MDP-7",
      },
    ];
    const issues = [
      {key: "MDP-7", summary: "Bug fix", status: "In Progress", assignee: "Alice"},
    ];

    invoke
      .mockResolvedValueOnce(prs)
      .mockResolvedValueOnce(issues);

    render(<PullList owner="user" repo="repo"/>);

    expect(await screen.findByText(/#42/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix bug MDP-7/i)).toBeInTheDocument();
    expect(screen.getByText(/📝 MDP-7: Bug fix/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Assignee: Alice/i)).toBeInTheDocument();
  });

  test("Approve button triggers approvePR and reloads", async () => {
    const prs = [
      {
        id: 2,
        number: 100,
        title: "Feature MDP-8",
        branch: "feature/new",
        html_url: "http://github.com/user/repo/pull/100",
        user: "bob",
        created_at: "2024-02-01T00:00:00Z",
        jiraKey: null,
      },
    ];

    invoke
      .mockResolvedValueOnce(prs)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ok: true})
      .mockResolvedValueOnce([]);

    render(<PullList owner="user" repo="repo"/>);

    const approveBtn = await screen.findByRole("button", {name: /Approve/i});
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("approvePR", {
        owner: "user",
        repo: "repo",
        number: 100,
      });
      expect(global.alert).toHaveBeenCalledWith("Successfully approved PR #100!");
    });
  });

});
