// 화면 E2E: 재정부 일괄결재 (결재완료 문서를 여러 건 한 번에 재정부 이관)
import { test, expect, startScenario, loginAs, query, drawSignature } from "./support/scenario.js";
import { prepareClaim, prepareApprove } from "./support/flows.js";

/** 결재완료 목록의 한 건 (목록에 별칭 칸이 없어 건마다 다른 금액으로 구분) */
const bulkRow = (page, amount) => page.getByTestId("bulk-row").filter({ hasText: amount.toLocaleString() });
const claim = (amount) => ({
  totalAmount: amount,
  items: [{ gwan: "ACC01000000", hang: "ACC01010000", mok: "ACC01010100", semok: "ACC01010101", detail: "악보", amount }],
});

test("11-1 재정부가 결재완료 문서를 선택해 일괄 이관하면 재정부이관완료가 된다", async ({ page, playwright }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "11-1_재정부_일괄결재");

  // (준비) 결재완료 2건(11,000원 · 22,000원) + 결재 중 1건(33,000원)
  const done = [];
  for (const amount of [11000, 22000]) {
    const id = await prepareClaim(playwright, "ang001", claim(amount));
    for (const u of ["mus002", "mus003"]) await prepareApprove(playwright, u, id);
    done.push(id);
  }
  const pending = await prepareClaim(playwright, "ang001", claim(33000));
  await prepareApprove(playwright, "mus002", pending);

  await step("fin001 로그인 → 재정부 일괄결재: 결재완료 2건(11,000·22,000원)만 목록에 보임", async () => {
    await loginAs(page, "fin001");
    await page.goto("/bulkApproval");
    await page.getByTestId("bulk-search-btn").click();
    await expect(bulkRow(page, 11000)).toBeVisible();
    await expect(bulkRow(page, 22000)).toBeVisible();
    await expect(bulkRow(page, 33000)).toHaveCount(0);
  });

  await step("두 건 선택 + 서명", async () => {
    await bulkRow(page, 11000).click();
    await bulkRow(page, 22000).click();
    await drawSignature(page, page.getByTestId("bulk-signature-canvas"));
  });

  await step("일괄 이관처리 → 확인창 '확인' → 완료 화면", async () => {
    await page.getByTestId("bulk-submit-btn").click();
    await page.getByTestId("bulk-confirm-ok").click();
    await expect(page.getByText("일괄 이관 처리가 완료되었습니다!")).toBeVisible({ timeout: 20_000 });
  });

  const rows = await query("SELECT id, status FROM approval_requests WHERE id IN (?, ?, ?) ORDER BY id", [...done, pending]);
  expect(rows.map((r) => r.status)).toEqual(["재정부이관완료", "재정부이관완료", "결재진행중"]);
});
