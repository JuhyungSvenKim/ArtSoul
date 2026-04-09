export type Ohaeng = '목' | '화' | '토' | '금' | '수';

export type OhaengScores = Record<Ohaeng, number>;

export interface OhaengInfo {
  key: Ohaeng;
  label: string;
  englishName: string;
  color: string;
}
