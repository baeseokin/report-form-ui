// 화면 E2E: 로그인 · 로그아웃 (TEST_CASES.md 6장과 대응)
import { test, expect, startScenario, USERS, openSidebar } from "./support/scenario.js";

async function fillLogin(page, userId, password) {
  const u = USERS[userId];
  await page.goto("/login");
  await page.getByTestId("login-dept-trigger").click();
  await page.locator(".divide-y > div").filter({ has: page.getByText(u.dept, { exact: true }) }).first().click();
  await page.getByTestId("login-role-select").selectOption({ label: u.role });
  await page.getByTestId("login-user-select").selectOption(userId);
  await page.getByTestId("login-password-input").fill(password);
}

test("6-1 올바른 비밀번호로 로그인하면 홈 화면으로 이동한다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "6-1_로그인_성공");

  await step("로그인 화면 열기", async () => {
    await page.goto("/login");
    await expect(page.getByTestId("login-submit-button")).toBeVisible();
  });
  await step("부서 선택 창: 원천엔젤스 선택", async () => {
    await page.getByTestId("login-dept-trigger").click();
    await expect(page.getByText("부서 선택")).toBeVisible();
  });
  await step("부서·역할·사용자·비밀번호 입력 (ang001 / pw)", async () => {
    await page.locator(".divide-y > div").filter({ has: page.getByText("원천엔젤스", { exact: true }) }).first().click();
    await page.getByTestId("login-role-select").selectOption({ label: "회계" });
    await page.getByTestId("login-user-select").selectOption("ang001");
    await page.getByTestId("login-password-input").fill("pw");
  });
  await step("로그인 클릭 → 포탈 홈 (엔젤스회계)", async () => {
    await page.getByTestId("login-submit-button").click();
    await page.waitForURL("**/portal");
    await expect(page.getByText("엔젤스회계 (ang001)")).toBeVisible();
  });
});

test("6-2 비밀번호가 틀리면 로그인되지 않는다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "6-2_로그인_비밀번호_오류");

  await step("ang001 / 틀린 비밀번호 입력", async () => {
    await fillLogin(page, "ang001", "wrong");
  });
  await step("로그인 클릭 → '비밀번호 불일치' 표시, 로그인 화면 유지", async () => {
    await page.getByTestId("login-submit-button").click();
    await expect(page.getByText("비밀번호 불일치")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test("6-4 로그아웃하면 로그인 화면으로 돌아가고 메뉴에 접근할 수 없다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "6-4_로그아웃");

  await step("ang001 로그인 → 포탈 홈", async () => {
    await fillLogin(page, "ang001", "pw");
    await page.getByTestId("login-submit-button").click();
    await page.waitForURL("**/portal");
  });
  await step("로그아웃 클릭 → 로그인 화면", async () => {
    await openSidebar(page); // 모바일: 로그아웃 버튼은 사이드바 안에 있음
    await page.getByText("로그아웃", { exact: true }).click();
    await page.waitForURL("**/login");
  });
  await step("청구목록 주소로 직접 접근 → '로그인이 필요합니다' 알림 후 로그인 화면", async () => {
    await page.goto("/approvalList");
    await page.waitForURL("**/login");
  });
  expect(dialogs.join("\n")).toMatch(/로그인이 필요합니다/);
});
