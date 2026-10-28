import { AlertCircle, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading records…" }: { label?: string }) {
  return <div className="state-panel"><LoaderCircle className="spin" size={23} /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state-panel state-error"><AlertCircle size={22} /><div><strong>Something went wrong</strong><p>{message}</p>{onRetry && <button className="button button-secondary button-small" onClick={onRetry} type="button">Try again</button>}</div></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-state-icon">+</div><h3>{title}</h3><p>{description}</p></div>;
}
