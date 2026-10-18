import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OAuthAuthorizePage } from "../src/features/auth/OAuthAuthorizePage";
import { OAuthCallbackPage } from "../src/features/auth/OAuthCallbackPage";

function renderPath(path: string, element: ReactElement, route: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OAuthAuthorizePage", () => {
  it("renders a form posting OAuth params as hidden fields", () => {
    const query =
      "/oauth/authorize?response_type=code&client_id=socius-public" +
      "&redirect_uri=http://127.0.0.1:5173/oauth/callback" +
      "&code_challenge=abc&code_challenge_method=S256&state=st1";
    renderPath(query, <OAuthAuthorizePage />, "/oauth/authorize");
    const form = document.querySelector("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/oauth/authorize");
    expect(
      document.querySelector('input[name="client_id"]'),
    ).toHaveValue("socius-public");
    expect(
      document.querySelector('input[name="redirect_uri"]'),
    ).toHaveValue("http://127.0.0.1:5173/oauth/callback");
    expect(document.querySelector('input[name="username"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("shows error_description from the query string", () => {
    renderPath(
      "/oauth/authorize?client_id=c&redirect_uri=https://x&code_challenge=y&error=access_denied&error_description=Invalid%20credentials",
      <OAuthAuthorizePage />,
      "/oauth/authorize",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});

describe("OAuthCallbackPage", () => {
  it("shows the authorization code from the query string", () => {
    renderPath(
      "/oauth/callback?code=the-auth-code&state=s1",
      <OAuthCallbackPage />,
      "/oauth/callback",
    );
    expect(screen.getByText("the-auth-code")).toBeInTheDocument();
    expect(screen.getByText("state: s1")).toBeInTheDocument();
  });

  it("copies the code to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderPath(
      "/oauth/callback?code=copy-me",
      <OAuthCallbackPage />,
      "/oauth/callback",
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("copy-me");
      expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });
  });

  it("shows an OAuth error when no code is present", () => {
    renderPath(
      "/oauth/callback?error=access_denied&error_description=denied",
      <OAuthCallbackPage />,
      "/oauth/callback",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("denied");
    expect(screen.queryByRole("button", { name: "Copy code" })).toBeNull();
  });
});
