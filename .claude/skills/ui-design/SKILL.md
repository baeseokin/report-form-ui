---
name: ui-design
description: report-form-ui 의 UI/UX 디자인 표준(버튼·입력칸·카드·표·배지·아이콘·빈 목록·PC/모바일 화면 구조)과 새 화면 추가 절차. 새 화면(메뉴)을 만들거나, 기존 화면에 버튼·입력칸·표·모달을 추가·수정하거나, 화면 디자인을 통일·검토할 때 사용한다.
---

# UI/UX 디자인 표준 · 새 화면 추가 절차

설명과 보고는 한국어로 한다. 공통 클래스 정의는 `src/assets/ui.css` (Tailwind `@layer components`).
**새 코드에서 버튼·입력칸·카드·표·배지에 색·모서리·여백을 직접 조합하지 않는다.** 아래 클래스를 쓰고, 배치(너비·여백·정렬)만 Tailwind 유틸리티로 덧붙인다.

## 1. 기본 원칙
- 주 색은 **보라(purple)**. 다른 계열(파랑·남색·초록 등)을 주요 동작 색으로 쓰지 않는다.
- 화면 제목과 HELP 배지는 `App.vue` 가 `route.meta.menuName` 으로 그린다 → **화면 안에 같은 제목(h1/h2)을 또 넣지 않는다.**
- 페이지 배경(회색)과 바깥 여백은 `App.vue` 의 `<main>` 이 준다. 화면 루트는 `<div class="font-nanum">` 또는 `space-y-6` 정도로 시작한다.
- 모든 화면은 **PC 컴포넌트 + 모바일 컴포넌트 한 쌍**으로 만든다 (`src/components/X.vue`, `src/components/mobile/XMobile.vue`).

## 2. 버튼
| 용도 | 클래스 | 예 |
|---|---|---|
| 주요 동작 | `btn btn-primary` | 저장, 등록, 다음, 결재요청, 상신, 확인 |
| 조회 | `btn btn-search` | 조회, 검색 |
| 엑셀 | `btn btn-excel` | 엑셀 다운로드 (문구는 "엑셀 다운로드") |
| 삭제·반려 | `btn btn-danger` | 삭제, 반려 |
| 보조 (연회색) | `btn btn-secondary` | 취소, 초기화, 닫기, 이전, 목록으로, 새로고침, 비밀번호 초기화 |
| 표·카드 안 아이콘 | `btn-icon` + `<img src="/icons/….svg" class="w-6 h-6">` | 상세보기·수정·복사·삭제 |

- 크기: 기본(PC, 36px) · `btn-sm`(표 안·보조 동작) · `btn-lg`(모바일 하단 주요 동작, 폼 마지막 단계, 44px).
- 한 영역의 주요 동작(`btn-primary`)은 하나. 나머지는 `btn-secondary`.
- 비활성은 `:disabled` 만 주면 된다 (스타일은 공통 클래스가 처리). 그라데이션 버튼은 쓰지 않는다.
- 아이콘 파일: `public/icons/` — `view.svg`(상세보기) `edit.svg`(수정) `copy.svg`(복사) `trash.svg`(삭제) `report.svg` `approved.svg` `rejected.svg` `draft.svg`. 행 동작에 이모지(👁 ✏️ 🗑)를 쓰지 않는다. 아이콘 버튼에는 `title` 과 `alt` 를 꼭 넣는다.

## 3. 입력칸
- PC: `form-input` (input·select·textarea 공통, 높이 36px, 포커스 보라 테두리). 표 안의 작은 칸은 `form-input form-input-sm`.
  - 기본 폭은 100%. 가로로 나란히 둘 때는 `w-auto`/`w-40`/`flex-1` 등으로 폭을 지정한다.
  - 숫자·금액은 `text-right font-mono`, 금액 표시는 `toLocaleString()` + "원".
  - 라벨: `<label class="form-label">`.
- 모바일: `mobile-form-control` (높이 44px, 글자 16px — iOS 확대 방지). select 는 `mobile-form-control mobile-form-control-select`.
- 읽기 전용 값은 `disabled` 또는 `readonly` (회색 배경 자동).

## 4. 카드 · 검색조건 · 표
- 카드: `card` (흰 바탕, `rounded-xl`, 회색 테두리, 옅은 그림자). 내부 여백은 `p-4`/`p-5`.
- PC 검색조건 영역: `filter-card` 안에 `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4`, 맨 끝에 `btn btn-search`(+ 필요 시 `btn btn-excel`).
- 결과 요약 줄: 표 위 오른쪽에 `건수: N건 | 합계금액: N원` (`text-xs text-gray-600`, 금액은 `text-purple-700 font-bold`).
- 표: `<table class="table-std">` — 머리글은 연보라(`bg-purple-100`), 셀 테두리·여백·행 hover 는 클래스가 처리. 표는 `card overflow-x-auto` 로 감싼다.
- 페이지 이동: 표 아래 가운데, 현재 페이지 `btn btn-primary btn-sm`, 나머지 `btn btn-secondary btn-sm`.
- 모바일 검색조건: 접히는 보라 막대(`bg-purple-100` + "검색조건 · 요약 · ▼") → 펼치면 입력칸 + `btn btn-search btn-lg w-full`. 참고 구현: `mobile/PaymentHistoryMobile.vue`.
- 모바일 목록: 표 대신 `card p-4` 카드 목록 (`space-y-3`), 카드 전체를 눌러 상세 열기, 상태는 오른쪽 위 배지.

## 5. 상태 배지
`<span class="badge badge-…">` — 결재 상태 색은 아래로 고정한다.
| 상태 | 클래스 |
|---|---|
| 작성중 · 임시저장 | `badge-gray` |
| 결재진행중 | `badge-amber` |
| 결재완료 | `badge-green` |
| 재정부이관완료 | `badge-purple` |
| 결재반려 · 반려 | `badge-red` |

## 6. 빈 목록 · 불러오는 중 · 알림
- 빈 목록: `<div class="empty-state">조회된 {대상}이(가) 없습니다.</div>` (표 안이면 `<td :colspan class="empty-state">`).
- 불러오는 중: 같은 자리에 `<span class="inline-block animate-spin">🔄</span> {대상}을(를) 불러오는 중입니다...`.
- 알림·확인: 새 화면은 공통 모달 `ModalAlert`(알림) · `ConfirmBox`(확인)를 쓴다. 기존 화면의 브라우저 기본 `alert/confirm` 은 아직 남아 있다 (향후 통일 예정) — 기존 화면을 고칠 때 굳이 섞어 바꾸지 않는다.
- 문구: 존댓말 평서문, 마침표로 끝낸다 ("저장되었습니다.", "삭제하시겠습니까?").

## 7. 새 화면(메뉴) 추가 절차
1. **컴포넌트 두 개** 작성: `src/components/X.vue`(PC), `src/components/mobile/XMobile.vue`(모바일). 참고 구현 — 목록 조회: `PaymentHistory.vue` / `mobile/PaymentHistoryMobile.vue`.
2. **라우트** (`src/router/index.js`): 동적 import 로 `isMobile() ? XMobile : X` 를 고르고 `meta: { menuName: "메뉴 이름" }` 지정 (모든 사용자에게 열 메뉴면 `publicMenu: true`).
3. **사이드바 메뉴** (`src/App.vue` 의 메뉴 목록): `{ label, path, icon }` 추가. 사이드바 아이콘만 이모지를 쓴다.
4. **권한**: 라우터가 `menuName` 으로 접근을 검사한다.
   - `src/components/RoleAccess.vue` 의 `menus` 목록에 추가 (권한 관리 화면에서 부여 가능하도록)
   - 운영 DB 는 권한 관리 화면에서 역할별로 부여해야 한다는 것을 사용자에게 알린다
   - E2E 시드: `../report-server/tests/e2e/seed.js` 의 `COMMON_MENUS` 또는 `FINANCE_MENUS` 에 추가 (report-server 커밋)
5. **도움말** (`src/helpContent.js` 의 `helpByPath`): `purpose`, `steps`, `note`.
6. **data-testid**: 목록 행 `x-row`(PC) / `x-card`(모바일), 행 동작 버튼 `x-view-btn` 등, 주요 입력칸·버튼. PC·모바일에서 같은 역할이면 같은 testid.
7. **E2E 케이스** 추가 (e2e 스킬의 "케이스 작성 규칙" — PC · iPhone · Android 모두 통과).
8. **눈으로 확인**: 작성한 E2E 의 `e2e-screenshots/<케이스>` 와 `~iphone` 스크린샷을 Read 로 열어, 위 표준(버튼 색·입력칸·표·빈 목록)과 다른 곳이 없는지 확인한다.

## 8. 기존 화면을 수정할 때
- 고치는 부분에 아직 옛 스타일(직접 조합한 `bg-blue-500 … rounded` 버튼, `border p-2 rounded` 입력칸, 이모지 행 아이콘)이 있으면 같은 영역 안에서 표준 클래스로 바꾼다. 관련 없는 영역까지 넓히지 않는다.
- 문서 미리보기·인쇄 화면(`ReportPreview.vue`, `BudgetReportPreview.vue`)은 인쇄 양식이라 이 표준의 예외다.

## 9. 검토 체크리스트 (새 화면 · 디자인 변경 시)
- [ ] 화면 안에 제목(h1/h2) 중복 없음 — App.vue 가 그림
- [ ] 버튼이 모두 `btn btn-*` (그라데이션·파랑·초록 직접 색 없음), 영역별 주요 버튼 하나
- [ ] 입력칸이 PC `form-input` / 모바일 `mobile-form-control`
- [ ] 표가 `table-std`, 행 동작은 SVG 아이콘 + `btn-icon`
- [ ] 빈 목록·불러오는 중 상태 있음
- [ ] 상태 배지 색이 5장 표와 일치
- [ ] 모바일 컴포넌트: 접히는 검색조건, 카드 목록, 44px 입력칸·버튼
- [ ] 라우트·사이드바·RoleAccess·도움말·E2E 시드 메뉴 등록
- [ ] E2E 3개 환경 통과 + 스크린샷 확인
