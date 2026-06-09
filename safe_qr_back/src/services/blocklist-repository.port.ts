export type BlocklistListResult = {
  entries: string[];
  total: number;
};

export interface BlocklistRepositoryPort {
  list(): Promise<BlocklistListResult>;
  add(entry: string): Promise<{ added: boolean }>;
  remove(entry: string): Promise<{ removed: boolean }>;
}
