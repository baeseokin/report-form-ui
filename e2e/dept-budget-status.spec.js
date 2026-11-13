// 화면 E2E: 부서 예산집행 현황 (계정별 예산 · 지출 · 잔액 · 집행률)
import { test, expect, startScenario, loginAs, isMobileView } from "./support/scenario.js";
import { prepareClaim, prepareApprove } from "./support/flows.js";

/** 계정 한 줄 — PC 는 표의 행, 모바일은 카드 */
const accountItem = (page, name) =>
  page.getByTestId(isMobileView(page) ? "dept-budget-card" : "dept-budget-row").filter({ hasText: name });

test("12-1 재정부 이관된 지출이 부서 예산집행 현황의 지출·잔액·집행률에 반영된다", async ({ page, playwright }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "12-1_부서_예산집행_현황");

  // (준비) 원천엔젤스 '악보구입' 50,000원 청구 → 재정부 이관 완료 (예산은 시드에서 1,000,000원)
  const id = await prepareClaim(playwright, "ang001");
  for (const u of ["mus002", "mus003", "fin001"]) await prepareApprove(playwright, u, id);

  await step("ang001 로그인 → 부서 예산집행 현황: 소속 부서(원천엔젤스) 자동 선택", async () => {
    await loginAs(page, "ang001");
    await page.goto("/deptBudgetStatus");
    await expect(page.getByTestId("dept-budget-dept").locator("option:checked")).toHaveText(/원천엔젤스/);
    if (isMobileView(page)) {
      const expandAll = page.getByRole("button", { name: /전체펼침/ });
      if (await expandAll.isVisible().catch(() => false)) await expandAll.click();
    }
  });

  await step("악보구입: 예산 1,000,000 · 지출 50,000 · 잔액 950,000 · 집행률 5.0%", async () => {
    const row = accountItem(page, "악보구입");
    await expect(row).toBeVisible();
    for (const text of ["1,000,000", "50,000", "950,000", "5.0%"]) await expect(row).toContainText(text);
  });
});
