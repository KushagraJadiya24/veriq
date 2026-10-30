"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import Logo from "../components/Logo";
import LoginView from "../components/LoginView";
import Dashboard from "../components/Dashboard";

const TOKEN_KEY = "veriq_token";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  const logout = useCallback((message) => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(null);
    setEmail("");
    setNotice(typeof message === "string" ? message : "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await api("/health");
        if (!cancelled) setDemoMode(Boolean(health?.demo_mode));
      } catch {}

      let saved = null;
      try {
        saved = localStorage.getItem(TOKEN_KEY);
      } catch {}

      if (saved) {
        try {
          const me = await api("/auth/me", { token: saved });
          if (!cancelled) {
            setToken(saved);
            setEmail(me.email);
          }
        } catch {
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {}
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignedIn = useCallback(async (newToken) => {
    const me = await api("/auth/me", { token: newToken });
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch {}
    setToken(newToken);
    setEmail(me.email);
    setNotice("");
  }, []);

  if (!ready) {
    return (
      <div className="splash">
        <Logo />
      </div>
    );
  }

  if (!token) {
    return <LoginView onSignedIn={handleSignedIn} demoMode={demoMode} notice={notice} />;
  }

  return <Dashboard token={token} email={email} onLogout={logout} />;
}
