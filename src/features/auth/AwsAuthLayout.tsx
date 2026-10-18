import type { ReactNode } from "react";
import { SociousMark } from "../../shared/brand/SociousMark";

/** Full-page AWS-style sign-in chrome (navy header + light card). */
export function AwsAuthLayout({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="aws-auth">
      <header className="aws-auth-header">
        <span className="aws-auth-brand" aria-label="Socious">
          <SociousMark className="aws-auth-brand-mark" />
        </span>
      </header>
      <main className="aws-auth-main">
        <section className="aws-auth-card">
          <h1>{title}</h1>
          {children}
        </section>
        {footer}
      </main>
    </div>
  );
}
