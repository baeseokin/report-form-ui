// 화면 E2E: 계정과목 관리 (관리자)
import { test, expect, startScenario, loginAs, query, isMobileView } from "./support/scenario.js";

/** 계정과목 한 줄 — PC 는 표의 행, 모바일은 목록 항목 */
const categoryItem = (page, name) =>
  page.getByTestId(isMobileView(page) ? "category-card" : "category-row").filter({ hasText: name });

test("10-1 계정과목 이름을 수정하면 목록과 DB 에 반영된다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "10-1_계정과목_이름_수정");

  await step("adm001 로그인 → 계정과목 관리: 음악비 아래 찬양대비 표시", async () => {
    await loginAs(page, "adm001");
    await page.goto("/accountCategories");
    await expect(categoryItem(page, "음악비")).toBeVisible();
    if ((await categoryItem(page, "찬양대비").count()) === 0) {
      await categoryItem(page, "음악비").getByTestId("category-expand").click();
    }
    await expect(categoryItem(page, "찬양대비")).toBeVisible();
  });

  await step("찬양대비 수정 → 수정 창에서 이름을 '찬양대비(성가대)' 로 변경", async () => {
    // PC: 행의 수정 아이콘, 모바일: 항목을 선택한 뒤 위쪽 도구막대의 수정 버튼
    if (isMobileView(page)) {
      await categoryItem(page, "찬양대비").click();
      await page.getByTestId("category-edit-btn").click();
    } else {
      await categoryItem(page, "찬양대비").getByTestId("category-edit-btn").click();
    }
    await expect(page.getByTestId("category-name-input")).toHaveValue("찬양대비");
    await page.getByTestId("category-name-input").fill("찬양대비(성가대)");
  });

  await step("저장 → 수정 창 닫힘, 목록에 바뀐 이름 표시", async () => {
    await page.getByTestId("category-save-btn").click();
    await expect(page.getByTestId("category-name-input")).toBeHidden();
    await expect(categoryItem(page, "찬양대비(성가대)")).toBeVisible();
  });

  const [c] = await query("SELECT category_name FROM account_categories WHERE category_id = 'ACC01010000'");
  expect(c.category_name).toBe("찬양대비(성가대)");
});
