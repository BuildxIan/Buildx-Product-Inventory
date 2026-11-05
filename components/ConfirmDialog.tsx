"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  /** "danger" (default) for destructive actions, "primary" for neutral ones like logging out. */
  tone?: "danger" | "primary";
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busy,
  tone = "danger",
  icon,
  onConfirm,
  onCancel,
}: Props) {
  const danger = tone === "danger";

  return (
    <Modal onClose={onCancel}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-danger-soft text-danger" : "bg-surface-alt text-ink"
            }`}
          >
            {icon ?? <AlertTriangle size={19} />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-ink">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
