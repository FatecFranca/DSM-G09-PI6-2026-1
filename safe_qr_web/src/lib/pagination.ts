export const DEFAULT_PAGE_SIZE = 10;

export function clampPage(page: number, total: number, pageSize: number): number {
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  return Math.min(Math.max(0, page), maxPage);
}

/** Pagina no cliente (blocklist pequena ou API legada sem offset). */
export function slicePage<T>(items: T[], page: number, pageSize: number): T[] {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}
