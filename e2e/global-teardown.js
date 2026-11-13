// E2E 종료 후: 단계별 스크린샷을 한눈에 볼 수 있는 갤러리(e2e-screenshots/index.html) 생성
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mergeCoverage } from "./support/coverage.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../e2e-screenshots");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const caseKey = (name) => name.split(/[_~]/)[0].split(/[-·]/).map(Number);

export default async function globalTeardown() {
  mergeCoverage(); // 테스트별 불러온 소스 파일 → e2e/coverage-map.json
  if (!fs.existsSync(ROOT)) return;
  const cases = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      const ka = caseKey(a), kb = caseKey(b);
      return (ka[0] - kb[0]) || (ka[1] - kb[1]) || a.localeCompare(b);
    });

  const sections = cases.map((c) => {
    const shots = fs.readdirSync(path.join(ROOT, c)).filter((f) => f.endsWith(".png")).sort();
    const items = shots.map((f) => {
      const caption = f.replace(/\.png$/, "").replace(/^(\d+)_/, "$1. ").replace(/_/g, " ");
      const src = encodeURI(`${c}/${f}`);
      return `<figure><a href="${src}" target="_blank"><img loading="lazy" src="${src}"></a><figcaption>${esc(caption)}</figcaption></figure>`;
    }).join("\n");
    return `<section id="${esc(c)}"><h2>${esc(c.replace(/_/g, " "))} <small>${shots.length}단계</small></h2><div class="grid">${items}</div></section>`;
  }).join("\n");

  const toc = cases.map((c) => `<li><a href="#${esc(c)}">${esc(c.replace(/_/g, " "))}</a></li>`).join("");
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>E2E 단계별 스크린샷</title>
<style>
body{font-family:-apple-system,"Apple SD Gothic Neo",sans-serif;margin:0;padding:24px;background:#f3f4f6;color:#111827}
h1{margin:0 0 4px}p.meta{color:#6b7280;margin:0 0 16px}
ul.toc{columns:3;background:#fff;padding:12px 28px;border-radius:8px}
section{background:#fff;border-radius:10px;padding:16px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h2{margin:0 0 12px;font-size:18px}h2 small{color:#6b7280;font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
figure{margin:0}img{width:100%;border:1px solid #e5e7eb;border-radius:6px}
figcaption{font-size:13px;margin-top:4px;color:#374151}
</style></head><body>
<h1>E2E 단계별 스크린샷</h1><p class="meta">생성: ${new Date().toLocaleString("ko-KR")} · 케이스 ${cases.length}개 · 이미지를 클릭하면 원본 크기로 열립니다.</p>
<ul class="toc">${toc}</ul>
${sections}
</body></html>`;
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
  console.log(`🖼  스크린샷 갤러리: ${path.join(ROOT, "index.html")}`);
}
