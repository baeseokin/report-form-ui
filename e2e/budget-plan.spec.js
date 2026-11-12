// 화면 E2E: 예산편성서 (TEST_CASES.md 3장과 대응)
import { test, expect, startScenario, loginAs, drawSignature, query, YEAR } from "./support/scenario.js";
import { decide, openClaimList } from "./support/flows.js";

const TARGET = YEAR + 1;

/** 예산편성서 작성 → 결재 상신 (4단계 스크린샷) */
async function submitBudgetPlan(page, step, userId, { withNewCategory = true } = {}) {
  await step(`${userId} 로그인 → 예산편성서 작성: ${TARGET}년도 / 원천엔젤스`, async () => {
    await loginAs(page, userId);
    await page.goto("/budgetReportForm");
    await page.locator("label", { hasText: "대상 회계연도" }).locator("xpath=following-sibling::div//select").selectOption({ label: `${TARGET}년도` });
  });

  await step(`${userId} 다음 → 예산편성 입력: 악보구입 1,000,000원`, async () => {
    await page.getByRole("button", { name: /다음: 예산편성 입력/ }).click();
    await page.getByRole("button", { name: /모두 펼치기/ }).click();
    const row = page.locator("tr", { hasText: "악보구입" });
    await row.locator("input[inputmode=numeric]").fill("1000000");
  });

  if (withNewCategory) {
    await step(`${userId} 엔젤스운영(목) +세목추가: 신규 '의상구입' 500,000원`, async () => {
      await page.locator("tr", { hasText: "엔젤스운영" }).getByRole("button", { name: "+세목추가" }).click();
      await page.getByPlaceholder("예: 특별초청강사료, 청년부행사지원비").fill("의상구입");
      await page.getByPlaceholder("0").last().fill("500000");
      await page.getByPlaceholder("신설 사유 및 산출 근거를 입력하세요.").fill("공연 의상 신규 구입");
    });
    await step(`${userId} 계정 추가하기 → 신규신청 행 추가됨`, async () => {
      await page.getByRole("button", { name: "+ 계정 추가하기" }).click();
      await expect(page.locator("tr", { hasText: "의상구입" })).toContainText("신규신청");
    });
  }

  await step(`${userId} 다음 → 최종확인: 편성 방향 입력 + 서명`, async () => {
    await page.getByRole("button", { name: /다음: 최종 확인 및 상신/ }).click();
    await page.getByPlaceholder(/예산 편성의 주된 방향/).fill(`${TARGET}년 엔젤스 운영 예산`);
    await drawSignature(page, page.getByTestId("signature-canvas"));
  });

  await step(`${userId} 결재 상신 클릭 → 확인창·완료 알림`, async () => {
    await page.getByRole("button", { name: /결재 상신/ }).click();
    await page.waitForURL("**/approvalList");
  });
}

test("3-1·3-3 예산편성서 상신 → 승인 → 재정부 이관 시 예산과 신규 계정이 반영된다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "3-1_3-3_예산편성_상신_이관반영");

  await submitBudgetPlan(page, step, "ang001");
  const [req] = await query("SELECT * FROM approval_requests WHERE document_type='예산편성서'");
  expect(req).toMatchObject({ status: "결재진행중", current_approver_user_id: "mus002", aliasName: `${TARGET}년도 원천엔젤스 예산편성` });

  await decide(page, step, "mus002");
  await decide(page, step, "mus003");
  await decide(page, step, "fin001");
  expect((await query("SELECT status FROM approval_requests WHERE id=?", [req.id]))[0].status).toBe("재정부이관완료");

  await step(`fin001 예산 관리(${TARGET}년, 원천엔젤스): 악보구입 1,000,000 · 신규 의상구입 500,000 반영`, async () => {
    await page.goto("/budgets");
    await page.locator("label", { hasText: "부서 선택" }).locator("xpath=following-sibling::select").selectOption({ label: "원천엔젤스" });
    const yearInput = page.locator("label", { hasText: "회계연도" }).locator("xpath=following-sibling::input");
    await yearInput.fill(String(TARGET));
    await yearInput.dispatchEvent("change");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("의상구입").first()).toBeVisible();
  });

  const [cat] = await query("SELECT * FROM account_categories WHERE category_name='의상구입'");
  expect(cat).toMatchObject({ category_id: "ACC01010102", parent_id: 3, level: "세목" });
  const budgets = await query("SELECT category_id, budget_amount FROM budgets WHERE year=? ORDER BY category_id", [TARGET]);
  expect(budgets.map(b => [b.category_id, Number(b.budget_amount)])).toEqual([["ACC01010101", 1000000], ["ACC01010102", 500000]]);
});

test("3-2 같은 부서·연도의 예산편성서가 진행 중이면 다시 상신할 수 없다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "3-2_예산편성_중복상신_차단");

  await submitBudgetPlan(page, step, "ang001", { withNewCategory: false });

  await step(`out001 로그인 → 예산편성서 작성: 같은 ${TARGET}년도 / 원천엔젤스`, async () => {
    await loginAs(page, "out001");
    await page.goto("/budgetReportForm");
    await page.locator("label", { hasText: "대상 회계연도" }).locator("xpath=following-sibling::div//select").selectOption({ label: `${TARGET}년도` });
    await page.getByRole("button", { name: /다음: 예산편성 입력/ }).click();
    await page.getByRole("button", { name: /모두 펼치기/ }).click();
  });
  await step("out001 최종확인 → 결재 상신 클릭 → '이미 결재진행중' 알림", async () => {
    await page.getByRole("button", { name: /다음: 최종 확인 및 상신/ }).click();
    await drawSignature(page, page.getByTestId("signature-canvas"));
    const dialog = page.waitForEvent("dialog");
    await page.getByRole("button", { name: /결재 상신/ }).click();
    await dialog;
    await page.waitForTimeout(300);
  });
  expect(dialogs.join("\n")).toMatch(/이미 결재진행중/);
  expect(await query("SELECT id FROM approval_requests WHERE document_type='예산편성서'")).toHaveLength(1);
});
