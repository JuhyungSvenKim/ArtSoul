export type AuthProvider = 'kakao' | 'apple';

export interface AuthState {
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  userId: string | null;
}

export interface KakaoShareData {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}
