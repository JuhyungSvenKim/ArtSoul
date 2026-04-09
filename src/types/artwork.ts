import type { Ohaeng } from './ohaeng';

export type ArtworkStatus = 'available' | 'rented' | 'sold' | 'hidden';

export type Genre = '유화' | '수채화' | '판화' | '디지털아트' | '수묵화' | '혼합매체';

export interface Artwork {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description?: string;
  imageUrls: string[];
  thumbnailUrl: string;
  price: number;
  rentalPrice: number | null;
  genre: Genre | string;
  styleTags: string[];
  colorPalette: string[];
  ohaengTags: Ohaeng[];
  moodTags: string[];
  sizeCm: { w: number; h: number };
  status: ArtworkStatus;
  isDemo: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export interface ArtworkWithMatch extends Artwork {
  sajuMatchScore: number;
  matchReason: string;
}

export interface TasteArtwork {
  id: string;
  imageUrl: string;
  ohaengTags: Ohaeng[];
}

export type SortOption = '추천순' | '신규순' | '가격순' | '인기순';

export type PriceRange = '~5만' | '5~20만' | '20~50만' | '50~100만' | '100만~';

export type SizeRange = '소형' | '중형' | '대형';

export interface FilterState {
  ohaeng: Ohaeng[];
  genre: string[];
  priceRange: PriceRange[];
  sizeRange: SizeRange[];
}
