type SociousMarkProps = {
  className?: string;
  title?: string;
};

/** Socious brand mark: two partners sharing a continuous shoulder line (transparent). */
export function SociousMark({
  className,
  title = "Socious",
}: SociousMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 1280 1280"
      width="64"
      height="64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="434" cy="473" r="110" />
        <circle cx="818" cy="473" r="110" />
        <path d="M191 846 C180 734 231 645 331 611 C425 578 495 627 622 628 C749 629 808 578 911 608 C1018 639 1068 733 1058 846 C1056 874 1042 892 1017 892 C991 892 977 874 977 850 C982 771 954 716 894 695 C824 669 747 718 623 718 C501 718 428 670 358 694 C297 715 268 770 272 850 C274 874 258 892 233 892 C208 892 192 874 191 846 Z" />
      </g>
    </svg>
  );
}
