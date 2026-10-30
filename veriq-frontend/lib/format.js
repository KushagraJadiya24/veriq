// Mirrors the backend's sensitive-column patterns so the schema list can
// show which columns the guardrails will refuse to select.
export const SENSITIVE_PATTERNS = ["password", "secret", "token", "encrypted_"];

export function isSensitiveColumn(name) {
  const n = String(name).toLowerCase();
  return SENSITIVE_PATTERNS.some((p) => n.includes(p));
}

export function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

const BREAK_BEFORE =
  /\s+(LEFT JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|CROSS JOIN|JOIN|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT)\b/gi;

// Display-only formatting: one clause per line.
export function formatSql(sql) {
  return String(sql || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(BREAK_BEFORE, "\n$1");
}
