# 🎨 report-form-ui UI/UX 디자인 시스템 및 화면 설계 가이드라인

본 가이드라인은 **원천교회 재정부 지출청구 및 예산관리 시스템(`report-form-ui`)**의 기존 화면 구성, 디자인 토큰, 컴포넌트 패턴 및 사용자 경험(UX) 원칙을 체계적으로 분석하여 정리한 표준 문서입니다.  
향후 기존 화면의 레이아웃/스타일을 수정하거나 신규 화면을 추가할 때 **시각적·기능적 이질감 없이 일관된 완성도를 유지**하기 위한 지침서로 활용됩니다.

---

## 📌 목차
1. [시스템 개요 및 UI/UX 핵심 철학](#1-시스템-개요-및-uiux-핵심-철학)
2. [디자인 토큰 (Design Tokens)](#2-디자인-토큰-design-tokens)
3. [레이아웃 & 네비게이션 아키텍처](#3-레이아웃--네비게이션-아키텍처)
4. [표준 화면 유형별 UI/UX 패턴 (Page Archetypes)](#4-표준-화면-유형별-uiux-패턴-page-archetypes)
5. [공통 UI 컴포넌트 표준 규격](#5-공통-ui-컴포넌트-표준-규격)
6. [전자서명 및 결재 프로세스 UX 규격](#6-전자서명-및-결재-프로세스-ux-규격)
7. [신규 화면 개발 체크리스트](#7-신규-화면-개발-체크리스트)

---

## 1. 시스템 개요 및 UI/UX 핵심 철학

### 1.1 시스템 도메인 특성
- **대상 사용자**: 부서 기안자, 부서장/위원장/당회장(결재자), 재정부 관리자, 시스템 관리자
- **주요 목적**: 종이 없는 온라인 지출결의서 작성, 다단계 전자서명 및 결재, 실시간 예산 연동 및 집행 현황 관리
- **환경적 요구**: 사무실 PC 환경뿐 아니라 현장 및 이동 중 모바일 스마트폰 환경에서도 결재/조회 완결성 보장

### 1.2 핵심 UI/UX 원칙
1. **완벽한 기기 최적화 (Dual Experience: PC & Mobile)**
   - 단순 미디어 쿼리에 그치지 않고, 복잡한 업무 화면(지출내역 작성, 결재목록, 사용자 관리 등)은 `isMobile()` 기반으로 **PC 전용 컴포넌트**와 **모바일 전용 컴포넌트(`components/mobile/*`)**를 분리하여 플랫폼별 최적의 터치/마우스 조작감을 제공합니다.
2. **시각적 계층감과 안정감 (Visual Hierarchy & Reliability)**
   - 재정/회계 시스템에 요구되는 신뢰성을 위해 차분한 배경(`gray-100`, `gray-50`) 위에 **퍼플/인디고(Brand Accent)**를 중심으로 포인트를 배분합니다.
   - 테이블 헤더와 중요 액션 버튼에 통일된 소프트 퍼플 톤(`bg-purple-100`, `text-purple-700`, 그라데이션)을 적용합니다.
3. **직관적인 상태 전달 (Clarity of Status)**
   - 진행 상태(결재진행중, 결재완료, 반려, 재정부이관완료)를 명확한 색상 규격의 상태 칩(Status Chip)으로 통일하여 사용자가 한눈에 진행 상황을 판별할 수 있게 합니다.
4. **실수 방지 및 선제적 가이드 (Defensive UX & Contextual Help)**
   - 이전 단계 필수 입력 미충족 시 다음 탭 비활성화, 결재 1단계 이후 수정/삭제 제한, 헤더 우측의 `HELP` 버튼을 통한 화면 목적 및 순서 안내 등 사용자 착오를 사전에 차단합니다.

---

## 2. 디자인 토큰 (Design Tokens)

### 2.1 타이포그래피 (Typography)
- **기본 폰트**: `'Nanum Barun Gothic', sans-serif` (`font-nanum`)
  - 모든 뷰 루트 컨테이너에 반드시 `font-nanum` 클래스를 명시합니다.
- **숫자/금액 폰트**: 가독성을 위해 금액 및 코드 표기 시 `font-mono`, `font-semibold` 또는 `font-bold` 병행
- **폰트 스케일 가이드**:

| 용도 | Tailwind 클래스 | 폰트 크기 / 굵기 | 색상 가이드 |
| :--- | :--- | :--- | :--- |
| **대시보드 환영 타이틀** | `text-2xl` ~ `text-3xl` | 24~30px / 800 (Extrabold) | `text-gray-900` |
| **화면 타이틀 (Page Title)** | `text-2xl` | 24px / 700 (Bold) | `text-gray-800` |
| **섹션 / 카드 타이틀** | `text-xl` | 20px / 700 (Bold) | `text-gray-800` 또는 `text-purple-700` |
| **서브 헤더 / 모달 제목** | `text-lg` | 18px / 600 (Semibold) | `text-gray-800` |
| **본문 라벨 / 필드명** | `text-sm` | 14px / 600 (Semibold) | `text-gray-700` 또는 `text-gray-600` |
| **본문 데이터 / 테이블 셀** | `text-sm` | 14px / 400 (Normal) | `text-gray-700` ~ `text-gray-900` |
| **보조 설명 / 힌트 / 날짜** | `text-xs` | 12px / 400~500 | `text-gray-400` ~ `text-gray-500` |
| **테이블 헤더 / 배지 태그** | `text-xs` ~ `text-sm` | 11~14px / 700 (Bold) | 대문자/세미볼드 강조 |

---

### 2.2 컬러 시스템 (Color Palette)

#### 🟣 Primary & Brand Colors (시스템 기본/강조)
- **Primary Purple/Indigo**:
  - 메인 브랜드: `#6366f1` (`indigo-500`), `#4f46e5` (`indigo-600`), `#7e22ce` (`purple-700`)
  - 그라데이션 버튼: `bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700`
  - 테이블 헤더: `bg-purple-100 text-gray-700`
  - 테이블 행 호버: `hover:bg-purple-50 transition`
  - 선택된 행/탭: `bg-purple-200`, `border-b-4 border-purple-600 text-purple-700`

#### 🏷️ Status Colors (문서/결재 상태 칩)

| 상태명 | 배경색 (`bg`) | 텍스트색 (`text`) | 의미 및 용도 |
| :--- | :--- | :--- | :--- |
| **결재완료** / 승인 | `bg-emerald-100` (`#d1fae5`) | `text-emerald-800` (`#065f46`) | 모든 결재선 승인 완료 |
| **결재진행중** / 대기 | `bg-amber-100` (`#fef3c7`) | `text-amber-800` (`#92400e`) | 결재자 검토 진행 중 |
| **결재반려** / 거절 | `bg-red-100` (`#fee2e2`) | `text-red-800` (`#991b1b`) | 기안 반려/재작성 필요 |
| **작성중 / 임시저장** | `bg-indigo-100` (`#e0e7ff`) | `text-indigo-800` (`#3730a3`) | 결재 상신 전 기안 상태 |
| **재정부이관완료** | `bg-blue-100` (`#dbeafe`) | `text-blue-800` (`#1e40af`) | 재정부 전표 이관 완료 |

#### 📊 Financial & Semantic Colors (예산/재정 현황)
- **예산 총액 (Budget)**: `bg-blue-50 border-blue-200 text-blue-700` (신뢰/기준)
- **지출 총액 (Expense)**: `bg-red-50 border-red-200 text-red-600` (지출/차감)
- **잔액 (Remaining)**:
  - 정상(양수): `bg-green-50 border-green-200 text-green-600`
  - 초과(음수): `bg-red-100 border-red-400 text-red-600 font-bold` (경고)
- **성공 / 결재승인 액션**: `bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700`
- **반려 액션**: `bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700`

#### ⚪ Neutral & Background Colors
- **PC 대시보드/메인 배경**: `bg-gray-100` (`#f3f4f6`)
- **모바일/패널 서브 배경**: `bg-gray-50` (`#f9fafb`)
- **카드/컨테이너 배경**: `bg-white` (`#ffffff`)
- **사이드바 배경**: `bg-gray-800 text-white`
- **외곽선(Border)**: `border-gray-200` (기본), `border-gray-300` (인풋)

---

### 2.3 여백 및 라운딩 규격 (Spacing & Radius)
- **카드/패널 테두리 라운딩**:
  - 기본 박스/인풋: `rounded-lg` (8px)
  - 주요 카드/패널: `rounded-xl` (12px) 또는 `rounded-2xl` (16px)
  - 칩/버튼 필(Pill): `rounded-full` (9999px)
- **그림자 (Shadow)**:
  - 인풋/작은 카드: `shadow-sm`
  - 기본 패널/테이블: `shadow` 또는 `shadow-md`
  - 모달 팝업/최상위 카드: `shadow-2xl`
- **화면 패딩 (Page Padding)**:
  - PC: `p-6` (24px)
  - 모바일: `p-4` (16px)

---

## 3. 레이아웃 & 네비게이션 아키텍처

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App.vue                                   │
├──────────────┬─────────────────────────────────────────────────────────┤
│   Sidebar    │  Main Container (bg-gray-100 p-6)                       │
│  (w-64)      │  ┌───────────────────────────────────────────────────┐  │
│  bg-gray-800 │  │  [Page Title]              [HELP 말풍선 버튼]      │  │
│              │  ├───────────────────────────────────────────────────┤  │
│  • 메뉴 항목 │  │                                                   │  │
│    (아이콘+명)│  │                 <router-view />                   │  │
│  • 타이머     │  │                                                   │  │
│  • 사용자 정보 │  │                                                   │  │
│  • 로그아웃   │  └───────────────────────────────────────────────────┘  │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### 3.1 PC 레이아웃
1. **사이드바 (Desktop Sidebar)**:
   - 너비: 고정 `w-64` (256px), `bg-gray-800 text-white`
   - 상단: 사용자 권한(`userStore.access`) 기반 필터링된 메뉴 목록
     - 일반 메뉴: `hover:bg-gray-700 text-gray-300`
     - 활성 메뉴: `bg-indigo-600 text-white font-medium`
   - 하단 고정 영역:
     - ⏱ 자동 로그아웃 카운트다운 타이머 (`bg-yellow-100 text-yellow-800 rounded`)
     - 사용자 프로필 (이름, 사번, 역할, 부서명)
     - 로그아웃 버튼 (`text-red-400 hover:underline`)
2. **메인 영역 (Main Content Area)**:
   - 좌측 마진: `lg:ml-64`
   - 패딩: `p-6`
   - 상단 표준 헤더:
     - 좌측: `h1.text-2xl.font-bold.text-gray-800` (라우트 `meta.menuName` 바인딩)
     - 우측: `<HelpButton v-if="helpContent" :content="helpContent" />`

### 3.2 모바일 레이아웃 & 네비게이션
1. **플로팅 메뉴 탭 (Floating MENU Tab)**:
   - 모바일 환경(`lg:hidden`)에서는 화면 좌측에 드래그/고정 가능한 `MENU` 탭이 노출됩니다 (`Teleport to body`).
   - 탭 클릭 시 오버레이(`fixed inset-0 bg-black/50 z-30`)와 함께 좌측에서 드로어 슬라이드가 나타납니다.
2. **모바일 폼 하단 네비게이션**:
   - `ReportFormMobile` 등 다단계 마법사 폼의 경우, 화면 하단에 고정된 탭 바(`fixed bottom-0 left-0 right-0 bg-white border-t shadow-md`)를 배치하여 엄지손가락으로 손쉽게 탭 전환이 가능하도록 합니다.

### 3.3 화면 도움말 컴포넌트 (`HelpButton.vue`)
- 모든 업무 화면 상단 타이틀 옆에 배치
- 마우스 오버(PC) 또는 탭(모바일) 시 앰버 톤 말풍선 툴팁 오픈
- 규격 내용:
  - 📌 **화면 용도**: 해당 화면의 주 목적 요약
  - 📋 **사용 순서**: 1, 2, 3 단계별 업무 흐름
  - 📌 **참고**: 권한 또는 예외 사항 안내

---

## 4. 표준 화면 유형별 UI/UX 패턴 (Page Archetypes)

새로운 화면을 구성할 때는 아래 6가지 정형화된 아키타입(Archetype) 중 하나를 선택하여 구성합니다.

---

### 패턴 A. 대시보드 / 포탈 홈 (Portal Dashboard)
> **적용 사례**: `PortalHome.vue`, `PortalHomeMobile.vue`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Good Morning, 홍길동님.  [바로가기 버튼들: 지출결의서 작성 | 내결재목록] │
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │ 결재 대기 3건│ │ 진행중 5건   │ │ 완료 12건    │ │ 반려 1건     │   │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
├────────────────────────────────────┬───────────────────────────────────┤
│ [패널 1] 청구목록 조회     전체보기→│ [패널 2] 결재 대기 목록   전체보기→│
│ (미니 테이블)                      │ (미니 테이블)                     │
├────────────────────────────────────┼───────────────────────────────────┤
│ [패널 3] 공지사항          전체보기→│ [패널 4] 자유게시판       전체보기→│
│ (리스트 + New 칩)                  │ (리스트)                          │
└────────────────────────────────────┴───────────────────────────────────┘
```

- **헤더**: 시간대별 인사말(`Good morning/afternoon/evening`), 사용자 이름(`text-2xl font-black`), 오늘 날짜, 우측 둥근 숏컷 알약 버튼(`rounded-full border shadow-sm`)
- **KPI 스탯 행**: 4열 그리드 (`grid grid-cols-4 gap-4`), 하단 3px 컬러 액센트 바(`--accent`), 호버 시 `translateY(-2px)` 부유 효과
- **메인 패널**: 2×2 그리드 (`grid grid-cols-2 gap-5`), 좌측 상단 10px 원형 인디케이터 컬러 도트 + 타이틀 + 우측 `전체 보기 →` 링크

---

### 패턴 B. 단계별 마법사 / 입력 폼 (Step Wizard / Form)
> **적용 사례**: `ReportForm.vue` (기본정보 ➔ 지출내역 ➔ 파일첨부 ➔ 최종확인)

- **컨테이너**: `max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl p-6 md:p-8 border border-gray-200`
- **상단 탭 바 (PC)**:
  - 탭 항목이 균등 분할(`flex-1 py-3 text-center font-semibold`)
  - 활성 탭: `border-b-4 border-purple-600 text-purple-700`
  - 비활성/비허용 탭: `opacity-50 cursor-not-allowed`
- **폼 입력 그리드**:
  - 기본 2열 구성 (`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4`)
  - 라디오 옵션 선택 카드: 3열 균등 카드 형태 (`grid grid-cols-3 gap-4`), 선택 시 `bg-purple-100 border-purple-500 text-purple-700 font-bold`
- **인라인 실시간 요약 바**:
  - 예산 입력/선택 시 3단 현황 박스 노출: `예산 총액 (파랑) | 지출 총액 (빨강) | 잔액 (초록/초과 시 빨강)`
- **하단 네비게이션 버튼**:
  - 좌측: `← 이전` (회색 버튼 `bg-gray-400 hover:bg-gray-500`)
  - 우측: `다음 →` 또는 `📤 결재요청` (에메랄드 그라데이션)

---

### 패턴 C. 필터링 목록 및 조회 화면 (Filter & Table View)
> **적용 사례**: `ApprovalList.vue`, `ApprovalListPage.vue`

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ 검색 필터 바 ]                                                      │
│  부서: [전체  ▼]  유형: [전체  ▼]  상태: [전체  ▼]  기간: [   ] ~ [   ]    │
│  관: [전체  ▼]    항: [전체  ▼]    검색어: [           ]   [ 🔍 조회 ] │
├────────────────────────────────────────────────────────────────────────┤
│                                      청구 건수: 24건  |  합계금액: 3,500,000원 │
├────────────────────────────────────────────────────────────────────────┤
│ [ Data Table ]                                                         │
│  [📎] | 유형 | 부서명 | 관/항 | 청구일자 | 총액 | 진행상태 | 별칭 | 상세    │
│  --------------------------------------------------------------------  │
│  [📎] | 청구 | 유초등 | 교육비 | 2026-10-16 | 50,000 | [진행중] | 간식비 | 👁 ✏ 📋 🗑 │
├────────────────────────────────────────────────────────────────────────┤
│                         [ 1 ] [ 2 ] [ 3 ]                              │
└────────────────────────────────────────────────────────────────────────┘
```

1. **상단 검색 필터 바**:
   - `bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6`
   - 필드마다 상단 라벨(`text-sm font-semibold text-gray-600 mb-1`)과 컨트롤
   - 우측 끝 하단 정렬 조회 버튼: `bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg`
2. **목록 헤더 메타 요약 정보**:
   - 테이블 바로 위 우측 정렬: `청구 건수: 24건 | 합계금액: 3,500,000원` (`text-purple-700 font-bold`)
3. **데이터 테이블**:
   - 헤더: `bg-purple-100 text-gray-700 font-bold`
   - 행: `hover:bg-purple-50 transition text-sm`
   - 우측 액션 열: 4개 아이콘 버튼 (상세보기 `view.svg`, 수정 `edit.svg`, 복사 `copy.svg`, 삭제 `trash.svg`)
     - 권한/상태 미충족 시: `opacity-30 cursor-not-allowed` 처리
4. **모바일 변환 규칙 (`ApprovalListMobile.vue`)**:
   - 검색 필터: 아코디언 접기/펼치기 (`검색조건 ▼`)
   - 테이블 ➔ 카드 뷰 전환: 각 항목을 독립 카드(`bg-white rounded-lg shadow-md p-4 border`)로 렌더링

---

### 패턴 D. 마스터-디테일 분할 화면 (Split Master-Detail)
> **적용 사례**: `UserManagement.vue`, `DepartmentManagement.vue`

- **PC 레이아웃**: 좌우 1:1 분할 (`flex h-screen`)
  - **좌측 (Master)**: `w-1/2 border-r bg-gray-50 flex flex-col`
    - 상단 액션 바: `＋ 신규 등록` 에메랄드 버튼
    - 검색 필터 영역: 부서/역할/이름 + 보라색 `조회` 버튼
    - 목록 테이블: 클릭 가능한 행(`cursor-pointer hover:bg-purple-50`), 선택된 행은 `bg-purple-200 font-semibold`
  - **우측 (Detail)**: `w-1/2 p-6 bg-gray-50 overflow-y-auto`
    - 상단: `📋 상세 정보` 또는 `🆕 신규 등록` 모드 타이틀 (`text-2xl font-bold text-purple-700`)
    - 본문: 흰색 카드 폼 컨테이너 (`bg-white p-6 rounded-lg shadow`)
    - 하단: `저장`, `삭제`, `선택 해제` 버튼 그룹

---

### 패턴 E. 일괄 처리 및 전표 결재 (Bulk Action View)
> **적용 사례**: `BulkApprovalPage.vue`

- **구조**: 좌측 처리 대상 목록 (체크박스 다중 선택) + 우측 일괄 서명 및 승인 패널
- **다중 선택 헤더**:
  - `selectedIds.size + '건 선택'` 배지 태그
  - 전체선택 체크박스
- **우측 플로팅/고정 처리 패널**:
  - 선택된 건들의 총 합계 금액 표시
  - 일괄 전자서명 캔버스
  - 일괄 의견 텍스트박스
  - `일괄 승인완료` 대형 CTA 버튼

---

### 패턴 F. 계층형 트리 / 예산 현황 그리드 (Hierarchy Tree Grid)
> **적용 사례**: `DeptBudgetStatus.vue`, `AccountCategoriesGrid.vue`

- **계층 구분 스타일링 (관 · 항 · 목 · 세목)**:
  - `관` 행: `bg-blue-50 font-bold` (레벨 1)
  - `항` 행: `bg-white font-semibold` (레벨 2)
  - `목` 행: `bg-green-50` (레벨 3)
  - `세목` 행: `bg-white` (레벨 4)
- **들여쓰기(Indent)**: `getIndent(level)` 함수를 통해 텍스트 좌측 패딩 단계별 적용 (`pl-2`, `pl-6`, `pl-10`, `pl-14`)
- **금액 및 코드 컬럼**: 반드시 `text-right font-mono` 및 `toLocaleString()` 콤마 포맷 적용

---

## 5. 공통 UI 컴포넌트 표준 규격

### 5.1 폼 컨트롤 (Form Inputs)
```html
<!-- 텍스트 / 날짜 / 셀렉트 기본 인풋 스타일 -->
<input
  type="text"
  class="w-full border border-gray-300 p-2.5 sm:p-3 rounded-lg shadow-sm text-sm 
         focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition
         disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
/>
```
- **라벨(Label)**: `block text-sm font-semibold text-gray-700 mb-1`
- **필수 표시**: 필수 입력 필드는 라벨명 옆에 `text-red-500` 별표(`*`) 표기

### 5.2 버튼 시스템 (Button Variants)

| 버튼 종류 | 스타일 클래스 | 적용 예시 |
| :--- | :--- | :--- |
| **Primary CTA (제출/승인)** | `bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-md transition` | 결재요청, 승인, 등록 |
| **Primary Brand (등록/조회)** | `bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow transition` | 공지등록, 검색, 신규생성 |
| **Secondary (이전/취소)** | `bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2 rounded-lg transition` | 모달 취소, 닫기, 이전 |
| **Danger (반려/삭제)** | `bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium px-5 py-2 rounded-lg shadow transition` | 반려, 삭제 |
| **Table Action Icons** | `p-1.5 rounded-lg hover:bg-gray-100 transition (아이콘 크기: w-5 h-5 ~ w-6 h-6)` | 보기, 수정, 복사, 삭제 |

### 5.3 모달 및 팝업 (Modal Standards)
- **배경 오버레이**: `fixed inset-0 bg-black/40 flex items-center justify-center z-50`
- **모달 박스**: `bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fadeIn`
- **제목**: `text-xl font-bold text-gray-900 mb-4 flex items-center justify-between` + 우측 상단 `✕` 닫기 버튼
- **하단 액션**: 우측 정렬 `flex justify-end gap-3 mt-6` (취소 버튼 + 확인 버튼)

---

## 6. 전자서명 및 결재 프로세스 UX 규격

### 6.1 결재선 타임라인 시각화 (Approval Line Timeline)
- **구조**: 단계별 수직 타임라인 노드 (`w-2.5 h-2.5 rounded-full`)와 연결선(`w-0.5 h-6`)
- **상태 표현**:
  - 이미 승인되었거나 과거 단계: `opacity-30 grayscale`, 회색 노드(`bg-gray-400`), 연결선(`bg-gray-200`)
  - 현재 결재 순서 (Active): 강조 노드(`bg-indigo-500 ring-4 ring-indigo-100`), 진한 텍스트(`font-bold text-gray-900`)
  - 복수 결재자 허용 시: 결재자 사이에 `OR` 태그 배지(`text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm font-bold`) 표시
- **재정부 특별 규칙**: 기안자 부서가 재정부인 경우 결재선 대신 **'즉시 결재완료'** 에메랄드 뱃지 및 안내 문구 노출

### 6.2 서명 캔버스 (Signature Pad)
- **크기**: 폼 인라인 240×240px, 모달 팝업 가로 100% × 세로 160px
- **배경**: `bg-white` 또는 `bg-gray-50 border rounded-lg touch-none`
- **초기 로드**: 사용자의 기본 서명이 등록되어 있는 경우 서버 API(`/api/users/me/signature`)에서 가져와 캔버스에 자동 렌더링
- **지우기/재서명**: 우측 상단 `✕` 또는 `지우기` 버튼 클릭 시 캔버스 초기화 및 안내 텍스트 표시

---

## 7. 신규 화면 개발 체크리스트

새로운 뷰나 컴포넌트를 개발할 때 아래 항목을 필히 검토하십시오.

- [ ] **1. 기기 분기 검토**: 이 화면이 모바일에서 다단 테이블이나 복잡한 폼을 포함하는가?  
  ➔ 그렇다면 PC용(`View.vue`)과 모바일용(`mobile/ViewMobile.vue`)으로 분리 작성하고 `router/index.js`에서 `isMobile()` 분기를 적용했는가?
- [ ] **2. 폰트 클래스**: 최상위 루트 컨테이너에 `font-nanum`을 지정했는가?
- [ ] **3. 헤더 및 도움말**: `App.vue`의 `pageTitle` 및 `helpContent.js`에 화면 설명과 사용 순서 3단계를 등록했는가?
- [ ] **4. 브랜드 컬러 준수**: 헤더 테이블(`bg-purple-100`), 호버(`hover:bg-purple-50`), 주요 버튼 그라데이션(`purple/indigo` 또는 `emerald`) 규격을 따랐는가?
- [ ] **5. 상태 칩 색상 규격**: 결재완료(초록), 결재진행중(노랑/앰버), 결재반려(빨강), 작성중(연보라)을 표준 칩 클래스로 사용했는가?
- [ ] **6. 숫자 포맷**: 통화/금액 데이터에 `toLocaleString()` 및 `text-right font-mono`를 적용했는가?
- [ ] **7. 빈 데이터 처리 (Empty State)**: 데이터가 0건일 때 `데이터가 없습니다.` 안내 행/박스를 적절한 여백과 함께 배치했는가?
- [ ] **8. 로딩 및 피드백**: 저장/제출 등의 비동기 동작 시 버튼 비활성화(`disabled`)와 스피너(`animate-spin`)가 작동하는가?
- [ ] **9. 권한 제어**: `roleAccess` 및 `userStore`의 권한에 따라 비허용 기능이나 부서 선택이 올바르게 숨김/비활성화 처리되었는가?
