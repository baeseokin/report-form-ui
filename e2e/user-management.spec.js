// 화면 E2E: 사용자 관리 (관리자)
import { test, expect, startScenario, loginAs, query, isMobileView } from "./support/scenario.js";

/** 사용자 목록의 한 사람 — PC 는 표의 행, 모바일은 카드 (이름은 다른 행의 '부서+역할' 글자와 겹칠 수 있어 사용자 ID 로 찾음) */
const userItem = (page, userId) =>
  page.getByTestId(isMobileView(page) ? "user-card" : "user-row").filter({ hasText: new RegExp(`\\b${userId}\\b`) });

/** 부서로 사용자 조회 (모바일은 접힌 검색조건을 먼저 펼침) */
async function searchByDept(page, dept) {
  if (isMobileView(page)) await page.getByRole("button", { name: /^검색조건/ }).first().click();
  await page.getByTestId("user-filter-dept").selectOption({ label: dept });
  await page.getByTestId("user-search-btn").click();
}

test("9-1 관리자가 사용자 정보를 수정하면 저장된다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "9-1_사용자_정보_수정");

  await step("adm001 로그인 → 사용자 관리: 원천엔젤스 부서로 조회", async () => {
    await loginAs(page, "adm001");
    await page.goto("/userManagement");
    await searchByDept(page, "원천엔젤스");
    await expect(userItem(page, "ang001")).toBeVisible();
    await expect(userItem(page, "mus002")).toHaveCount(0);
  });

  await step("엔젤스회계 선택 → 사용자 상세 표시", async () => {
    await userItem(page, "ang001").click();
    await expect(page.getByTestId("user-name-input")).toHaveValue("엔젤스회계");
  });

  await step("핸드폰번호 010-9999-0001 로 변경 → 저장하기 → 완료 알림", async () => {
    await page.getByTestId("user-phone-input").fill("010-9999-0001");
    await page.getByTestId("user-save-btn").click();
    await expect.poll(() => dialogs.join("\n")).toMatch(/성공적으로 업데이트/);
  });

  const [u] = await query("SELECT phone FROM users WHERE user_id = 'ang001'");
  expect(u.phone).toBe("010-9999-0001");
});

test("9-2 비밀번호를 초기화하면 0000 으로 로그인하고 변경 요청 상태가 된다", async ({ page, playwright }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "9-2_비밀번호_초기화");

  await step("adm001 로그인 → 사용자 관리: 엔젤스회계 선택", async () => {
    await loginAs(page, "adm001");
    await page.goto("/userManagement");
    await userItem(page, "ang001").click();
    await expect(page.getByTestId("user-name-input")).toHaveValue("엔젤스회계");
  });

  await step("비밀번호 초기화 → 확인창 '확인' → 완료 알림", async () => {
    await page.getByTestId("user-reset-pw-btn").click();
    await expect.poll(() => dialogs.join("\n")).toMatch(/0000.*초기화하시겠습니까/);
    await expect.poll(() => dialogs.join("\n")).toMatch(/초기화되었습니다/);
  });

  const [u] = await query("SELECT require_password_change FROM users WHERE user_id = 'ang001'");
  expect(Number(u.require_password_change)).toBe(1);

  const ctx = await playwright.request.newContext({ baseURL: "http://localhost:5174" });
  try {
    const res = await ctx.post("/api/login", { data: { userId: "ang001", password: "0000" } });
    expect(res.ok(), await res.text()).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
});
