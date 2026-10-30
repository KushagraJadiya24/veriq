import { IconCheck, IconAlert } from "./Icons";

// These checks are enforced by the backend on every query it runs.
// The last item reflects the answer check: flagged or not.
export function buildChecks(warning) {
  const checks = [
    {
      label: "Only a SELECT statement",
      detail: "Anything that changes data is rejected before it reaches the database.",
    },
    {
      label: "No sensitive columns",
      detail: "Passwords, tokens and secrets can't be selected.",
    },
    {
      label: "Row limit applied",
      detail: "Results are capped so a query can't return an unbounded table.",
    },
    {
      label: "Ran in a read-only transaction",
      detail: "The database itself refuses writes.",
    },
  ];
  if (warning) {
    checks.push({
      label: "Flagged for review",
      detail: "See the note above the results.",
      warn: true,
    });
  } else {
    checks.push({
      label: "No concerns flagged",
      detail: "The answer check found nothing suspicious in how the question was answered.",
    });
  }
  return checks;
}

export default function CheckList({ checks }) {
  return (
    <ul className="checks" aria-label="Checks that ran">
      {checks.map((c, i) => (
        <li
          key={c.label}
          className={`checks__item${c.warn ? " checks__item--warn" : ""}`}
          style={{ "--i": i }}
          title={c.detail}
        >
          <span className="checks__icon">
            {c.warn ? <IconAlert width={13} height={13} /> : <IconCheck width={13} height={13} />}
          </span>
          <span className="checks__label">{c.label}</span>
        </li>
      ))}
    </ul>
  );
}
