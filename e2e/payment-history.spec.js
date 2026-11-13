// 화면 E2E: 지출내역 조회 (재정부 이관이 끝난 지출결의서의 지출 항목 목록)
import { test, expect, startScenario, loginAs, isMobileView } from "./support/scenario.js";
import { prepareClaim, prepareApprove } from "./support/flows.js";

/** 지출내역 한 건 — PC 는 표의 행, 모바일은 카드 */
const paymentRow = (page, detail) =>
  page.getByTestId(isMobileView(page) ? "payment-card" : "payment-row").filter({ hasText: detail });

test("8-1 재정부 이관이 끝난 지출만 지출내역에 보이고, 상세보기로 지출결의서를 열 수 있다", async ({ page, playwright }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "8-1_지출내역_조회_상세보기");

  // (준비) 재정부 이관까지 끝난 청구 1건 + 부장 승인만 된 청구 1건
  const item = (detail, amount) => ({
    totalAmount: amount,
    items: [{ gwan: "ACC01000000", hang: "ACC01010000", mok: "ACC01010100", semok: "ACC01010101", detail, amount }],
  });
  const done = await prepareClaim(playwright, "ang001", { aliasName: "이관완료 청구", ...item("악보 구입(이관완료)", 50000) });
  for (const u of ["mus002", "mus003", "fin001"]) await prepareApprove(playwright, u, done);
  const pending = await prepareClaim(playwright, "ang001", { aliasName: "결재중 청구", ...item("악보 구입(결재중)", 30000) });
  await prepareApprove(playwright, "mus002", pending);

  await step("ang001 로그인 → 지출내역 조회: 이관완료 건만 보임", async () => {
    await loginAs(page, "ang001");
    await page.goto("/paymentHistory");
    await expect(paymentRow(page, "악보 구입(이관완료)")).toBeVisible();
    await expect(paymentRow(page, "악보 구입(이관완료)")).toContainText("50,000");
    await expect(paymentRow(page, "악보 구입(결재중)")).toHaveCount(0);
  });

  await step("상세보기 클릭 → 지출결의서 상세 열림", async () => {
    const row = paymentRow(page, "악보 구입(이관완료)");
    // PC: '상세' 칸의 상세보기 아이콘, 모바일: 카드 자체
    if (isMobileView(page)) await row.click();
    else await row.getByTestId("payment-view-btn").click();
    await expect(page.getByTestId("btn-comment-list").filter({ visible: true }).first()).toBeVisible();
  });
});
