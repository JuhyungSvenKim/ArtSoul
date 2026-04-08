/**
 * 이미지 CDN 최적화 유틸리티
 *
 * Vercel 트래픽 비용 절감을 위해:
 * 1. Supabase Storage CDN 직접 활용 (무료 CDN 포함)
 * 2. 포맷: WebP (고품질 저용량, 브라우저 호환 최고)
 * 3. 대안: AVIF (더 작지만 브라우저 지원 아직 제한적)
 * 4. 리사이즈: Supabase Storage Transform 활용
 *
 * 권장 이미지 업로드 시:
 * - 원본: 최대 2400×3200 (3:4)
 * - 서빙: 썸네일 400×533, 중간 800×1067, 풀 1200×1600
 * - 포맷: WebP, quality 80 (시각적 차이 거의 없이 70~80% 용량 절감)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://chorbmxylvhofievnpti.supabase.co'

export type ImageSize = 'thumb' | 'medium' | 'full' | 'original'

const SIZE_CONFIG: Record<ImageSize, { width: number; height: number; quality: number }> = {
  thumb: { width: 400, height: 533, quality: 75 },
  medium: { width: 800, height: 1067, quality: 80 },
  full: { width: 1200, height: 1600, quality: 85 },
  original: { width: 2400, height: 3200, quality: 90 },
}

/**
 * Supabase Storage 이미지 URL에 변환 파라미터 추가
 *
 * Supabase Storage는 render/image/authenticated 또는 public 경로에서
 * ?width=&height=&format=webp 파라미터를 지원합니다.
 */
export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  size: ImageSize = 'medium',
): string | null {
  if (!imageUrl) return null

  // 이미 외부 CDN URL이면 그대로 반환
  if (!imageUrl.includes('supabase') && !imageUrl.includes(SUPABASE_URL)) {
    return imageUrl
  }

  const config = SIZE_CONFIG[size]

  // Supabase Storage URL 변환
  // /storage/v1/object/public/bucket/path → /storage/v1/render/image/public/bucket/path
  let url = imageUrl
  if (url.includes('/storage/v1/object/')) {
    url = url.replace('/storage/v1/object/', '/storage/v1/render/image/')
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}width=${config.width}&height=${config.height}&format=webp&quality=${config.quality}`
}

/**
 * srcSet 생성 (반응형 이미지)
 */
export function getImageSrcSet(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null

  const sizes: ImageSize[] = ['thumb', 'medium', 'full']
  return sizes
    .map(size => {
      const url = getOptimizedImageUrl(imageUrl, size)
      const width = SIZE_CONFIG[size].width
      return url ? `${url} ${width}w` : null
    })
    .filter(Boolean)
    .join(', ')
}

/**
 * 이미지 업로드 시 권장 설정
 */
export const IMAGE_UPLOAD_GUIDE = {
  maxFileSizeMB: 5,
  recommendedFormat: 'WebP',
  recommendedDimensions: '1200×1600 (3:4 비율)',
  acceptedFormats: ['image/webp', 'image/jpeg', 'image/png', 'image/avif'],
  bucket: 'artworks',
  tips: [
    'WebP 포맷 권장 (JPEG 대비 25~35% 용량 절감)',
    'AVIF는 더 작지만 Safari 구버전 미지원',
    '3:4 비율로 크롭하여 업로드',
    '원본 최대 2400×3200, 5MB 이하',
  ],
}
