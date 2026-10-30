"use client";

import Logo from "./Logo";
import {
  IconClose,
  IconChevron,
  IconDatabase,
  IconLock,
  IconLogout,
} from "./Icons";
import { isSensitiveColumn, relativeTime } from "../lib/format";

const DOT_LABEL = {
  ready: "Connected",
  empty: "Connected",
  loading: "Checking connection",
  error: "Not connected",
};

export default function Rail({
  open,
  onClose,
  email,
  onLogout,
  dbLabel,
  schema,
  schemaState,
  schemaMessage,
  history,
  historyAvailable,
  onPickHistory,
  onOpenConnect,
}) {
  const tables = schema ? Object.entries(schema) : [];

  return (
    <aside className={`rail${open ? " rail--open" : ""}`} aria-label="Workspace">
      <div className="rail__top">
        <Logo light />
        <button
          type="button"
          className="icon-btn rail__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <IconClose />
        </button>
      </div>

      <div className="rail__scroll">
        <section className="rail__section" aria-labelledby="rail-db">
          <h2 id="rail-db" className="rail__title">
            Database
          </h2>
          <div className="dbrow">
            <IconDatabase />
            <span className="dbrow__name">{dbLabel}</span>
            <span
              className={`dot dot--${schemaState}`}
              role="img"
              aria-label={DOT_LABEL[schemaState] || "Unknown"}
            />
          </div>
          <button type="button" className="rail__lockbtn" onClick={onOpenConnect}>
            <IconLock width={14} height={14} />
            <span>Connect your own database</span>
          </button>
        </section>

        <section className="rail__section" aria-labelledby="rail-tables">
          <h2 id="rail-tables" className="rail__title">
            Tables
          </h2>
          {schemaState === "loading" && <p className="rail__note">Reading the schema…</p>}
          {(schemaState === "error" || schemaState === "empty") && (
            <p className="rail__note">{schemaMessage}</p>
          )}
          {schemaState === "ready" && (
            <ul className="tables">
              {tables.map(([name, cols]) => (
                <li key={name}>
                  <details className="tbl">
                    <summary>
                      <IconChevron className="chev" width={14} height={14} />
                      <span className="tbl__name">{name}</span>
                      <span className="tbl__count" title={`${cols.length} columns`}>
                        {cols.length}
                      </span>
                    </summary>
                    <ul className="cols">
                      {cols.map((c) => {
                        const locked = isSensitiveColumn(c.name);
                        return (
                          <li
                            key={c.name}
                            className={`cols__item${locked ? " cols__item--locked" : ""}`}
                            title={locked ? "Guardrails block this column" : undefined}
                          >
                            <span className="cols__name">
                              {locked && <IconLock width={11} height={11} />}
                              {c.name}
                            </span>
                            <span className="cols__type">{c.type}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>

        {historyAvailable && (
          <section className="rail__section" aria-labelledby="rail-history">
            <h2 id="rail-history" className="rail__title">
              Recent questions
            </h2>
            {history.length === 0 ? (
              <p className="rail__note">Questions you ask will show up here.</p>
            ) : (
              <ul className="history">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="history__item"
                      onClick={() => onPickHistory(h.question)}
                      title={h.sql || undefined}
                    >
                      <span className="history__q">{h.question}</span>
                      <span className="history__meta">
                        <span>{relativeTime(h.created_at)}</span>
                        {h.blocked && <span className="history__blocked">Blocked</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <div className="rail__bottom">
        <span className="rail__email" title={email}>
          {email}
        </span>
        <button type="button" className="rail__signout" onClick={() => onLogout()}>
          <IconLogout width={14} height={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
