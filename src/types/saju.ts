import type { Ohaeng, OhaengScores } from './ohaeng';

export interface SajuPillar {
  cheongan: string;
  jiji: string;
  ohaeng: Ohaeng;
}

export interface Sinsal {
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DaeunPeriod {
  startAge: number;
  endAge: number;
  cheongan: string;
  jiji: string;
  ohaeng: Ohaeng;
  description?: string;
  isCurrent?: boolean;
}

export interface NameAnalysis {
  strokes: { surname: number; name1: number; name2?: number };
  wonHyeongYiJeong: {
    won: { value: number; ohaeng: Ohaeng };
    hyeong: { value: number; ohaeng: Ohaeng };
    yi: { value: number; ohaeng: Ohaeng };
    jeong: { value: number; ohaeng: Ohaeng };
  };
  sajuCompatibility: string;
  recommendation: string;
}

export interface ArtDna {
  dominantOhaeng: Ohaeng;
  subOhaeng?: Ohaeng;
  recommendedStyles: string[];
  recommendedColors: string[];
  recommendedMoods?: string[];
  description: string;
}

export interface SajuProfile {
  id: string;
  userId: string;
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar | null;
  ilgan: string;
  ohaengBalance: OhaengScores;
  sinsal: Sinsal[];
  daeun: DaeunPeriod[];
  gyeokguk: string;
  nameAnalysis: NameAnalysis | null;
  artDna: ArtDna;
  artDnaCardUrl?: string;
  fullInterpretation?: string;
}
