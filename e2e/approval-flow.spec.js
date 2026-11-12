// 화면 E2E: 결재 흐름 (TEST_CASES.md 1장과 대응)
import { test, expect, startScenario, loginAs, query } from "./support/scenario.js";
import { submitClaim, decide, openClaimList } from "./support/flows.js";

const lastRequest = async () => (await query("SELECT * FROM approval_requests ORDER BY id DESC LIMIT 1"))[0];

test("1-1 결재선 순서대로 진행되고 재정부 이관까지 완료된다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "1-1_순차승인_재정부이관");

  await submitClaim(page, step, "ang001");
  expect(await lastRequest()).toMatchObject({ status: "결재진행중", current_approver_user_id: "mus002" });

  await step("ang001 청구목록: 진행상태 '결재진행중'", async () => {
    await openClaimList(page);
    await expect(page.getByRole("cell", { name: "결재진행중" })).toBeVisible();
  });

  await step("mus003 내결재목록: 아직 내 차례가 아니므로 비어 있음", async () => {
    await loginAs(page, "mus003");
    await page.goto("/approvalStatus");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("row-view-btn-0")).toHaveCount(0);
  });

  await decide(page, step, "mus002", { comment: "확인했습니다" });
  expect(await lastRequest()).toMatchObject({ status: "결재진행중", current_approver_user_id: "mus003" });

  await decide(page, step, "mus003");
  expect((await lastRequest()).status).toBe("결재완료");

  await decide(page, step, "fin001", { comment: "이관 처리" });
  expect((await lastRequest()).status).toBe("재정부이관완료");

  await step("ang001 청구목록: 진행상태 '재정부이관완료'", async () => {
    await loginAs(page, "ang001");
    await openClaimList(page);
    await expect(page.getByRole("cell", { name: "재정부이관완료" })).toBeVisible();
  });

  const history = await query("SELECT approver_user_id, status FROM approval_history ORDER BY id");
  expect(history.map(h => h.approver_user_id)).toEqual(["ang001", "mus002", "mus003", "fin001"]);
});

test("1-5 현재 결재자가 반려하면 결재반려 상태가 된다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "1-5_반려");

  await submitClaim(page, step, "ang001");
  await decide(page, step, "mus002", { mode: "reject", comment: "영수증 누락" });

  await step("ang001 청구목록: 진행상태 '결재반려'", async () => {
    await loginAs(page, "ang001");
    await openClaimList(page);
    await expect(page.getByRole("cell", { name: "결재반려" })).toBeVisible();
  });

  const [last] = await query("SELECT * FROM approval_history ORDER BY id DESC LIMIT 1");
  expect(last).toMatchObject({ status: "반려", approver_user_id: "mus002", comment: "영수증 누락" });
});

test("1-7 결재선 순번에 공백이 있으면 다음 순번 결재자에게 넘어간다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "1-7_결재선_순번공백");

  await submitClaim(page, step, "gap001", { alias: "공백부 청구" });
  expect(await lastRequest()).toMatchObject({ current_approver_user_id: "gap005", current_order_no: 5 });

  await decide(page, step, "gap005");
  expect((await lastRequest()).status).toBe("결재완료");
});

test("1-8 기안자가 결재선에 없으면 결재요청이 거부된다", async ({ page }, testInfo) => {
  const { step, dialogs } = await startScenario(page, testInfo, "1-8_기안자_결재선미등록");

  await submitClaim(page, step, "out001", { expectError: true });
  expect(dialogs.join("\n")).toMatch(/결재선에 기안자/);
  expect(await query("SELECT id FROM approval_requests")).toHaveLength(0);
});

test("1-11 재정부가 기안하면 즉시 결재완료된다", async ({ page }, testInfo) => {
  const { step } = await startScenario(page, testInfo, "1-11_재정부_기안_즉시완료");

  await submitClaim(page, step, "fin001", { alias: "재정부 대리 청구", dept: "원천엔젤스" });
  expect((await lastRequest()).status).toBe("결재완료");

  await step("fin001 청구목록: 진행상태 '결재완료'", async () => {
    await openClaimList(page);
    await expect(page.getByRole("cell", { name: "결재완료", exact: true })).toBeVisible();
  });
});
