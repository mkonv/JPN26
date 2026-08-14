"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";
import { useLocalStorageValue } from "./use-local-storage";

export function SecretReveal({ label, value }: { label: string; value: string }) {
  const storageKey = `japan-private-code:${label}`;
  const [storedValue, setStoredValue] = useLocalStorageValue(storageKey, value);
  const [shown, setShown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function saveCode() {
    const next = draft.trim();
    setStoredValue(next || null);
    setEditing(false);
    setShown(Boolean(next));
  }

  if (editing || !storedValue) {
    return (
      <div className="secret-card secret-editor">
        <Ticket size={19} />
        <div>
          <span>{label}</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Введите код на этом устройстве"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
          />
        </div>
        <button type="button" className="secret-action" onClick={saveCode}>сохранить</button>
      </div>
    );
  }

  return (
    <button className="secret-card" type="button" onClick={() => setShown((current) => !current)} aria-expanded={shown}>
      <Ticket size={19} />
      <div><span>{label}</span><strong>{shown ? storedValue : "••••••••••"}</strong></div>
      <span className="secret-action">{shown ? "скрыть" : "показать"}</span>
    </button>
  );
}
