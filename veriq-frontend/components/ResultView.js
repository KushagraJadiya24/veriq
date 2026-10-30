import SqlViewer from "./SqlViewer";
import DataTable from "./DataTable";
import CheckList, { buildChecks } from "./CheckList";
import { IconAlert } from "./Icons";

export default function ResultView({ result }) {
  const checks = buildChecks(result.hallucination_warning);
  const tables = Array.isArray(result.tables_used) ? result.tables_used : [];

  return (
    <div className="result">
      <section className="result__main" aria-labelledby="answer-title">
        <h2 id="answer-title" className="section-title">
          Answer
        </h2>
        {result.explanation && <p className="result__explain">{result.explanation}</p>}

        <dl className="stats">
          <div>
            <dt>Rows</dt>
            <dd>{result.row_count}</dd>
          </div>
          <div>
            <dt>Run time</dt>
            <dd>{result.execution_time_ms} ms</dd>
          </div>
          {result.cached && (
            <div>
              <dt>Source</dt>
              <dd>Cached</dd>
            </div>
          )}
        </dl>

        {result.hallucination_warning && (
          <div className="banner banner--warn" role="note">
            <IconAlert />
            <div>
              <strong>Worth a second look</strong>
              <p>{result.hallucination_warning}</p>
            </div>
          </div>
        )}

        <DataTable rows={result.rows} />
      </section>

      <aside className="result__side" aria-label="How this answer was produced">
        <section>
          <h3 className="side-title">SQL</h3>
          <SqlViewer sql={result.sql} />
        </section>
        {tables.length > 0 && (
          <section>
            <h3 className="side-title">Tables used</h3>
            <ul className="tag-list">
              {tables.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h3 className="side-title">Checks</h3>
          <CheckList checks={checks} />
        </section>
      </aside>
    </div>
  );
}
