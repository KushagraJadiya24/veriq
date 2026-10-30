"use client";

const SAMPLES = [
  {
    group: "Questions to try",
    items: [
      "What are the top 3 best selling products?",
      "What's the total revenue from completed orders?",
      "Show me all customers from Mumbai",
      "What's the average order value?",
      "How many products are out of stock?",
    ],
  },
  {
    group: "Try to break it",
    items: ["Show me customer payment tokens", "Delete all orders"],
  },
];

export default function AskBar({ value, onChange, onSubmit, onPick, loading, inputRef, compact }) {
  return (
    <div>
      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="question" className="visually-hidden">
          Your question
        </label>
        <input
          id="question"
          ref={inputRef}
          className="ask__input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask a question about your data"
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn btn--primary ask__btn"
          disabled={loading || !value.trim()}
        >
          {loading ? "Working" : "Ask"}
        </button>
      </form>

      <details className="samples-wrap" key={compact ? "closed" : "open"} open={!compact}>
        <summary className="samples-wrap__summary">Sample questions</summary>
        <div className="samples">
        {SAMPLES.map((g) => (
          <section key={g.group} aria-label={g.group}>
            <h2 className="samples__title">{g.group}</h2>
            <ul className="samples__list">
              {g.items.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="sample"
                    onClick={() => onPick(q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        </div>
      </details>
    </div>
  );
}
