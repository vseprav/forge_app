import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../frontend/index"; // adjust path if needed

// mock forge bridge
jest.mock("@forge/bridge", () => ({
  invoke: jest.fn(),
}));

import { invoke } from "@forge/bridge";

describe("App Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state initially", async () => {
    invoke.mockResolvedValueOnce({ hasToken: false, login: null });
    render(<App />);
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  test("renders GitHubAuthForm when no token", async () => {
    invoke.mockResolvedValueOnce({ hasToken: false, login: null });
    render(<App />);
    const authText = await screen.findByText(/GitHub PR Bridge/i);
    expect(authText).toBeInTheDocument();
  });

  test("renders RepoList when token exists", async () => {
    invoke.mockResolvedValueOnce({ hasToken: true, login: "test-user" });
    render(<App />);
    const tokenSaved = await screen.findByText(/Token is saved/i);
    expect(tokenSaved).toBeInTheDocument();
  });

  test("clearToken button triggers invoke", async () => {
    invoke
      .mockResolvedValueOnce({ hasToken: true, login: "test-user" }) // initial load
      .mockResolvedValueOnce({}); // clear token
    render(<App />);
    const clearBtn = await screen.findByRole("button", { name: /Clear token/i });
    fireEvent.click(clearBtn);
    expect(invoke).toHaveBeenCalledWith("clearToken");
  });
});
