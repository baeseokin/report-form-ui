/**
 * 모바일 계층형 계정 목록(관 > 항 > 목 > 세목) 공통 스타일
 *  - 사용 화면: 예산편성서 작성(STEP 2/3), 부서 예산집행 현황, 예산 관리 (모바일)
 *  - 원칙: 계정마다 작은 카드(회색 테두리 · 옅은 그림자)로 나누고 카드 사이에 간격을 둔다.
 *          계층은 카드 들여쓰기 · 글자 굵기 · 계층 색으로 구분한다.
 *          계층 색은 '연한 배지 + 아주 옅은 줄 배경' 두 곳에만 쓴다 (관 파랑 · 항 보라 · 목 초록 · 세목 회색).
 *          굵은 색 띠(border-l) · 색 테두리 · 진한 바탕 배지 · 계층별 글자색은 쓰지 않는다.
 *  - 기준 문서: .claude/skills/ui-design/SKILL.md (계층형 계정 목록)
 */

/** 목록 — 카드 사이 간격 */
export const HIER_LIST_CLASS = "space-y-2";

/** 계정 카드 — 회색 테두리 · 옅은 그림자 + 계층 색의 아주 옅은 배경 */
export const hierRowClass = (level) =>
  "rounded-xl border border-gray-200 shadow-sm overflow-hidden " +
  (({ 관: "bg-blue-50/60", 항: "bg-purple-50/40", 목: "bg-emerald-50/40" })[level] || "bg-white");

/** 들여쓰기 — 계층마다 카드를 8px 안쪽으로 (트리 모양이 보이도록) */
export const hierIndentStyle = (depth) => {
  const margin = Math.max(0, ((depth || 1) - 1) * 8);
  return margin > 0 ? { marginLeft: `${margin}px` } : {};
};

/** 단계 배지(관·항·목·세목) — 연한 바탕 + 진한 글자의 계층 색 */
export const hierBadgeClass = (level) =>
  "px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 " +
  (({ 관: "bg-blue-100 text-blue-700", 항: "bg-purple-100 text-purple-700", 목: "bg-emerald-100 text-emerald-700" })[level] ||
    "bg-gray-100 text-gray-600");

/** 하위 항목 개수 배지 */
export const HIER_COUNT_CLASS = "px-1.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600 shrink-0";

/** 계정명 — 계층이 깊을수록 가볍게 */
export const hierTitleClass = (level) =>
  ({
    관: "text-sm font-bold text-gray-900",
    항: "text-sm font-semibold text-gray-900",
    목: "text-sm font-medium text-gray-800",
  })[level] || "text-sm text-gray-800";
