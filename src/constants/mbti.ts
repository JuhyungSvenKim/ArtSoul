import type { MbtiType, MiniTestQuestion } from '../types/mbti';

export const MBTI_TYPES: MbtiType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export const MINI_TEST_QUESTIONS: MiniTestQuestion[] = [
  {
    id: 1,
    questionText: '주말에 에너지를 충전하는 방법은?',
    optionA: { label: '친구들과 모임이나 외출', dimension: 'E' },
    optionB: { label: '혼자만의 시간을 보내기', dimension: 'I' },
  },
  {
    id: 2,
    questionText: '그림을 볼 때 먼저 눈에 들어오는 것은?',
    optionA: { label: '색감, 구도 등 구체적인 디테일', dimension: 'S' },
    optionB: { label: '전체적인 분위기와 느낌', dimension: 'N' },
  },
  {
    id: 3,
    questionText: '작품을 선택할 때 더 중요한 것은?',
    optionA: { label: '가격 대비 가치와 실용성', dimension: 'T' },
    optionB: { label: '마음에 드는 감정과 공감', dimension: 'F' },
  },
  {
    id: 4,
    questionText: '여행 계획을 세울 때 나는?',
    optionA: { label: '일정을 미리 꼼꼼히 계획', dimension: 'J' },
    optionB: { label: '즉흥적으로 유연하게 다니기', dimension: 'P' },
  },
];
