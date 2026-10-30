import { IconBlock } from "./Icons";

export default function ErrorView({ error }) {
  const { status, message } = error;
  let title = "Couldn't answer that";
  let hint = "";

  if (status === 429) {
    title = "Too many requests";
    hint = "Wait a minute and try again. The AI quota may also be used up for today.";
  } else if (status === 400) {
    title = "Veriq didn't run a query";
    hint =
      "Veriq only runs read-only SELECT queries and never selects sensitive columns. Ask for specific information instead of changing data.";
  } else if (status === 0) {
    title = "Can't reach the API";
  } else if (status >= 500) {
    title = "The server hit an error";
  }

  return (
    <div className="error" role="alert">
      <IconBlock width={20} height={20} />
      <div>
        <strong className="error__title">{title}</strong>
        <p className="error__message">{message}</p>
        {hint && <p className="error__hint">{hint}</p>}
      </div>
    </div>
  );
}
