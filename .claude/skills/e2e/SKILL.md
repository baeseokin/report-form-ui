---
name: e2e
description: report-form-ui · report-server 변경을 커밋하기 전에 관련 테스트(화면 E2E 는 PC · iPhone · Android, 서버는 API 테스트 포함)를 실행하고, 실패하면 원인을 분석·수정해 다시 통과시키며, 테스트가 없는 변경에는 케이스를 제안·작성한다. git commit 이 'E2E 미검증/미커버'로 차단됐을 때, 사용자가 테스트 실행·실패 분석·케이스 작성을 요청할 때 사용한다.
---

# E2E 테스트 실행 · 수정 · 케이스 작성

설명과 보고는 모두 한국어로 한다.

## 언제 쓰나
- `git commit` 이 "커밋 차단: E2E 미검증 / E2E 미커버" 로 막혔을 때 (훅 `.claude/hooks/e2e-before-commit.sh`, report-form-ui · report-server 커밋 모두)
- 사용자가 "/e2e", "테스트 돌려줘", "E2E 실패 고쳐줘", "테스트 케이스 추가해줘" 등을 요청할 때
- `e2e/*.spec.js` 케이스를 추가·수정할 때

## 구성 요소
| 파일 | 역할 |
|---|---|
| `e2e/coverage-map.json` | **자동 생성.** 테스트별로 실제로 불러온 `src/` 파일 목록. E2E 를 실행할 때마다 갱신된다 (`e2e/support/coverage.js`). 손으로 고치지 않는다 |
| `e2e/select-specs.mjs` | 스테이징된 파일 → 실행할 spec 선택 (coverage-map 기반). 어떤 테스트도 불러온 적 없는 src 파일은 `uncovered` |
| `e2e/run-related.sh` | 관련 spec 을 3개 환경에서 실행, 통과 시 기록·coverage-map 자동 스테이징. `--check` 확인만, `--all` 전체, `--accept-uncovered` 미커버를 테스트 없이 커밋하기로 기록 |
| `.claude/hooks/e2e-before-commit.sh` | Claude 의 `git commit` 전에 `--check`. 미검증이거나 미커버가 확인되지 않았으면 차단 |
| `.githooks/pre-commit` | 사람이 커밋할 때 관련 E2E 실행 (미커버는 경고만, 자동 수정 없음) |
| `e2e/support/server-impact.js` | report-server 변경 → 서버 API 테스트 필요 여부 + 바뀐 API 를 화면에서 호출하는 spec 선택 (`select-specs.mjs --server`) |
| `../report-server/.githooks/pre-commit` | 사람이 서버를 커밋할 때 `run-related.sh --server` 실행 (미커버는 경고만) |
| `e2e/README.md` | 실행 구조, 헬퍼 목록, 케이스 목록 (사람용 설명서) |

## report-server 커밋일 때 (`--server`)
모든 명령에 `--server` 를 붙인다: `e2e/run-related.sh --server`, `--server --check`, `--server --accept-uncovered`, `node e2e/select-specs.mjs --server`.
- 실행 내용: ① 서버 API 테스트(jest) 전체(약 5초) → ② 바뀐 라우트·서비스의 API 를 화면에서 실제로 호출하는 E2E 케이스만 3개 환경에서
  - `app.js`, `lib/`, `db/`, `env.js`, 테스트 시드(`tests/e2e`, `tests/helpers`) 변경 → 화면 E2E 전체
  - `tests/*.test.js` 만 바뀜 → 서버 API 테스트만
- 스테이징 · 커밋은 `git -C ../report-server ...` 또는 `cd ../report-server && ...` 로 한다 (훅이 어느 저장소 커밋인지 판단함).
- 서버 API 테스트 실패: jest 출력 확인, 서버 로그는 `cd ../report-server && DEBUG_TEST=1 npm test`. 단계 설명은 `../report-server/tests/TEST_CASES.md`.
- 미커버(화면 E2E 가 호출하지 않는 API 변경) 케이스 제안 시 위치를 구분한다:
  - API 규칙·권한·DB 상태 → `../report-server/tests/*.test.js` (+ `TEST_CASES.md`)
  - 화면에서 하는 사용자 동작 → `e2e/*.spec.js`
- 화면 E2E 실행으로 `e2e/coverage-map.json` 이 바뀌면 report-form-ui 쪽에서 따로 커밋한다.

## 절차

### 1. 준비
- 커밋할 변경을 모두 `git add` 한다. **`git commit -a` 는 쓰지 않는다** (훅이 막음). 앱 동작에 영향을 주는 파일에 스테이징 안 된 변경이 있으면 `run-related.sh` 가 거부한다(exit 3).
- 필요 조건: Docker 실행 중(테스트 DB), `../report-server` 존재, WebKit 설치(`npx playwright install webkit`).

### 2. 대상 확인
```bash
node e2e/select-specs.mjs        # mode, 실행할 specs, 이유(reasons), 미커버 파일(uncovered)
git diff --cached                # 무엇이 바뀌었는지
```

### 3. 테스트 공백 검토 → 케이스 제안 (반자동)
아래 두 경우에는 **실행 전에 사용자에게 케이스 추가를 제안**한다.
- **미커버 파일**(`uncovered`)이 있을 때: 새 화면이거나 테스트가 없는 화면의 변경
- **테스트가 있는 화면에 새 기능이 추가**됐을 때: diff 에 새 버튼·입력칸·분기·API 호출 등 사용자가 하는 새 동작이 있는데, 기존 케이스가 그 동작을 실행하지 않는 경우 (스타일·문구·리팩터링만 바뀐 경우는 제외)

제안 형식 (사용자가 바로 판단할 수 있게 짧게):
- 대상 화면/기능과, 그 화면의 PC·모바일 컴포넌트 파일
- 케이스 초안: 번호(TEST_CASES.md 체계에 맞춤) · 제목 · 사용자 · 단계 · 기대 결과(화면 표시, DB 상태)
- 질문: "이 케이스를 추가할까요? (추가 / 수정해서 추가 / 이번엔 생략)"

사용자 답에 따라:
- **추가**: "케이스 작성 규칙"대로 PC · iPhone · Android 에서 통과하도록 작성 → `git add` → 4단계로 실행. 실행하면 coverage-map 이 갱신되어 해당 파일이 더 이상 미커버가 아니게 된다.
- **생략**: 미커버 파일만 있었다면 `e2e/run-related.sh --accept-uncovered` 로 기록한다. **사용자 확인 없이 이 명령을 쓰지 않는다.**
- 의존 데이터(시드)가 부족하면 `../report-server/tests/e2e/seed.js` 를 확인하고, 시드 변경이 필요하면 사용자에게 알린다 (다른 저장소).

### 4. 실행
```bash
e2e/run-related.sh               # 관련 spec × PC · iPhone · Android (spec 1개 ≈ 0.5~2분, 전체 ≈ 6분)
```
- Bash 타임아웃은 넉넉히 (`timeout: 600000`).

### 5. 실패 분석 (실패한 케이스마다)
1. 실패 위치와 메시지: `npx playwright test <spec> --project=<환경> -g "<케이스번호>" --reporter=line`
2. `e2e-results/<케이스>-<환경>/error-context.md` (실패 시점 화면 구조), `e2e-screenshots/<케이스>~<환경>/` 마지막 스크린샷을 Read 로 확인
3. 알림창 문구가 필요하면 `startScenario` 의 `dialogs` 확인 (브라우저 alert/confirm 은 자동으로 '확인' 처리되어 화면에 안 보임)
4. **PC 와 모바일 중 한쪽만 실패**하면 `src/components/X.vue` 와 `src/components/mobile/XMobile.vue` 의 로직·문구·testid 를 비교
5. 판정:
   - **테스트 문제**: 셀렉터가 다른 환경의 요소를 잡음, 타이밍, 이번 변경으로 의도적으로 바뀐 문구·구조 → 테스트를 고친다
   - **앱 버그**: 서버 규칙(`../report-server/routes`)·PC 동작과 다르거나 사용자에게 실제로 문제가 되는 동작 → 앱을 고친다
   - **판단 불가**: 이번 변경이 의도한 동작 변경인지 버그인지 모르겠으면 **멈추고 사용자에게 묻는다**

### 6. 수정 → 재실행 (최대 3회)
- 고친 파일을 `git add` 하고 `e2e/run-related.sh` 를 다시 실행한다. 선택 범위가 넓어질 수 있다 (예: `e2e/support` 를 고치면 전체).
- 3회 안에 통과하지 못하면 중단하고 남은 실패와 원인 추정을 보고한다.

### 7. 커밋 · 보고
- `e2e/run-related.sh --check` 가 0 이면 커밋한다. 변경된 `e2e/coverage-map.json` 은 자동 스테이징되어 함께 커밋된다.
- 보고 형식:
  - 실행 대상 spec 과 선택 이유, 환경별 통과/실패 수
  - 고친 내용을 **테스트 수정** / **앱 버그 수정** / **케이스 추가** 로 나눠서 (앱 수정은 파일:줄과 원인)
  - 미커버로 남긴 파일 (사용자가 생략을 선택한 경우)
  - 스크린샷 갤러리: `npm run test:e2e:shots`

## 금지 사항
- 테스트를 약하게 만들어 통과시키지 않는다: assertion 삭제·완화, `test.skip`/`fixme`, 의미 없는 `waitForTimeout`, 타임아웃만 늘리기
- `--no-verify`, `.git/e2e-pass`·`.git/e2e-accept-uncovered` 직접 작성, `git commit -a`, 사용자 확인 없는 `--accept-uncovered` 로 검증을 우회하지 않는다
- `e2e/coverage-map.json` 을 손으로 편집하지 않는다 (테스트를 실행해서 갱신)
- 특정 환경만 통과시키려고 `projects` 에 `grep`/`grepInvert` 를 넣지 않는다 (모든 케이스는 3개 환경 모두 통과해야 함)
- 의도된 동작 변경일 수 있는 앱 코드를 임의로 되돌리지 않는다 → 사용자에게 확인

## 케이스 작성 규칙
- 모든 테스트는 `./support/scenario.js` 의 `test` 를 import 한다 (커버리지 기록 fixture 가 여기 붙어 있음). `@playwright/test` 에서 직접 import 하지 않는다.
- 모든 케이스는 PC · iPhone · Android 에서 통과해야 한다. 화면 차이는 헬퍼로 흡수한다:
  - `isMobileView(page)`, `openSidebar(page)`, `expectNotice(page, dialogs, 문구)` — `e2e/support/scenario.js`
  - `claimRow(page, 별칭)`, `claimStatus(page, 상태)`, `submitClaim`, `decide` — `e2e/support/flows.js`
  - 예산편성서는 `budget-plan.spec.js` 의 `ui` 객체, 가청구건은 `hangRow()`
- 요소는 `data-testid` 를 우선 사용. PC·모바일 컴포넌트에 같은 testid 를 붙이면 분기 없이 공통으로 쓸 수 있다 (testid 추가는 앱 동작 변경이 아님).
- PC 용·모바일 용 버튼이 둘 다 DOM 에 있으면 `.filter({ visible: true })` 로 보이는 것만 고른다.
- 모바일은 PC 의 자체 알림 상자 대신 브라우저 기본 alert/confirm 을 쓰는 화면이 많다 → `expectNotice` 사용.
- 케이스마다 `startScenario(page, testInfo, "<번호>_<이름>")` 로 시작하고 `step()` 으로 단계별 스크린샷을 남긴다.
- 새 케이스를 추가하면 `e2e/README.md` 의 케이스 목록도 고친다. spec ↔ 소스 연결은 coverage-map 이 자동으로 처리한다.
