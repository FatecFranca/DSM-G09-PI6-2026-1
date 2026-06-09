export type BlocklistListResult = {
  entries: string[];
  total: number;
};

export type BlocklistListOptions = {
  limit: number;
  offset: number;
};

export interface BlocklistRepositoryPort {
  list(options?: BlocklistListOptions): Promise<BlocklistListResult>;
  add(entry: string): Promise<{ added: boolean }>;
  remove(entry: string): Promise<{ removed: boolean }>;
}
