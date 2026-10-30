"use client";

import { useEffect, useRef } from "react";
import { IconLock, IconClose } from "./Icons";

const STEPS = [
  "Veriq opens a test connection with a 5 second timeout and rejects the credentials if it can't connect.",
  "The password is encrypted before it is stored, and the API never returns it.",
  "Veriq reads table and column names and types. It doesn't read your rows to build the schema.",
  "Each table's description is turned into an embedding, so a question can be matched to the right tables.",
  "Every query runs in a read-only transaction. Use a database user that only has SELECT access.",
];

export default function LockedConnect({ open, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="connect-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog__body">
        <div className="dialog__head">
          <h2 id="connect-title" className="dialog__title">
            <IconLock width={20} height={20} />
            Connect your own database
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <p className="dialog__lede">
          This build is locked to the sample database, so the form below is a preview of how
          connecting works.
        </p>

        <div className="dialog__form">
          <label className="field-label dialog__host" htmlFor="c-host">
            Host
            <input id="c-host" className="field" disabled placeholder="db.example.com" />
          </label>
          <label className="field-label dialog__port" htmlFor="c-port">
            Port
            <input id="c-port" className="field" disabled placeholder="5432" />
          </label>
          <label className="field-label dialog__full" htmlFor="c-db">
            Database name
            <input id="c-db" className="field" disabled placeholder="analytics" />
          </label>
          <label className="field-label" htmlFor="c-user">
            Username
            <input id="c-user" className="field" disabled placeholder="readonly_user" />
          </label>
          <label className="field-label" htmlFor="c-pass">
            Password
            <input id="c-pass" className="field" type="password" disabled placeholder="••••••••" />
          </label>
          <button type="button" className="btn btn--primary dialog__full" disabled>
            <IconLock width={14} height={14} />
            Test and connect
          </button>
        </div>

        <h3 className="side-title dialog__steps-title">What happens when you connect</h3>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}
