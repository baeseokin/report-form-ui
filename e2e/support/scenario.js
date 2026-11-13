// E2E 공통 도구
//   - step(): 단계를 실행하고 끝난 화면을 스크린샷으로 저장 (e2e-screenshots/<케이스>/<번호>_<단계>.png)
//   - loginAs(): 실제 로그인 화면에서 부서 → 역할 → 사용자 → 비밀번호 입력
//   - 브라우저 alert/confirm 은 자동으로 '확인'을 누르고, 그 문구를 스크린샷 상단에 표시
import { test as base, expect } from "@playwright/test";
import { recordLoadedSources } from "./coverage.js";
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { SERVER_DIR } from "../../playwright.config.js";

const require = createRequire(import.meta.url);
const seed = require(path.join(SERVER_DIR, "tests/e2e/seed.js"));
export const { query, YEAR } = seed;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SHOT_ROOT = path.resolve(__dirname, "../../e2e-screenshots");

// 테스트 사용자 (비밀번호는 모두 pw) — report-server/tests/helpers/fixtures.js 와 동일
export const USERS = {
  ang001: { name: "엔젤스회계", dept: "원천엔젤스", role: "회계" },
  out001: { name: "결재선미등록", dept: "원천엔젤스", role: "회계" },
  mus002: { name: "음악부장", dept: "음악부", role: "부장" },
  mus003: { name: "음악위원장", dept: "음악부", role: "위원장" },
  you001: { name: "청년회계", dept: "청년부", role: "회계" },
  gap001: { name: "공백회계", dept: "공백부", role: "회계" },
  gap005: { name: "공백부장", dept: "공백부", role: "부장" },
  noc001: { name: "위원장없음회계", dept: "위원장없음부", role: "회계" },
  fin001: { name: "재정담당", dept: "재정부", role: "재정부" },
  adm001: { name: "관리자", dept: "교회", role: "관리자" },
};

/** 시나리오 시작: DB 초기화 + 스크린샷 폴더 준비. 반환된 step() 으로 단계를 기록한다. */
export async function startScenario(page, testInfo, caseId) {
  await seed.seedForE2E();
  // 모바일 프로젝트는 '<케이스>~iphone' 처럼 별도 폴더에 저장 (데스크톱 결과를 덮어쓰지 않도록)
  const project = testInfo.project.name;
  const dir = path.join(SHOT_ROOT, project === "desktop" ? caseId : `${caseId}~${project}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const dialogs = [];
  page.on("dialog", async (d) => {
    dialogs.push(d.message());
    await d.accept();
  });

  let n = 0;
  async function step(title, fn) {
    await test.step(title, async () => {
      dialogs.length = 0;
      await fn();
      await page.waitForLoadState("networkidle").catch(() => {});
      n += 1;
      const file = path.join(dir, `${String(n).padStart(2, "0")}_${slug(title)}.png`);
      await showBanner(page, title, dialogs);
      await page.screenshot({ path: file, fullPage: true });
      await hideBanner(page);
      await testInfo.attach(`${n}. ${title}`, { path: file, contentType: "image/png" });
    });
  }
  return { step, dialogs };
}

/** 실제 로그인 화면으로 로그인 (이전 세션은 로그아웃) */
export async function loginAs(page, userId) {
  const u = USERS[userId];
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByTestId("login-dept-trigger").click();
  await page.locator(".divide-y > div").filter({ has: page.getByText(u.dept, { exact: true }) }).first().click();
  await page.getByTestId("login-role-select").selectOption({ label: u.role });
  await page.getByTestId("login-user-select").selectOption(userId);
  await page.getByTestId("login-password-input").fill("pw");
  await page.getByTestId("login-submit-button").click();
  await page.waitForURL("**/portal");
}

// 스크린샷 상단에 '단계명 · 로그인 사용자 · 알림창 문구' 표시
async function showBanner(page, title, dialogs) {
  await page.evaluate(({ title, dialogs }) => {
    const el = document.createElement("div");
    el.id = "__e2e_banner";
    el.style.cssText = "position:fixed;top:8px;left:8px;width:240px;z-index:2147483647;background:rgba(17,24,39,.94);color:#fff;font:600 13px/1.45 sans-serif;padding:8px 10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3);";
    el.textContent = "▶ " + title;
    for (const msg of dialogs) {
      const d = document.createElement("div");
      d.style.cssText = "margin-top:4px;color:#fde68a;font-weight:500;";
      d.textContent = "💬 알림창: " + msg;
      el.appendChild(d);
    }
    document.body.appendChild(el);
  }, { title, dialogs: [...dialogs] }).catch(() => {});
}
async function hideBanner(page) {
  await page.evaluate(() => document.getElementById("__e2e_banner")?.remove()).catch(() => {});
}

function slug(s) {
  return s.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_").slice(0, 60);
}

/** 모바일 화면으로 실행 중인지 (앱의 모바일 전환 기준: 폭 1024px 미만) */
export function isMobileView(page) {
  return page.viewportSize().width < 1024;
}

/**
 * 안내 문구 확인. PC 는 화면 안의 자체 알림 상자, 모바일은 브라우저 기본 알림창(alert/confirm)으로 같은 문구를 띄운다.
 * (브라우저 알림창은 자동으로 '확인'이 눌리고 dialogs 에 문구가 쌓인다)
 */
export async function expectNotice(page, dialogs, text) {
  if (isMobileView(page)) await expect.poll(() => dialogs.join("\n")).toMatch(text);
  else await expect(page.getByText(text)).toBeVisible();
}

/** 모바일 화면(폭 1024px 미만)이면 접혀 있는 사이드바를 MENU 탭으로 연다. PC 에서는 아무것도 하지 않는다. */
export async function openSidebar(page) {
  const menuTab = page.locator(".mobile-menu-tab__btn");
  if (await menuTab.isVisible()) {
    await menuTab.click();
    await page.waitForTimeout(300); // 사이드바 슬라이드 애니메이션
  }
}

/** 서명 캔버스에 서명 그리기 */
export async function drawSignature(page, canvas) {
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  const x = box.x + box.width * 0.2, y = box.y + box.height * 0.6;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(x + i * box.width * 0.05, y - Math.sin(i / 2) * box.height * 0.25, { steps: 2 });
  }
  await page.mouse.up();
}

// 모든 테스트에 자동 적용: 테스트가 불러온 소스 파일을 기록 (e2e/coverage-map.json → 커밋 시 관련 케이스 선택에 사용)
export const test = base.extend({
  _sourceCoverage: [async ({ page }, use, testInfo) => recordLoadedSources(page, testInfo, use), { auto: true }],
});

export { expect };
