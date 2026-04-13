import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gender } from '@/types';

export interface MbtiStrengths {
  E: number; I: number;
  S: number; N: number;
  T: number; F: number;
  J: number; P: number;
}

interface OnboardingState {
  // Step 1: Birth Info
  birthDate: string;
  birthTime: string | null;
  nameKorean: string;
  nameHanja: string | null;
  gender: Gender | null;

  // Step 2: MBTI
  mbti: string | null;
  mbtiStrengths: MbtiStrengths | null;

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
  setMbti: (mbti: string, strengths?: MbtiStrengths) => void;
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
      mbtiStrengths: null,
      tasteSelections: [],
      userId: null,

      setBirthInfo: (data) => set(data),

      setMbti: (mbti, strengths) => set({ mbti, mbtiStrengths: strengths || null }),

      addTasteSelection: (artworkId) =>
        set((state) => ({ tasteSelections: [...state.tasteSelections, artworkId] })),

      setUserId: (id) => set({ userId: id }),

      resetTaste: () => set({ tasteSelections: [] }),
    }),
    {
      name: 'artsoul-onboarding',
    }
  )
);
