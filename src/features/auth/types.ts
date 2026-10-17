/** Public identity returned by auth endpoints. */
export interface AuthUser {
  id: string;
  username: string;
  created_at: string;
}

/** Login payload including JWT. */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
