"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination as PaginationType } from "@/types";

export function Pagination({ pagination, onPageChange }: { pagination?: PaginationType; onPageChange: (page: number) => void }) {
  if (!pagination || pagination.total === 0) return null;
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const totalPages = Math.max(1, pagination.totalPages);
  return <div className="pagination-row">
    <span className="muted small">Showing <strong>{start}–{end}</strong> of <strong>{pagination.total}</strong> records</span>
    <div className="pagination-actions">
      <button className="button button-secondary button-small" type="button" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}><ChevronLeft size={15} /> Previous</button>
      <span className="page-indicator">Page {pagination.page} of {totalPages}</span>
      <button className="button button-secondary button-small" type="button" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}><span>Next</span><ChevronRight size={15} /></button>
    </div>
  </div>;
}
