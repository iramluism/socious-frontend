import type { ConnectionKind } from "./types";

/** Compact product-style glyph for a data-source kind in the picker grid. */
export function KindIcon({
  kind,
  size = 28,
}: {
  kind: ConnectionKind;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: "false",
  } as const;

  switch (kind) {
    case "google_gmail":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="4" fill="#EA4335" />
          <path
            fill="#fff"
            d="M5 8.2v7.6c0 .5.4.9.9.9h2.1V12L6 10.2 5 8.2zm14 0-1 2.2-1.9 1.8V16.7h2.1c.5 0 .9-.4.9-.9V8.2zM12 11.4 6.4 7.5h11.2L12 11.4z"
          />
        </svg>
      );
    case "google_drive":
      return (
        <svg {...common}>
          <path fill="#0F9D58" d="M8.2 4 2 14.5h6.2L14.4 4H8.2z" />
          <path fill="#4285F4" d="M16 4H9.8l6.2 10.5H22L16 4z" />
          <path fill="#FFBA00" d="M2 14.5 8.2 24h6.2L8.2 14.5H2z" />
        </svg>
      );
    case "google_meet":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="4" fill="#00897B" />
          <path
            fill="#fff"
            d="M8 8h6.5c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H8V8zm8.5 0 3.5 2.5V15L16.5 17.5V8z"
          />
        </svg>
      );
    case "google_play":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="4" fill="#01875F" />
          <path fill="#fff" d="m10 7.5 7 4.5-7 4.5V7.5z" />
        </svg>
      );
    case "fts":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="4" fill="#5b7699" />
          <path
            fill="#fff"
            d="M7 8h10v2H7V8zm0 4h7v2H7v-2zm0 4h10v2H7v-2z"
          />
        </svg>
      );
    default:
      return null;
  }
}
