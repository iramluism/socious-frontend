import { authFetch } from "../../shared/api/client";
import type { AuthUser, LoginResponse } from "./types";

/** Creates a user via ``POST /sign-up``. */
export function signUp(username: string, password: string): Promise<AuthUser> {
  return authFetch<AuthUser>("/sign-up", {
    method: "POST",
    body: { username, password },
  });
}

/** Authenticates via ``POST /login``. */
export function login(username: string, password: string): Promise<LoginResponse> {
  return authFetch<LoginResponse>("/login", {
    method: "POST",
    body: { username, password },
  });
}

/** Loads the current user via ``GET /me``. */
export function getMe(): Promise<AuthUser> {
  return authFetch<AuthUser>("/me");
}
