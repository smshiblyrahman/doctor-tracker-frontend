"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => closeRef.current(), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);
  if (!message) return null;
  return <div className="toast-success" role="status" aria-live="polite"><CheckCircle2 size={18} /><span>{message}</span><button type="button" aria-label="Dismiss notification" onClick={onClose}><X size={15} /></button></div>;
}
