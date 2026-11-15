/** A catalog entry in the Set Explorer (from the built-in dataset or Rebrickable). */
export interface BrickSet {
  /** Rebrickable set number including variant, e.g. "75192-1". */
  setNum: string;
  name: string;
  year: number;
  /** Top-level theme, e.g. "Star Wars". */
  theme: string;
  /** Most specific theme when it differs, e.g. "Ultimate Collector Series". */
  subtheme?: string;
  pieces: number;
  imageUrl: string | null;
}

export interface SetQuery {
  search?: string;
  theme?: string;
  minYear?: number;
  maxYear?: number;
  minPieces?: number;
  /** Omitted means no upper bound ("5,000+"). */
  maxPieces?: number;
  sort?: SetSort;
  page?: number;
}

export type SetSort = 'newest' | 'oldest' | 'pieces-desc' | 'pieces-asc' | 'name';

export interface SetSearchResponse {
  source: 'rebrickable' | 'local';
  count: number;
  page: number;
  hasMore: boolean;
  results: BrickSet[];
  themes: string[];
}
