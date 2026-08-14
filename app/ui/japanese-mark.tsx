type MarkProps = {
  className?: string;
};

export function ToriiMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M10 15c11 2 33 2 44 0" />
      <path d="M7 10c14 3 36 3 50 0" />
      <path d="M15 21h34" />
      <path d="M20 21 17 53M44 21l3 32" />
      <path d="M13 53h38" />
      <path d="M24 24h16" />
    </svg>
  );
}

