import { useSearchParams } from "react-router-dom";
import { AwsAuthLayout } from "./AwsAuthLayout";

const OAUTH_FIELDS = [
  "response_type",
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "state",
  "scope",
] as const;

function authorizeAction(): string {
  const fromEnv = import.meta.env.VITE_OAUTH_AUTHORIZE_ACTION;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return "/oauth/authorize";
}

/** OAuth login owned by the SPA; posts credentials to the Authorization Server. */
export function OAuthAuthorizePage() {
  const [params] = useSearchParams();
  const oauthError = params.get("error_description") || params.get("error") || "";
  const clientId = params.get("client_id") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const challenge = params.get("code_challenge") || "";

  const missing = !clientId || !redirectUri || !challenge;

  return (
    <AwsAuthLayout title="Sign in to continue">
      {oauthError ? (
        <p className="aws-auth-error" role="alert">
          {oauthError}
        </p>
      ) : null}
      {missing ? (
        <p className="aws-auth-error" role="alert">
          This sign-in link is incomplete. Start authorization from the client
          again.
        </p>
      ) : (
        <form
          method="post"
          action={authorizeAction()}
          className="aws-auth-form"
        >
          {OAUTH_FIELDS.map((name) => (
            <input
              key={name}
              type="hidden"
              name={name}
              value={params.get(name) || ""}
            />
          ))}
          <label>
            Username
            <input name="username" autoComplete="username" autoFocus required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="aws-auth-submit" type="submit">
            Sign in
          </button>
        </form>
      )}
    </AwsAuthLayout>
  );
}
