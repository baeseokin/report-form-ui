#!/usr/bin/env bash
# 스테이징된 변경과 관련된 테스트만 실행하고, 통과하면 기록을 남깁니다.
#   - report-form-ui 변경: 관련 화면 E2E 를 PC · iPhone · Android 에서 실행
#   - report-server 변경(--server): 서버 API 테스트(jest) 전체 + 바뀐 API 를 쓰는 화면 E2E 를 3개 환경에서 실행
#
#   e2e/run-related.sh [--server]                     관련 테스트 실행 → 통과 시 기록 (coverage-map.json 이 바뀌면 자동 스테이징)
#   e2e/run-related.sh [--server] --all               전체 실행 → 통과 시 기록
#   e2e/run-related.sh [--server] --check             실행하지 않고 커밋 가능 여부만 확인 (0: 가능, 1: 불가)
#   e2e/run-related.sh [--server] --accept-uncovered  'E2E 미커버' 파일을 테스트 없이 커밋하기로 결정했음을 기록 (사용자 확인 후에만)
#
# 커밋 가능 조건 (--check):
#   ① 관련 테스트가 없거나, 지금 스테이징된 내용으로 통과했고
#   ② E2E 미커버 파일이 없거나, 지금 스테이징된 내용에 대해 '테스트 없이 커밋'이 확인됨
#      (E2E_IGNORE_UNCOVERED=1 이면 ② 생략 — 사람이 직접 커밋하는 git pre-commit 훅에서 사용)
# 기록은 대상 저장소의 .git/e2e-pass, .git/e2e-accept-uncovered 에 '스테이징된 내용의 트리 해시'로 저장합니다.
set -uo pipefail

UI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${REPORT_SERVER_DIR:-$(cd "$UI_DIR/../report-server" 2>/dev/null && pwd)}"

SERVER=0
MODE_ARG=""
for a in "$@"; do
  case "$a" in
    --server) SERVER=1 ;;
    *) MODE_ARG="$a" ;;
  esac
done

if [[ $SERVER -eq 1 ]]; then
  [[ -d "$SERVER_DIR" ]] || { echo "❌ report-server 폴더를 찾을 수 없습니다 (REPORT_SERVER_DIR 로 지정 가능)"; exit 1; }
  REPO_DIR="$SERVER_DIR"; LABEL="report-server"
else
  REPO_DIR="$UI_DIR"; LABEL="report-form-ui"
fi
cd "$UI_DIR"

GIT_DIR="$(git -C "$REPO_DIR" rev-parse --absolute-git-dir)"
STAMP_TESTED="$GIT_DIR/e2e-pass"
STAMP_ACCEPT="$GIT_DIR/e2e-accept-uncovered"
TREE="$(git -C "$REPO_DIR" write-tree)"

json() { node -e "const j=JSON.parse(process.argv[1]);console.log($2)" "$1"; }
select_specs() { if [[ $SERVER -eq 1 ]]; then node e2e/select-specs.mjs --server "$@"; else node e2e/select-specs.mjs "$@"; fi; }

if [[ "$MODE_ARG" == "--all" ]]; then
  if [[ $SERVER -eq 1 ]]; then SEL="$(select_specs app.js)"; else SEL="$(select_specs package.json)"; fi  # 공통 파일을 넘겨 전체 선택
else
  SEL="$(select_specs)"
fi
MODE="$(json "$SEL" 'j.mode')"
SPECS="$(json "$SEL" 'j.specs.join(" ")')"
UNCOVERED="$(json "$SEL" 'j.uncovered.join("\n")')"
JEST="$(json "$SEL" 'j.jest ? 1 : 0')"
[[ "$MODE_ARG" == "--all" ]] && UNCOVERED=""
NEEDS_RUN=0
[[ "$MODE" != "none" || "$JEST" == "1" ]] && NEEDS_RUN=1

stamped() { [[ -f "$1" && "$(cat "$1")" == "$TREE" ]]; }

if [[ "$MODE_ARG" == "--check" ]]; then
  OK=0
  if [[ $NEEDS_RUN -eq 1 ]] && ! stamped "$STAMP_TESTED"; then
    WHAT=""
    [[ "$JEST" == "1" ]] && WHAT="서버 API 테스트"
    [[ "$MODE" != "none" ]] && WHAT="${WHAT:+$WHAT + }화면 E2E(${MODE}${SPECS:+: $SPECS})"
    echo "E2E 미검증: ${LABEL} 의 스테이징된 변경에 테스트 실행이 필요합니다 — ${WHAT}"
    OK=1
  fi
  if [[ -n "$UNCOVERED" && "${E2E_IGNORE_UNCOVERED:-}" != "1" ]] && ! stamped "$STAMP_ACCEPT"; then
    echo "E2E 미커버: 아래 파일을 다루는 화면 E2E 케이스가 없습니다. 케이스를 추가하거나, 사용자 확인 후 --accept-uncovered 로 넘어가세요."
    echo "$UNCOVERED" | sed 's/^/   - /'
    OK=1
  fi
  exit $OK
fi

if [[ "$MODE_ARG" == "--accept-uncovered" ]]; then
  echo "$TREE" > "$STAMP_ACCEPT"
  echo "✅ 미커버 파일을 테스트 없이 커밋하기로 기록했습니다 (${LABEL}):"
  echo "${UNCOVERED:-   (없음)}" | sed 's/^\([^ ]\)/   - \1/'
  exit 0
fi

if [[ -n "$UNCOVERED" ]]; then
  echo "⚠️  아래 파일은 이를 다루는 화면 E2E 케이스가 없습니다 (E2E 미커버):"
  echo "$UNCOVERED" | sed 's/^/   - /'
fi

if [[ $NEEDS_RUN -eq 0 ]]; then
  echo "✅ 실행할 관련 테스트가 없습니다."
  echo "$TREE" > "$STAMP_TESTED"
  exit 0
fi

# 테스트는 작업 폴더 기준으로 돌기 때문에, 앱 동작에 영향을 주는 파일이 스테이징 안 된 채 바뀌어 있으면
# '커밋될 코드'를 검증한 것이 아님 (문서 등 선택 규칙이 무시하는 파일은 제외)
UNSTAGED="$(git -C "$REPO_DIR" diff --name-only)"
if [[ -n "$UNSTAGED" ]]; then
  # shellcheck disable=SC2086
  DSEL="$(select_specs $UNSTAGED)"
  if [[ "$(json "$DSEL" 'j.mode!=="none"||j.uncovered.length||j.jest?"dirty":""')" == "dirty" ]]; then
    echo "❌ ${LABEL} 에 스테이징되지 않은 변경이 있어, 커밋될 코드와 테스트 대상이 다릅니다. git add 후 다시 실행하세요:"
    echo "$UNSTAGED" | sed 's/^/   - /'
    exit 3
  fi
fi

# 화면 E2E 는 상대 저장소의 '현재 작업 폴더'로 실행되므로, 그쪽에 커밋 안 된 코드 변경이 있으면 알림
OTHER_DIR="$SERVER_DIR"; OTHER="report-server"
[[ $SERVER -eq 1 ]] && { OTHER_DIR="$UI_DIR"; OTHER="report-form-ui"; }
if [[ "$MODE" != "none" && -d "$OTHER_DIR" ]]; then
  OTHER_DIRTY="$(git -C "$OTHER_DIR" status --porcelain -- . ':!*.md' 2>/dev/null | head -5)"
  [[ -n "$OTHER_DIRTY" ]] && echo "ℹ️  ${OTHER} 에 커밋되지 않은 변경이 있습니다. 화면 E2E 는 그 상태 그대로 실행됩니다."
fi

RC=0
if [[ "$JEST" == "1" ]]; then
  echo "▶ 서버 API 테스트 (report-server, jest)"
  (cd "$SERVER_DIR" && ./scripts/test-db.sh up >/dev/null && npm test --silent)
  RC=$?
  [[ $RC -ne 0 ]] && echo "❌ 서버 API 테스트 실패 — 위 jest 출력을 확인하세요 (자세한 서버 로그: DEBUG_TEST=1 npm test)"
fi

if [[ $RC -eq 0 && "$MODE" != "none" ]]; then
  if [[ "$MODE" == "all" ]]; then
    echo "▶ 화면 E2E 전체 실행 (PC · iPhone · Android)"
    npx playwright test
  else
    echo "▶ 관련 화면 E2E 실행 (PC · iPhone · Android): $SPECS"
    # shellcheck disable=SC2086
    npx playwright test $SPECS
  fi
  RC=$?
  [[ $RC -ne 0 ]] && echo "❌ 화면 E2E 실패 — e2e-results/ 의 error-context.md 와 스크린샷을 확인하세요."
fi

if [[ $RC -ne 0 ]]; then
  rm -f "$STAMP_TESTED"
  exit $RC
fi

# 실행 결과로 coverage-map.json 이 바뀌었으면 함께 커밋되도록 스테이징 (report-form-ui 커밋일 때만)
if [[ $SERVER -eq 0 ]]; then
  if ! git diff --quiet -- e2e/coverage-map.json 2>/dev/null || [[ -n "$(git ls-files --others --exclude-standard e2e/coverage-map.json)" ]]; then
    git add e2e/coverage-map.json
    TREE="$(git write-tree)"
    echo "🗺  변경된 e2e/coverage-map.json 을 스테이징했습니다."
  fi
elif ! git diff --quiet -- e2e/coverage-map.json 2>/dev/null; then
  echo "ℹ️  report-form-ui/e2e/coverage-map.json 이 갱신되었습니다. report-form-ui 쪽에서 따로 커밋하세요."
fi
echo "$TREE" > "$STAMP_TESTED"
echo "✅ 테스트 통과 (${LABEL})"
if [[ -n "$UNCOVERED" ]]; then
  FLAG=""; [[ $SERVER -eq 1 ]] && FLAG=" --server"
  echo "⚠️  E2E 미커버 파일이 남아 있습니다 — 케이스를 추가하거나, 테스트 없이 커밋하려면 사용자 확인 후: e2e/run-related.sh${FLAG} --accept-uncovered"
fi
exit 0
