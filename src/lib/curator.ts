export interface CuratorInput {
  title: string;
  artistName?: string;
  genre?: string;
  subject?: string;
  style?: string;
  color?: string;
  energy?: string;
  primaryOhaeng?: string;
  secondaryOhaeng?: string;
  eumYang?: string;
  sizeCmW?: number;
  sizeCmH?: number;
  userDescription?: string;
}

/**
 * 큐레이터 엔진: AI가 작품 설명을 자동 생성
 */
export async function generateCuratorDescription(artwork: CuratorInput): Promise<string> {
  const response = await fetch('/api/curator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artwork }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `큐레이터 API 오류 (${response.status})`);
  }

  const data = await response.json();
  if (!data.success || !data.description) {
    throw new Error('큐레이터 설명을 생성할 수 없습니다');
  }

  return data.description;
}
