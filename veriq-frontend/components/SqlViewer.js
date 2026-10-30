"use client";

import { useState } from "react";
import { formatSql } from "../lib/format";
import { IconCopy, IconCheck } from "./Icons";

const KEYWORDS = new Set(
  (
    "SELECT FROM WHERE GROUP BY ORDER HAVING LIMIT OFFSET JOIN LEFT RIGHT INNER OUTER FULL CROSS ON AS " +
    "AND OR NOT IN IS NULL LIKE ILIKE BETWEEN DISTINCT COUNT SUM AVG MIN MAX CASE WHEN THEN ELSE END " +
    "ASC DESC UNION ALL EXISTS WITH OVER PARTITION CAST DATE INTERVAL"
  ).split(" ")
);

function tokenize(sql) {
  const re = /('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;
  const out = [];
  let m;
  let i = 0;
  while ((m = re.exec(sql))) {
    if (m[1]) out.push(<span key={i++} className="tok-str">{m[1]}</span>);
    else if (m[2]) out.push(<span key={i++} className="tok-num">{m[2]}</span>);
    else if (m[3] && KEYWORDS.has(m[3].toUpperCase()))
      out.push(<span key={i++} className="tok-kw">{m[3]}</span>);
    else out.push(m[0]);
  }
  return out;
}

export default function SqlViewer({ sql, copyable = true }) {
  const [copied, setCopied] = useState(false);
  const pretty = formatSql(sql);

  async function copy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="sql">
      {copyable && (
        <div className="sql__bar">
          <button type="button" className="sql__copy" onClick={copy}>
            {copied ? <IconCheck width={13} height={13} /> : <IconCopy width={13} height={13} />}
            <span>{copied ? "Copied" : "Copy SQL"}</span>
          </button>
        </div>
      )}
      <pre className="sql__code">
        <code>{tokenize(pretty)}</code>
      </pre>
    </div>
  );
}
