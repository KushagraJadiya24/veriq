"use client";

import { useState } from "react";
import { api } from "../lib/api";
import Logo from "./Logo";
import SqlViewer from "./SqlViewer";
import CheckList, { buildChecks } from "./CheckList";

const EXAMPLE_SQL = "SELECT COUNT(*) AS out_of_stock FROM products WHERE stock = 0 LIMIT 1000";

function friendly(err) {
  if (err.status === 401) return "Email or password is incorrect.";
  if (err.status === 422) return "Enter a valid email address and a password.";
  return err.message;
}

export default function LoginView({ onSignedIn, demoMode, notice }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await api("/auth/register", { method: "POST", json: { email, password } });
      }
      const data = await api("/auth/login", {
        method: "POST",
        form: { username: email, password },
      });
      await onSignedIn(data.access_token);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin() {
    setError("");
    setBusy(true);
    try {
      const data = await api("/auth/demo-login", { method: "POST" });
      await onSignedIn(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <section className="login__hero">
        <Logo light />
        <h1 className="login__headline">Ask in plain English. See exactly what ran.</h1>
        <p className="login__lede">
          Veriq writes the SQL, checks it, and runs it read-only against your database, so you
          can verify every answer.
        </p>
        <figure className="login__example">
          <p className="login__q">How many products are out of stock?</p>
          <SqlViewer sql={EXAMPLE_SQL} copyable={false} />
          <CheckList checks={buildChecks(null)} />
          <figcaption>Example answer from the sample database.</figcaption>
        </figure>
      </section>

      <section className="login__panel">
        <form className="login__form" onSubmit={submit}>
          <h2 className="login__title">
            {mode === "login" ? "Sign in" : "Create your account"}
          </h2>
          {notice && <p className="notice">{notice}</p>}

          <label className="field-label" htmlFor="email">
            Email
            <input
              id="email"
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field-label" htmlFor="password">
            Password
            <input
              id="password"
              className="field"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Please wait" : mode === "login" ? "Sign in" : "Create account"}
          </button>

          {demoMode && (
            <button type="button" className="btn btn--ghost" onClick={demoLogin} disabled={busy}>
              Try the demo account
            </button>
          )}

          {!demoMode && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setError("");
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Create an account" : "I already have an account"}
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
