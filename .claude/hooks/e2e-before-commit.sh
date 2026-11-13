#!/usr/bin/env bash
# Claude Code PreToolUse(Bash) 훅: Claude 가 git commit 하기 전에 관련 테스트 통과 여부를 확인합니다.
#   - report-form-ui 커밋: 관련 화면 E2E (PC · iPhone · Android)
#   - report-server  커밋: 서버 API 테스트(jest) + 바뀐 API 를 쓰는 화면 E2E
#   통과 기록이 지금 스테이징된 내용과 같거나 테스트와 무관한 변경이면 그대로 커밋, 아니면 차단(exit 2)하고 e2e 스킬로 안내.
# report-server 의 .claude/hooks/e2e-before-commit.sh 도 이 파일을 호출합니다.
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$(cd "$HOOK_DIR/../.." && pwd)"
SERVER_DIR="${REPORT_SERVER_DIR:-$(cd "$UI_DIR/../report-server" 2>/dev/null && pwd)}"

INPUT="$(cat)"
CMD="$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input?.command||"")}catch{console.log("")}})')"
CWD="$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).cwd||"")}catch{console.log("")}})')"

# git commit 이 아니면 관여하지 않음
if ! printf '%s' "$CMD" | grep -Eq '(^|[;&|(]|\s)git(\s+-C\s+\S+)?\s+commit(\s|$)'; then
  exit 0
fi

# 어느 저장소의 커밋인지: git -C <dir> > 명령 안의 마지막 cd <dir> > 현재 폴더
TARGET="$(printf '%s' "$CMD" | grep -Eo 'git\s+-C\s+("[^"]+"|\S+)\s+commit' | head -1 | sed -E 's/git[[:space:]]+-C[[:space:]]+//; s/[[:space:]]+commit$//; s/^"//; s/"$//')"
if [[ -z "$TARGET" ]]; then
  TARGET="$(printf '%s' "$CMD" | sed -E 's/git[[:space:]].*commit.*//' | grep -Eo '(^|[;&|(]|\s)cd\s+("[^"]+"|[^;&| ]+)' | tail -1 | sed -E 's/.*cd[[:space:]]+//; s/^"//; s/"$//')"
fi
BASE="${CWD:-${CLAUDE_PROJECT_DIR:-$(pwd)}}"
[[ -n "$TARGET" && "$TARGET" != /* ]] && TARGET="$BASE/$TARGET"
TARGET="${TARGET:-$BASE}"
TARGET="${TARGET/#\~/$HOME}"
TOP="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)"

if [[ "$TOP" == "$UI_DIR" ]]; then
  FLAG=""; NAME="report-form-ui"
elif [[ -n "$SERVER_DIR" && "$TOP" == "$SERVER_DIR" ]]; then
  FLAG="--server"; NAME="report-server"
else
  exit 0  # 테스트 연동 대상 저장소가 아님
fi

if printf '%s' "$CMD" | grep -Eq '\-\-no-verify|(\s)-n(\s|$)'; then
  echo "커밋 차단: --no-verify 로 테스트 검증을 건너뛸 수 없습니다. 사용자가 명시적으로 원하면 사용자에게 직접 실행하도록 안내하세요." >&2
  exit 2
fi
if printf '%s' "$CMD" | grep -Eq '\s(-[A-Za-z]*a[A-Za-z]*|--all)(\s|$)'; then
  echo "커밋 차단: git commit -a 는 쓰지 말고, 커밋할 파일을 git add 로 스테이징한 뒤 커밋하세요 (테스트는 스테이징된 내용을 기준으로 검증합니다)." >&2
  exit 2
fi

# shellcheck disable=SC2086
MSG="$("$UI_DIR/e2e/run-related.sh" $FLAG --check 2>&1)"
if [[ $? -eq 0 ]]; then
  exit 0
fi

cat >&2 <<EOF
커밋 차단 (${NAME}):
${MSG}
e2e 스킬(${UI_DIR}/.claude/skills/e2e/SKILL.md)의 절차를 따르세요:
 - 미검증 → ${UI_DIR}/e2e/run-related.sh ${FLAG} 로 실행, 실패하면 원인을 고치고 git add 후 재실행
 - 미커버 → 변경 내용에 맞는 케이스 초안을 사용자에게 제안하고, 사용자가 원하면 작성·실행 / 생략하면 --accept-uncovered
EOF
exit 2
