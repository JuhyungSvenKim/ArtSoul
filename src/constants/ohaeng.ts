import type { Ohaeng, OhaengInfo } from '../types/ohaeng';

export const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수'];

export const OHAENG_INFO: Record<Ohaeng, OhaengInfo> = {
  '목': { key: '목', label: '목(木)', englishName: 'Wood', color: '#22C55E' },
  '화': { key: '화', label: '화(火)', englishName: 'Fire', color: '#EF4444' },
  '토': { key: '토', label: '토(土)', englishName: 'Earth', color: '#CA8A04' },
  '금': { key: '금', label: '금(金)', englishName: 'Metal', color: '#9CA3AF' },
  '수': { key: '수', label: '수(水)', englishName: 'Water', color: '#3B82F6' },
};

export const OHAENG_TAILWIND_COLORS: Record<Ohaeng, string> = {
  '목': 'bg-green-500',
  '화': 'bg-red-500',
  '토': 'bg-yellow-600',
  '금': 'bg-gray-400',
  '수': 'bg-blue-500',
};

export const OHAENG_TEXT_COLORS: Record<Ohaeng, string> = {
  '목': 'text-green-500',
  '화': 'text-red-500',
  '토': 'text-yellow-600',
  '금': 'text-gray-400',
  '수': 'text-blue-500',
};
