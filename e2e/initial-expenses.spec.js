// 화면 E2E: 가청구건(초기 기지출액) 등록 (TEST_CASES.md 5장과 대응)
import { test, expect, startScenario, loginAs, query, YEAR, isMobileView } from "./support/scenario.js";

/** 항(Hang)별 입력 영역 — PC 는 표의 행, 모바일은 카드 */
const hangRow = (page, name) =>
  (isMobileView(page) ? page.getByTestId("hang-card") : page.locator("tr")).filter({ hasText: name });

test("5-1 재정부는 계정(항)별 기지출액을 등록할 수 있다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "5-1_재정부_기지출액_등록");

  await step(`fin001 로그인 → 가청구건 등록 화면 (${YEAR}년)`, async () => {
    await loginAs(page, "fin001");
    await page.goto("/initialExpenseInput");
    await expect(hangRow(page, "찬양대비")).toBeVisible();
  });

  await step("fin001 찬양대비 기지출총액 300,000원 입력", async () => {
    await hangRow(page, "찬양대비").locator("input").first().fill("300000");
  });

  await step("fin001 저장 클릭 → 확인창 · 저장 완료 알림", async () => {
    await page.getByRole("button", { name: /저장/ }).click();
    await expect.poll(() => dialogs.join("\n")).toMatch(/성공적으로 저장/);
  });

  await step("fin001 다시 조회: 기지출총액 300,000원 표시", async () => {
    await page.reload();
    await expect(hangRow(page, "찬양대비").locator("input").first()).toHaveValue("300,000");
  });

  const [e] = await query("SELECT * FROM expense_details WHERE description='초기 기지출액'");
  expect(e).toMatchObject({ category_id: "ACC01010000", year: YEAR });
  expect(Number(e.amount)).toBe(300000);
});

test("5-3 일반 사용자는 가청구건 등록 메뉴에 들어갈 수 없다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "5-3_일반사용자_가청구건_접근차단");

  await step("ang001 로그인: 왼쪽 메뉴에 '가청구건 등록' 없음", async () => {
    await loginAs(page, "ang001");
    await expect(page.getByText("가청구건 등록")).toHaveCount(0);
  });

  await step("ang001 주소로 직접 접근 → 권한 없음 알림 후 홈으로 이동", async () => {
    await page.goto("/initialExpenseInput");
    await page.waitForURL("**/portal");
  });
  expect(dialogs.join("\n")).toMatch(/권한이 없습니다/);
});
