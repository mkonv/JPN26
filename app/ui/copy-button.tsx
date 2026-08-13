"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
  return <button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Скопировано" : "Копировать"}</button>;
}
