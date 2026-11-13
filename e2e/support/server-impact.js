// report-server 변경 → 실행할 서버 API 테스트(jest) 여부와 화면 E2E spec 선택
//
//  ① routes/*.js 에서 각 라우트 파일이 정의한 API(메서드 + 경로)를 읽고 (app.js 의 prefix 포함)
//  ② routes/ · services/ 의 require 관계를 따라 '바뀐 파일의 영향을 받는 라우트 파일'을 구한 뒤
//  ③ e2e/coverage-map.json 에 기록된 '화면이 실제로 호출한 API' 와 맞춰 spec 을 고릅니다.
//  - 서버 공통 코드(app.js, lib/, db/, env.js, 테스트 시드 등) 변경 → 화면 E2E 전체
//  - 영향받는 API 를 호출하는 화면 테스트가 없으면 → uncovered (서버 API 테스트만으로 검증됨)
import fs from "fs";
import path from "path";
import { apiCallsBySpec } from "./coverage.js";

// 문서·배포·데이터 → 테스트 불필요
const IGNORE = [
  /\.md$/i,
  /^(docs|k8s|data|uploads|tools|\.githooks|\.claude)\//,
  /^(Dockerfile|\.dockerignore|deploy\.sh|run_server\.sh|stop_server\.sh|server\.log|\.gitignore|.*\.code-workspace)$/,
  /(^|\/)\.DS_Store$/,
];
// 서버 API 테스트(jest)에만 영향 → 화면 E2E 불필요
const JEST_ONLY = [/^tests\/[\w.-]+\.test\.js$/, /^tests\/(setupEnv|setupAfterEnv)\.js$/, /^jest\.config\.js$/];
// 서버 전체에 영향 → 화면 E2E 전체
const E2E_ALL = [
  /^(app|server|env)\.js$/,
  /^(lib|db)\//,
  /^package(-lock)?\.json$/,
  /^tests\/(e2e|helpers)\//,
  /^tests\/(testDbConfig|globalSetup)\.js$/,
  /^scripts\/test-db\.sh$/,
];

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "");

/** 라우트 파일 → [{ method, re, raw }] */
function routeEndpoints(serverDir) {
  const prefixes = {};
  const appSrc = read(path.join(serverDir, "app.js"));
  for (const m of appSrc.matchAll(/app\.use\(\s*["'`]([^"'`]+)["'`]\s*,\s*require\(\s*["'`]\.\/routes\/([\w.-]+?)(?:\.js)?["'`]\s*\)/g)) {
    prefixes[`routes/${m[2]}.js`] = m[1];
  }
  const out = {};
  const dir = path.join(serverDir, "routes");
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    const rel = `routes/${f}`;
    const prefix = prefixes[rel] || "";
    out[rel] = [];
    // router.get("/api/x", ...) 와 router.get(["/api/x", "/api/y"], ...) 두 형식 모두
    for (const m of read(path.join(dir, f)).matchAll(/router\.(get|post|put|patch|delete|all)\(\s*(\[[^\]]*\]|["'`][^"'`]+["'`])/g)) {
      const method = m[1].toUpperCase();
      for (const lit of m[2].matchAll(/["'`]([^"'`]+)["'`]/g)) {
        const raw = (prefix + lit[1]).replace(/\/+$/, "") || "/";
        const re = new RegExp(
          "^" + raw.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\\\?/g, "?").replace(/:(\w+)\??/g, "[^/]+").replace(/\*/g, ".*") + "/?$"
        );
        out[rel].push({ method, re, raw: `${method} ${raw}` });
      }
    }
  }
  return out;
}

/** routes/ · services/ 파일의 require 관계 → 바뀐 파일에 (간접적으로) 의존하는 라우트 파일 */
function dependentRoutes(serverDir, changed) {
  const files = ["routes", "services"].flatMap((d) =>
    fs.existsSync(path.join(serverDir, d)) ? fs.readdirSync(path.join(serverDir, d)).filter((f) => f.endsWith(".js")).map((f) => `${d}/${f}`) : []
  );
  const deps = {};
  for (const f of files) {
    deps[f] = [];
    for (const m of read(path.join(serverDir, f)).matchAll(/require\(\s*["'`](\.{1,2}\/[^"'`]+)["'`]\s*\)/g)) {
      let t = path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]));
      if (!t.endsWith(".js")) t += ".js";
      deps[f].push(t);
    }
  }
  const hit = new Set([changed]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of files) if (!hit.has(f) && deps[f].some((d) => hit.has(d))) { hit.add(f); grew = true; }
  }
  return [...hit].filter((f) => f.startsWith("routes/"));
}

export function selectServerSpecs(files, serverDir, allSpecs) {
  const calls = apiCallsBySpec();
  const endpoints = routeEndpoints(serverDir);
  const specs = new Set();
  const reasons = {};
  const uncovered = [];
  let jest = false;
  let all = false;

  const add = (spec, why) => {
    specs.add(spec);
    (reasons[spec] ||= []).push(why);
  };

  for (const f of files) {
    if (IGNORE.some((re) => re.test(f))) continue;
    jest = true;
    if (JEST_ONLY.some((re) => re.test(f))) continue;
    if (E2E_ALL.some((re) => re.test(f))) {
      all = true;
      (reasons["*"] ||= []).push(`report-server/${f}`);
      continue;
    }
    if (/^(routes|services)\/[\w.-]+\.js$/.test(f)) {
      let found = false;
      for (const r of dependentRoutes(serverDir, f)) {
        for (const ep of endpoints[r] || []) {
          for (const [spec, apis] of calls) {
            if (!allSpecs.includes(spec)) continue;
            for (const a of apis) {
              const [method, p] = a.split(" ");
              if (method === ep.method && ep.re.test(p)) {
                add(spec, `report-server/${f} → ${ep.raw}`);
                found = true;
                break;
              }
            }
          }
        }
      }
      if (!found) uncovered.push(`report-server/${f}`);
      continue;
    }
    // 분류되지 않은 그 밖의 파일은 안전하게 전체 실행
    all = true;
    (reasons["*"] ||= []).push(`report-server/${f}`);
  }

  // 같은 spec 에 같은 이유가 여러 번 쌓이지 않게 정리
  for (const k of Object.keys(reasons)) reasons[k] = [...new Set(reasons[k])];

  if (all || (specs.size && specs.size === allSpecs.length)) return { mode: "all", specs: allSpecs, reasons, uncovered, jest };
  if (specs.size === 0) return { mode: "none", specs: [], reasons, uncovered, jest };
  return { mode: "some", specs: allSpecs.filter((s) => specs.has(s)), reasons, uncovered, jest };
}
