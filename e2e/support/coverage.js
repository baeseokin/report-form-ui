// 테스트별 '실제로 불러온 화면 소스 파일'과 '호출한 서버 API' 기록 → e2e/coverage-map.json
//
// 개발 서버(Vite)는 src/ 아래 파일을 하나씩 따로 보내므로, 각 테스트가 요청한 /src/... 주소를 모으면
// 그 테스트가 어떤 화면 코드를 실행했는지 알 수 있습니다. (모바일 프로젝트에서는 모바일 컴포넌트가 잡힘)
// 같은 방식으로 화면이 호출한 /api/... 요청을 모아, report-server 코드가 바뀌었을 때 영향을 받는 케이스를 고릅니다.
// (사전 데이터 준비용 API 호출(prepareClaim 등)은 화면이 부른 것이 아니므로 기록하지 않음)
//
//  - recordLoadedSources(): 테스트 1개 동안의 요청을 모아, 통과하면 임시 폴더에 저장 (자동 fixture 에서 호출)
//  - mergeCoverage():       실행이 끝나면(global-teardown) 임시 결과를 coverage-map.json 에 합침
//                           실행된 테스트의 항목만 교체하고, 실행 안 된 테스트 항목은 그대로 둠.
//                           spec 파일이나 테스트가 없어진 항목은 정리.
//  - filesToSpecs() / apiCallsBySpec(): select-specs.mjs 에서 사용
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const E2E_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(E2E_DIR, "..");
export const MAP_FILE = path.join(E2E_DIR, "coverage-map.json");
export const TMP_DIR = path.join(ROOT, "e2e-coverage-tmp");

/** 테스트 키: "<spec 경로>::<테스트 제목>::<프로젝트>" */
function testKey(testInfo) {
  const spec = path.relative(ROOT, testInfo.file).split(path.sep).join("/");
  return `${spec}::${testInfo.title}::${testInfo.project.name}`;
}

/** "/api/approval/detail/12" → "/api/approval/detail/:n" (실행마다 달라지는 숫자 id 를 묶어 기록 변화를 줄임) */
const normalizeApi = (p) => p.replace(/\/\d+(?=\/|$)/g, "/:n");

export async function recordLoadedSources(page, testInfo, use) {
  const src = new Set();
  const api = new Set();
  page.on("request", (req) => {
    try {
      const { pathname } = new URL(req.url());
      if (pathname.startsWith("/src/")) src.add(decodeURIComponent(pathname.slice(1)));
      else if (pathname.startsWith("/api/")) api.add(`${req.method()} ${normalizeApi(decodeURIComponent(pathname))}`);
    } catch {}
  });
  await use();
  if (testInfo.status !== testInfo.expectedStatus || src.size === 0) return; // 실패한 테스트는 기록하지 않음
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const key = testKey(testInfo);
  const name = crypto.createHash("sha1").update(key).digest("hex") + ".json";
  fs.writeFileSync(path.join(TMP_DIR, name), JSON.stringify({ key, src: [...src].sort(), api: [...api].sort() }));
}

export function loadCoverageMap() {
  try {
    return JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
  } catch {
    return { tests: {} };
  }
}

const entries = (map) =>
  Object.entries(map.tests || {}).map(([key, v]) => ({
    spec: key.split("::")[0],
    src: Array.isArray(v) ? v : v.src || [],
    api: Array.isArray(v) ? [] : v.api || [],
  }));

/** 화면 소스 파일 → 그 파일을 불러온 spec 목록 */
export function filesToSpecs(map = loadCoverageMap()) {
  const out = new Map();
  for (const { spec, src } of entries(map)) {
    for (const f of src) {
      if (!out.has(f)) out.set(f, new Set());
      out.get(f).add(spec);
    }
  }
  return out;
}

/** spec → 그 spec 의 테스트들이 화면에서 호출한 API ("METHOD /api/path") 목록 */
export function apiCallsBySpec(map = loadCoverageMap()) {
  const out = new Map();
  for (const { spec, api } of entries(map)) {
    if (!out.has(spec)) out.set(spec, new Set());
    for (const a of api) out.get(spec).add(a);
  }
  return out;
}

export function mergeCoverage() {
  if (!fs.existsSync(TMP_DIR)) return;
  const map = loadCoverageMap();
  const before = JSON.stringify(map);
  map.tests ||= {};

  let recorded = 0;
  for (const f of fs.readdirSync(TMP_DIR)) {
    if (!f.endsWith(".json")) continue;
    const { key, src, api } = JSON.parse(fs.readFileSync(path.join(TMP_DIR, f), "utf8"));
    map.tests[key] = { src, api };
    recorded++;
  }
  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  // 없어진 spec / 제목이 바뀌거나 삭제된 테스트 정리
  const sources = {};
  for (const key of Object.keys(map.tests)) {
    const [spec, title] = key.split("::");
    const abs = path.join(ROOT, spec);
    if (!(spec in sources)) sources[spec] = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
    if (sources[spec] === null || !sources[spec].includes(title)) delete map.tests[key];
  }

  const sorted = { tests: Object.fromEntries(Object.entries(map.tests).sort(([a], [b]) => a.localeCompare(b))) };
  const after = JSON.stringify(sorted);
  if (after !== before) {
    fs.writeFileSync(MAP_FILE, JSON.stringify(sorted, null, 2) + "\n");
    console.log(`🗺  coverage-map.json 갱신 (이번 실행 ${recorded}개 테스트 반영, 전체 ${Object.keys(sorted.tests).length}개)`);
  }
}
