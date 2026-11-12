// 화면 E2E: 권한별 목록 조회 · 수정 · 삭제 (TEST_CASES.md 2장과 대응)
import { test, expect, startScenario, loginAs, query, isMobileView, expectNotice } from "./support/scenario.js";
import { decide, openClaimList, prepareClaim, prepareApprove, claimRow, rowButton } from "./support/flows.js";

const A = "원천엔젤스 청구";   // ang001 이 상신한 문서
const B = "청년부 청구";       // you001 이 상신한 문서

async function seeList(page, step, userId, title, { visible = [], hidden = [] }) {
  await step(`${userId} 청구목록 조회: ${title}`, async () => {
    await loginAs(page, userId);
    await openClaimList(page);
    for (const a of visible) await expect(claimRow(page, a)).toBeVisible();
    for (const a of hidden) await expect(claimRow(page, a)).toHaveCount(0);
  });
}

test.describe("2-A 청구목록 조회 권한", () => {

  test("2-1~2-3 부서·권한에 따라 보이는 문서가 다르다", async ({ page, playwright }, testInfo) => {
    const { step } = await startScenario(page, testInfo, "2-1~2-3_청구목록_조회권한");
    await prepareClaim(playwright, "ang001");
    await prepareClaim(playwright, "you001");

    await seeList(page, step, "ang001", "소속 부서(원천엔젤스) 문서만", { visible: [A], hidden: [B] });
    await seeList(page, step, "you001", "소속 부서(청년부) 문서만", { visible: [B], hidden: [A] });
    await seeList(page, step, "mus002", "상위 부서(음악부)라 하위 원천엔젤스 문서도 보임", { visible: [A], hidden: [B] });
    await seeList(page, step, "fin001", "재정부는 전체", { visible: [A, B] });
    await seeList(page, step, "adm001", "관리자는 전체", { visible: [A, B] });
  });

  test("2-4 내결재목록은 내가 현재 결재자인 문서만 보여준다", async ({ page, playwright }, testInfo) => {
    const { step } = await startScenario(page, testInfo, "2-4_내결재목록_결재대기");
    await prepareClaim(playwright, "ang001");

    await decide(page, step, "mus002");
    await step("mus002 내결재목록 다시 조회: 승인했으므로 비어 있음", async () => {
      await page.goto("/approvalStatus");
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("row-view-btn-0")).toHaveCount(0);
    });
    await step("mus003 내결재목록: 이제 내 차례라 보임", async () => {
      await loginAs(page, "mus003");
      await page.goto("/approvalStatus");
      await expect(page.getByTestId("row-view-btn-0")).toBeVisible();
    });
  });
});

test.describe("2-B 수정 권한", () => {
  test("2-6 결재가 시작되지 않은 문서는 기안자가 수정할 수 있다", async ({ page, playwright }, testInfo) => {
    const { step } = await startScenario(page, testInfo, "2-6_결재전_기안자_수정");
    const id = await prepareClaim(playwright, "ang001");

    await seeList(page, step, "ang001", "수정 전 50,000원", { visible: [A] });
    await step("ang001 수정 아이콘 클릭 → 수정 화면", async () => {
      await rowButton(claimRow(page, A), "수정").click();
      await page.waitForURL(/mode=edit/);
      await page.getByTestId("tab-expense").waitFor();
    });
    await step("ang001 지출내역 금액을 70,000원으로 변경", async () => {
      await page.getByTestId("tab-expense").click();
      // 금액 칸은 포커스를 받으면 기존 값을 다시 채우므로(모바일), 먼저 눌러 포커스를 준 뒤 입력
      await page.getByTestId("row-0-amount").click();
      await page.getByTestId("row-0-amount").fill("70000");
      await page.getByTestId("row-0-amount").blur();
    });
    await step("ang001 최종 확인 → 결재요청(수정)", async () => {
      await page.getByTestId("tab-confirm").click();
      await page.getByTestId("btn-submit").click();
      await expect(page.getByText("결재요청이 완료되었습니다.")).toBeVisible();
    });
    await step("ang001 청구목록: 총액 70,000원으로 변경됨", async () => {
      await openClaimList(page);
      await expect(claimRow(page, A)).toContainText("70,000");
    });
    expect(Number((await query("SELECT total_amount FROM approval_requests WHERE id=?", [id]))[0].total_amount)).toBe(70000);
  });

  test("2-7 결재가 진행된 문서는 수정할 수 없다", async ({ page, playwright }, testInfo) => {
    const { step, dialogs } = await startScenario(page, testInfo, "2-7_결재진행후_수정불가");
    const id = await prepareClaim(playwright, "ang001");
    await prepareApprove(playwright, "mus002", id);

    await seeList(page, step, "ang001", "부장 승인 후 (수정 아이콘 비활성)", { visible: [A] });
    await step("ang001 수정 아이콘 클릭 → '수정할 수 없습니다' 안내", async () => {
      await rowButton(claimRow(page, A), "수정").click();
      await expectNotice(page, dialogs, "이미 결재가 진행중인 건은 수정할 수 없습니다.");
    });
  });
});

test.describe("2-C 삭제 권한", () => {
  async function deleteFromList(page, step, dialogs, userId, { expectDenied = false, confirmText = /정말로 삭제하시겠습니까|진짜로 삭제하시겠습니까/ } = {}) {
    if (expectDenied) {
      await step(`${userId} 삭제 아이콘 클릭 → 삭제 불가 안내`, async () => {
        await rowButton(claimRow(page, A), "삭제").click();
        await expectNotice(page, dialogs, "권한이 없거나 이미 결재가 진행중인 건은 삭제할 수 없습니다.");
      });
      return;
    }
    if (isMobileView(page)) {
      // 모바일: 브라우저 기본 확인창 → 완료 알림창 (자동으로 '확인')
      await step(`${userId} 삭제 아이콘 클릭 → 확인창 '확인' → 삭제 완료 알림`, async () => {
        await rowButton(claimRow(page, A), "삭제").click();
        await expect.poll(() => dialogs.join("\n")).toMatch(confirmText);
        await expect.poll(() => dialogs.join("\n")).toMatch(/삭제되었습니다/);
        await expect(claimRow(page, A)).toHaveCount(0);
      });
      return;
    }
    await step(`${userId} 삭제 아이콘 클릭 → 삭제 확인창`, async () => {
      await rowButton(claimRow(page, A), "삭제").click();
      await expect(page.getByText(confirmText)).toBeVisible();
    });
    await step(`${userId} 확인 클릭 → 삭제 완료`, async () => {
      await page.locator(".al-box", { hasText: confirmText }).locator(".al-ok").click();
      const done = page.locator(".al-box", { hasText: "삭제되었습니다." });
      await expect(done).toBeVisible();
      await done.locator(".al-ok").click();
      await expect(claimRow(page, A)).toHaveCount(0);
    });
  }

  test("2-9 기안자는 결재 전 문서를 삭제할 수 있다", async ({ page, playwright }, testInfo) => {
    const { step, dialogs } = await startScenario(page, testInfo, "2-9_기안자_결재전_삭제");
    const id = await prepareClaim(playwright, "ang001");
    await seeList(page, step, "ang001", "삭제 전", { visible: [A] });
    await deleteFromList(page, step, dialogs, "ang001");
    expect(await query("SELECT id FROM approval_requests WHERE id=?", [id])).toHaveLength(0);
  });

  test("2-11 결재가 진행된 문서는 기안자도 삭제할 수 없다", async ({ page, playwright }, testInfo) => {
    const { step, dialogs } = await startScenario(page, testInfo, "2-11_결재진행후_삭제불가");
    const id = await prepareClaim(playwright, "ang001");
    await prepareApprove(playwright, "mus002", id);
    await seeList(page, step, "ang001", "부장 승인 후", { visible: [A] });
    await deleteFromList(page, step, dialogs, "ang001", { expectDenied: true });
    expect(await query("SELECT id FROM approval_requests WHERE id=?", [id])).toHaveLength(1);
  });

  test("2-12 재정부는 결재완료 문서도 삭제할 수 있다", async ({ page, playwright }, testInfo) => {
    const { step, dialogs } = await startScenario(page, testInfo, "2-12_재정부_결재완료_삭제");
    const id = await prepareClaim(playwright, "ang001");
    await prepareApprove(playwright, "mus002", id);
    await prepareApprove(playwright, "mus003", id);
    await seeList(page, step, "fin001", "결재완료 문서", { visible: [A] });
    await deleteFromList(page, step, dialogs, "fin001");
    expect(await query("SELECT id FROM approval_requests WHERE id=?", [id])).toHaveLength(0);
  });
});
