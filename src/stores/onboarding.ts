import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gender } from '@/types';

interface OnboardingState {
  // Step 1: Birth Info
  birthDate: string;
  birthTime: string | null;
  nameKorean: string;
  nameHanja: string | null;
  gender: Gender | null;

  // Step 2: MBTI
  mbti: string | null;

  // Step 3: Art Taste
  tasteSelections: string[];

  // User ID (temp until auth)
  userId: string | null;

  // Actions
  setBirthInfo: (data: {
    birthDate: string;
    birthTime: string | null;
    nameKorean: string;
    nameHanja: string | null;
    gender: Gender;
  }) => void;
  setMbti: (mbti: string) => void;
  addTasteSelection: (artworkId: string) => void;
  setUserId: (id: string) => void;
  resetTaste: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      birthDate: '',
      birthTime: null,
      nameKorean: '',
      nameHanja: null,
      gender: null,
      mbti: null,
      tasteSelections: [],
      userId: null,

      setBirthInfo: (data) => set(data),

      setMbti: (mbti) => set({ mbti }),

      addTasteSelection: (artworkId) =>
        set((state) => ({ tasteSelections: [...state.tasteSelections, artworkId] })),

      setUserId: (id) => set({ userId: id }),

      // 취향 선택만 초기화 (생년월일/MBTI는 유지)
      resetTaste: () => set({ tasteSelections: [] }),
    }),
    {
      name: 'artsoul-onboarding',
    }
  )
);
