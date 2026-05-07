export function TonIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="28" cy="28" r="28" fill="#2196F3" />
      <path
        d="M38.5 17.5H17.5L28 41L38.5 17.5Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 17.5L28 24L38.5 17.5"
        stroke="#2196F3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TonBadge({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="28" cy="28" r="28" fill="#2196F3" />
      <path
        d="M38.5 17.5H17.5L28 41L38.5 17.5Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 17.5L28 24L38.5 17.5"
        stroke="#2196F3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
