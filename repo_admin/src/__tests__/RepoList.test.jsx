import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RepoList from "../frontend/components/RepoList/RepoList";

// mock forge bridge
jest.mock("@forge/bridge", () => ({
  invoke: jest.fn(),
}));

import { invoke } from "@forge/bridge";

// mock PullList to avoid deep rendering
jest.mock("../frontend/components/PullList", () => () => <div>Mocked PullList</div>);

describe("RepoList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders 'No repositories found' when API returns empty", async () => {
    invoke.mockResolvedValueOnce({
      repos: [],
      page: 1,
      perPage: 5,
      hasPrev: false,
      hasNext: false,
    });

    render(<RepoList />);
    expect(await screen.findByText(/No repositories found/i)).toBeInTheDocument();
  });

  test("renders a repository and expands details on click", async () => {
    invoke.mockResolvedValueOnce({
      repos: [
        {
          id: 1,
          name: "test-repo",
          full_name: "user/test-repo",
          html_url: "http://github.com/user/test-repo",
          language: "JavaScript",
          stargazers_count: 5,
          forks_count: 2,
          open_issues_count: 1,
          permissions: { admin: true },
          description: "Test repo",
          clone_url: "http://github.com/user/test-repo.git",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          owner: "user",
        },
      ],
      page: 1,
      perPage: 5,
      hasPrev: false,
      hasNext: false,
    });

    render(<RepoList />);

    // repo shows up
    const repoButton = await screen.findByRole("button", { name: /▶ user\/test-repo/i });
    expect(repoButton).toBeInTheDocument();

    // expand
    fireEvent.click(repoButton);
    expect(await screen.findByText(/Language: JavaScript/i)).toBeInTheDocument();
    expect(screen.getByText(/Mocked PullList/i)).toBeInTheDocument();

    // collapse
    fireEvent.click(repoButton);
    await waitFor(() =>
      expect(screen.queryByText(/Language: JavaScript/i)).not.toBeInTheDocument()
    );
  });

  test("renders error message when invoke fails", async () => {
    invoke.mockRejectedValueOnce(new Error("API failed"));

    render(<RepoList />);
    expect(await screen.findByText(/API failed/i)).toBeInTheDocument();
  });

  test("calls next page when Next button clicked", async () => {
    invoke
      .mockResolvedValueOnce({
        repos: [],
        page: 1,
        perPage: 5,
        hasPrev: false,
        hasNext: true,
      })
      .mockResolvedValueOnce({
        repos: [],
        page: 2,
        perPage: 5,
        hasPrev: true,
        hasNext: false,
      });

    render(<RepoList />);

    const nextBtn = await screen.findByRole("button", { name: /Next/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(invoke).toHaveBeenLastCalledWith("listRepos", { page: 2, perPage: 5 });
    });
  });
});
