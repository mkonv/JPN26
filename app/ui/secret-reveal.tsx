"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";

export function SecretReveal({ label, value }: { label: string; value: string }) {
  const [sessionValue, setSessionValue] = useState(value);
  const [shown, setShown] = useState(false);
  const [editing, setEditing] = useState(!value);
  const [draft, setDraft] = useState(value);

  function useForSession() {
    const next = draft.trim();
    setSessionValue(next);
    setEditing(false);
    setShown(Boolean(next));
  }

  if (editing || !sessionValue) {
    return (
      <div className="secret-card secret-editor">
        <Ticket size={19} />
        <div>
          <span>{label}</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Введите код на эту сессию"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
          />
        </div>
        <button type="button" className="secret-action" onClick={useForSession}>использовать</button>
      </div>
    );
  }

  return (
    <div className="secret-card">
      <Ticket size={19} />
      <button className="secret-value-button" type="button" onClick={() => setShown((current) => !current)} aria-expanded={shown}>
        <span>{label}</span><strong>{shown ? sessionValue : "••••••••••"}</strong>
      </button>
      <button type="button" className="secret-action" onClick={() => { setDraft(sessionValue); setEditing(true); setShown(false); }}>изменить</button>
    </div>
  );
}
