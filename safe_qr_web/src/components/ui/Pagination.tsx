import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './Button';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** `header` — só botões, para o topo do card */
  variant?: 'default' | 'header';
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  variant = 'default',
}: PaginationProps) {
  if (total === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  const controls = (
    <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="min-w-[7rem] text-center text-slate-400">
          Página {page + 1} de {totalPages}
        </span>
        <Button
          variant="secondary"
          className="px-3 py-1.5"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
    </div>
  );

  if (variant === 'header') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="text-slate-400">
          {start}–{end} de {total}
        </span>
        {controls}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-3 text-xs text-slate-500">
      <span>
        {start}–{end} de {total}
      </span>
      {controls}
    </div>
  );
}
