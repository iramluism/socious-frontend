import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AwsAuthLayout } from "./AwsAuthLayout";

/** Shows the authorization code returned to the SPA callback for copy/paste. */
export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const code = params.get("code") || "";
  const state = params.get("state") || "";
  const error = params.get("error_description") || params.get("error") || "";
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!code) {
      return;
    }
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  return (
    <AwsAuthLayout title="Authorization code">
      {error ? (
        <p className="aws-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      {code ? (
        <>
          <p className="aws-auth-hint">
            Copy this code and paste it into Postman, Cursor, or your MCP client
            to finish sign-in.
          </p>
          <pre className="aws-auth-code">{code}</pre>
          {state ? <p className="aws-auth-hint">state: {state}</p> : null}
          <button className="aws-auth-submit" type="button" onClick={copyCode}>
            {copied ? "Copied" : "Copy code"}
          </button>
        </>
      ) : error ? null : (
        <p className="aws-auth-error" role="alert">
          No authorization code was returned.
        </p>
      )}
    </AwsAuthLayout>
  );
}
