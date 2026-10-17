/**
 * 시스템 기준일자 및 공통 날짜 유틸
 *
 * 🗓️ 시간 이동(Mock Date) 테스트:
 *   .env (또는 .env.development) 파일에:
 *     VITE_MOCK_DATE=2027-01-15
 *   를 설정하면 전체 화면의 기본 날짜와 연도가 해당 일자로 동작합니다.
 *   (설정하지 않거나 주석 처리 시 실제 현재 날짜로 자동 동작)
 */

// 환경변수에 설정된 Mock Date (YYYY-MM-DD 형식)
const envMockDate = import.meta.env.VITE_MOCK_DATE;

/**
 * 기준 '오늘' 날짜 문자열 (YYYY-MM-DD)
 */
export function getToday() {
  if (envMockDate && /^\d{4}-\d{2}-\d{2}/.test(envMockDate)) {
    return envMockDate.substring(0, 10);
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 기준 '당해연도' (숫자, 예: 2026 또는 2027)
 */
export function getCurrentYear() {
  const todayStr = getToday();
  return parseInt(todayStr.substring(0, 4), 10);
}

/**
 * 기준 Date 객체 (로컬 자정 기준)
 */
export function getSystemDate() {
  const todayStr = getToday();
  const [y, m, d] = todayStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 날짜 문자열 안전 포맷팅 (타임존 UTC 변환으로 인한 하루 밀림 방지)
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.substring(0, 10);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
