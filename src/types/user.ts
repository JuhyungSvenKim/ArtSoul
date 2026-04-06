import type { MbtiType } from './mbti';
import type { SajuProfile, ArtDna } from './saju';

export type UserRole = 'consumer' | 'artist' | 'both';

export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  email: string | null;
  nickname: string;
  avatarUrl: string | null;
  birthDate: string;
  birthTime: string | null;
  nameKorean: string;
  nameHanja: string | null;
  gender: Gender;
  mbti: MbtiType | null;
  role: UserRole;
  isPassVerified: boolean;
  sajuProfile?: SajuProfile;
  artDna?: ArtDna;
  createdAt: string;
}

export interface Artist {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  portfolioUrl: string | null;
  isVerified: boolean;
  followerCount: number;
  artworkCount: number;
  avatarUrl: string | null;
}

export type OrderType = 'purchase' | 'rental';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type RentalStatus = 'active' | 'exchange_pending' | 'returned' | 'converted_to_purchase';

export interface Order {
  id: string;
  artworkId: string;
  artworkTitle: string;
  artworkThumbnailUrl: string;
  type: OrderType;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Rental {
  id: string;
  artworkId: string;
  artworkTitle: string;
  artworkThumbnailUrl: string;
  cycleMonths: 3 | 6;
  startDate: string;
  nextExchangeDate: string;
  status: RentalStatus;
  totalPaid: number;
}
