"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, title, onClose, children, wide = false }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal-panel ${wide ? "modal-panel-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><div><p className="eyebrow">DOCTOR TRACKER</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog" type="button"><X size={19} /></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
