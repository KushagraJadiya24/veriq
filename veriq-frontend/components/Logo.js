export default function Logo({ light = false }) {
  return (
    <span className={`logo${light ? " logo--light" : ""}`}>
      <svg
        className="logo__mark"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.16" />
        <path
          d="M6 12.5l4 4 8-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo__word">Veriq</span>
    </span>
  );
}
