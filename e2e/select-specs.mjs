#!/usr/bin/env node
// 변경된 파일 목록 → 실행할 E2E spec 선택
//
// 사용: node e2e/select-specs.mjs [파일 ...]      (인자가 없으면 git 에 스테이징된 파일)
// 출력(JSON): { mode: "none" | "some" | "all", specs: [...], reasons: {...}, uncovered: [...] }
//   - none: 앱 동작과 무관한 변경 (문서 등) → E2E 불필요
//   - some: specs 에 나열된 spec 만 실행
//   - all : 설정·테스트 공통 코드 변경 → 전체 실행
//   - uncovered: 앱 소스인데 어떤 E2E 케이스도 불러온 적 없는 파일 (새 화면 · 테스트 없는 화면)
//
// src/ 파일 → spec 연결은 e2e/coverage-map.json 에서 구합니다. 이 파일은 E2E 를 실행할 때마다
// '각 테스트가 실제로 불러온 소스 파일'로 자동 갱신되므로 손으로 고치지 않습니다. (e2e/support/coverage.js)
import { execSync } from "child_process";
import fs from "fs";
import { filesToSpecs } from "./support/coverage.js";

const ALL_SPECS = fs.readdirSync(new URL(".", import.meta.url))
  .filter((f) => f.endsWith(".spec.js"))
  .sort()
  .map((f) => `e2e/${f}`);

// 테스트 실행 환경 · 공통 테스트 코드 → 전체 실행
const ALL_PATTERNS = [
  /^public\//,
  /^(index\.html|package\.json|package-lock\.json|vite\.config\.js|tailwind\.config\.js|postcss\.config\.js|playwright\.config\.js)$/,
  /^e2e\/(support\/|global-setup\.js|global-teardown\.js)/,
];

// 앱 동작과 무관 → 무시
const IGNORE_PATTERNS = [
  /\.md$/i,
  /^(docs|\.claude|\.agent|\.agents|\.githooks|ohzic-autofill-extension|재정부오직솔루션소스)\//,
  /^e2e\/(select-specs\.mjs|run-related\.sh|coverage-map\.json)$/,
  /^(Dockerfile|\.dockerignore|deploy\.sh|nginx\.conf|\.gitignore|.*\.code-workspace|dummy_receipt\.png)$/,
  /(^|\/)\.DS_Store$/,
];

function stagedFiles() {
  const out = execSync("git diff --cached --name-only --diff-filter=ACMRD", { encoding: "utf8" });
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function selectSpecs(files) {
  const coverage = filesToSpecs();
  const specs = new Set();
  const reasons = {};
  const uncovered = [];
  let all = false;

  const add = (spec, why) => {
    specs.add(spec);
    (reasons[spec] ||= []).push(why);
  };

  for (const f of files) {
    if (IGNORE_PATTERNS.some((re) => re.test(f))) continue;

    if (ALL_PATTERNS.some((re) => re.test(f))) {
      all = true;
      (reasons["*"] ||= []).push(f);
      continue;
    }
    if (/^e2e\/[\w-]+\.spec\.js$/.test(f)) {
      if (ALL_SPECS.includes(f)) add(f, f); // 삭제된 spec 은 실행할 것이 없음
      continue;
    }
    if (f.startsWith("src/")) {
      const hit = coverage.get(f);
      if (hit) for (const s of hit) if (ALL_SPECS.includes(s)) add(s, f);
      if (!hit) uncovered.push(f);
      continue;
    }
    // 분류되지 않은 그 밖의 파일은 안전하게 전체 실행
    all = true;
    (reasons["*"] ||= []).push(f);
  }

  if (all || (specs.size && specs.size === ALL_SPECS.length)) return { mode: "all", specs: ALL_SPECS, reasons, uncovered };
  if (specs.size === 0) return { mode: "none", specs: [], reasons, uncovered };
  return { mode: "some", specs: ALL_SPECS.filter((s) => specs.has(s)), reasons, uncovered };
}

// CLI
//   node e2e/select-specs.mjs [파일 ...]             report-form-ui 변경 기준
//   node e2e/select-specs.mjs --server [파일 ...]    report-server 변경 기준 (파일은 report-server 기준 경로)
//                                                    출력에 jest(서버 API 테스트 실행 필요 여부) 포함
if (import.meta.url === `file://${process.argv[1]}`) {
  let args = process.argv.slice(2);
  if (args[0] === "--server") {
    args = args.slice(1);
    const { selectServerSpecs } = await import("./support/server-impact.js");
    const serverDir = process.env.REPORT_SERVER_DIR || new URL("../../report-server", import.meta.url).pathname;
    const files = args.length
      ? args
      : execSync("git diff --cached --name-only --diff-filter=ACMRD", { cwd: serverDir, encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
    console.log(JSON.stringify(selectServerSpecs(files, serverDir, ALL_SPECS), null, 2));
  } else {
    const files = args.length ? args : stagedFiles();
    console.log(JSON.stringify(selectSpecs(files), null, 2));
  }
}
