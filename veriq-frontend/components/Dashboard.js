"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import Rail from "./Rail";
import AskBar from "./AskBar";
import ResultView from "./ResultView";
import ErrorView from "./ErrorView";
import LockedConnect from "./LockedConnect";
import { IconMenu } from "./Icons";

const DB_LABEL = process.env.NEXT_PUBLIC_DB_LABEL || "Connected database";

export default function Dashboard({ token, email, onLogout }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [runId, setRunId] = useState(0);

  const [schema, setSchema] = useState(null);
  const [schemaState, setSchemaState] = useState("loading");
  const [schemaMessage, setSchemaMessage] = useState("");

  const [history, setHistory] = useState([]);
  const [historyAvailable, setHistoryAvailable] = useState(true);

  const [railOpen, setRailOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const inputRef = useRef(null);

  // A 401 anywhere means the token expired: send the user back to sign in.
  const handleAuthError = useCallback(
    (e) => {
      if (e instanceof ApiError && e.status === 401) {
        onLogout("Your session expired. Sign in again.");
        return true;
      }
      return false;
    },
    [onLogout]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/workspace/schema", { token });
        if (cancelled) return;
        setSchema(data);
        if (Object.keys(data).length) {
          setSchemaState("ready");
        } else {
          setSchemaState("empty");
          setSchemaMessage("No tables found in the connected database.");
        }
      } catch (e) {
        if (cancelled || handleAuthError(e)) return;
        setSchemaState("error");
        setSchemaMessage(
          e.status === 404 ? "No database is connected to this workspace yet." : e.message
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, handleAuthError]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api("/query/history", { token });
      setHistory(Array.isArray(data) ? data : []);
      setHistoryAvailable(true);
    } catch (e) {
      if (handleAuthError(e)) return;
      if (e.status === 404 || e.status === 405) setHistoryAvailable(false);
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setQuestion(text);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api("/query/ask", {
        token,
        method: "POST",
        json: { question: text },
      });
      setResult(data);
      setRunId((n) => n + 1);
    } catch (e) {
      if (handleAuthError(e)) return;
      setError({ status: e.status ?? 500, message: e.message });
    } finally {
      setLoading(false);
      loadHistory();
    }
  }

  function pickHistory(text) {
    setQuestion(text);
    setRailOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="app">
      <Rail
        open={railOpen}
        onClose={() => setRailOpen(false)}
        email={email}
        onLogout={onLogout}
        dbLabel={DB_LABEL}
        schema={schema}
        schemaState={schemaState}
        schemaMessage={schemaMessage}
        history={history}
        historyAvailable={historyAvailable}
        onPickHistory={pickHistory}
        onOpenConnect={() => {
          setRailOpen(false);
          setConnectOpen(true);
        }}
      />
      {railOpen && <div className="scrim" onClick={() => setRailOpen(false)} />}

      <main className="main">
        <div className="main__inner">
          <div className="topbar">
            <button
              type="button"
              className="icon-btn menu-btn"
              onClick={() => setRailOpen(true)}
              aria-label="Open menu"
            >
              <IconMenu />
            </button>
            <h1 className="page-title">Ask your data</h1>
          </div>

          <AskBar
            value={question}
            onChange={setQuestion}
            onSubmit={() => ask()}
            onPick={ask}
            loading={loading}
            inputRef={inputRef}
            compact={loading || Boolean(result) || Boolean(error)}
          />

          <div className="output" aria-live="polite">
            {loading && (
              <div className="working" role="status">
                <div className="working__bar" aria-hidden="true" />
                <p>
                  Finding the right tables and writing the query. This usually takes a few
                  seconds.
                </p>
              </div>
            )}
            {error && <ErrorView error={error} />}
            {result && <ResultView key={runId} result={result} />}
            {!loading && !result && !error && (
              <p className="empty">
                Pick a question above or write your own. Veriq shows the SQL it wrote and each
                check it ran, so you can verify the answer.
              </p>
            )}
          </div>
        </div>
      </main>

      <LockedConnect open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}
