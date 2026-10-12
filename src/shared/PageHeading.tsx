import type { ReactNode } from "react";
/** Displays a page title, description and optional primary action. */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">ESPACIO PERSONAL / MEMO</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      {action}
    </header>
  );
}
/** Formats a demo timestamp using the user's Spanish locale. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
