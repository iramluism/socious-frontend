/** Public identity returned by auth endpoints. */
export interface AuthUser {
  id: string;
  username: string;
  created_at: string;
}

/** Login or refresh payload including Socius access and refresh tokens. */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}
