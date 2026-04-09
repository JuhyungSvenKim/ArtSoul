/**
 * 현재 로그인한 유저 ID를 가져오는 헬퍼
 */
export function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("artsoul-user");
    if (raw) {
      const user = JSON.parse(raw);
      return user.userId || null;
    }
  } catch {}
  try {
    const raw = localStorage.getItem("artsoul-onboarding");
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed.state || parsed;
      return state.userId || null;
    }
  } catch {}
  return null;
}
