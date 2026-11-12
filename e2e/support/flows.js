// 화면 조작 묶음 (여러 시나리오에서 재사용)
import { expect } from "@playwright/test";
import { loginAs, drawSignature } from "./scenario.js";

/**
 * 지출결의서 작성 → 결재요청 (4단계 스크린샷)
 * @param opts.alias 청구요청 별칭, opts.amount 금액, opts.detail 지출내역, opts.expectError 실패 알림 예상 여부
 */
export async function submitClaim(page, step, userId, opts = {}) {
  const { alias = "3월 악보 구입", amount = 50000, detail = "악보", comment = "정기 악보 구입", expectError = false, dept } = opts;

  await step(`${userId} 로그인 → 지출결의서 작성: 기본정보 입력${dept ? ` (부서: ${dept})` : ""}`, async () => {
    await loginAs(page, userId);
    await page.goto("/reportForm");
    if (dept) {
      // 재정부 등 다른 부서를 대신 청구할 수 있는 사용자만 부서 선택 가능
      await page.locator("label", { hasText: "부서명" }).locator("xpath=following-sibling::select").selectOption({ label: dept });
    }
    await page.getByPlaceholder("청구요청 별칭 입력 (최대 100자)").fill(alias);
  });

  await step(`${userId} 지출내역 입력 (음악비/찬양대비/엔젤스운영/악보구입, ${amount.toLocaleString()}원)`, async () => {
    await page.getByTestId("tab-expense").click();
    await page.getByTestId("select-gwan").selectOption({ label: "음악비" });
    await page.getByTestId("select-hang").selectOption({ label: "찬양대비" });
    await page.getByTestId("row-0-mok-select").selectOption({ label: "엔젤스운영" });
    await page.getByTestId("row-0-semok-select").selectOption({ label: "악보구입" });
    await page.getByTestId("row-0-detail").fill(detail);
    await page.getByTestId("row-0-amount").fill(String(amount));
    await page.getByTestId("row-0-amount").blur();
  });

  await step(`${userId} 최종 확인: 의견 입력 + 서명`, async () => {
    await page.getByTestId("tab-confirm").click();
    await page.getByTestId("comment-textarea").fill(comment);
    await drawSignature(page, page.getByTestId("signature-canvas"));
  });

  await step(`${userId} 결재요청 클릭 → ${expectError ? "실패 알림" : "완료 알림"}`, async () => {
    if (expectError) {
      const dialog = page.waitForEvent("dialog");
      await page.getByTestId("btn-submit").click();
      await dialog;
    } else {
      await page.getByTestId("btn-submit").click();
      await expect(page.getByText("결재요청이 완료되었습니다.")).toBeVisible();
    }
  });
}

/** 내결재목록 → 상세 → 승인/반려 팝업(서명·의견) → 처리 (3단계 스크린샷) */
export async function decide(page, step, userId, { mode = "approve", comment = "", index = 0 } = {}) {
  const label = mode === "approve" ? "승인" : "반려";

  await step(`${userId} 로그인 → 내결재목록 조회`, async () => {
    await loginAs(page, userId);
    await page.goto("/approvalStatus");
    await page.getByTestId(`row-view-btn-${index}`).waitFor();
  });

  await step(`${userId} 결재문서 상세 열기`, async () => {
    await page.getByTestId(`row-view-btn-${index}`).click();
    await page.getByTestId("btn-approve").first().waitFor();
  });

  await step(`${userId} ${label} 팝업: 서명${comment ? ` + 의견 "${comment}"` : ""}`, async () => {
    if (mode === "approve") await page.getByTestId("btn-approve").first().click();
    else await page.getByRole("button", { name: /반려/ }).first().click();
    await drawSignature(page, page.getByTestId("signature-canvas-popup"));
    if (comment) await page.getByPlaceholder("의견을 입력하세요...").fill(comment);
  });

  await step(`${userId} 처리 클릭 → ${label} 완료`, async () => {
    await page.getByTestId("btn-submit-approval").click();
    await expect(page.getByTestId("btn-submit-approval")).toBeHidden();
    await page.waitForTimeout(500);
  });
}

/** 청구목록 조회 화면 열기 */
export async function openClaimList(page) {
  await page.goto("/approvalList");
  await page.waitForLoadState("networkidle");
}

/**
 * (준비용) 화면을 거치지 않고 API 로 청구서를 상신합니다. 시나리오의 주제가 아닌 사전 데이터에만 사용합니다.
 * 화면과 동일하게 ① 결재요청 저장 → ② 기안자 이력 기록 순서로 호출합니다.
 */
export async function prepareClaim(playwright, userId, overrides = {}) {
  const { USERS } = await import("./scenario.js");
  const u = USERS[userId];
  const ctx = await playwright.request.newContext({ baseURL: "http://localhost:5174" });
  try {
    const login = await ctx.post("/api/login", { data: { userId, password: "pw" } });
    expect(login.ok()).toBeTruthy();
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const body = {
      documentType: "청구지출결의서", deptName: u.dept, author: u.name, userId, date: today,
      totalAmount: 50000, aliasName: `${u.dept} 청구`, comment: "",
      selectedGwan: "ACC01000000", selectedHang: "ACC01010000",
      items: [{ gwan: "ACC01000000", hang: "ACC01010000", mok: "ACC01010100", semok: "ACC01010101", detail: "악보", amount: 50000 }],
      ...overrides,
    };
    const res = await ctx.post("/api/approval", { data: body });
    const json = await res.json();
    expect(json.success, JSON.stringify(json)).toBeTruthy();
    await ctx.post("/api/approval/history", {
      data: { requestId: json.id, approver_role: u.role, approver_user_id: userId, comment: "기안" },
    });
    return json.id;
  } finally {
    await ctx.dispose();
  }
}

/** (준비용) API 로 승인 */
export async function prepareApprove(playwright, userId, requestId) {
  const ctx = await playwright.request.newContext({ baseURL: "http://localhost:5174" });
  try {
    await ctx.post("/api/login", { data: { userId, password: "pw" } });
    const res = await ctx.post("/api/approval/approve", { data: { requestId } });
    expect(res.ok(), await res.text()).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
}

/** 청구목록에서 별칭으로 행 찾기 */
export function claimRow(page, alias) {
  return page.locator("tbody tr").filter({ hasText: alias });
}
export function rowButton(row, alt) {
  return row.locator("button", { has: row.page().locator(`img[alt="${alt}"]`) });
}
