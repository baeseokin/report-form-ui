<template>
  <div class="bulk-approval-root font-nanum">

    <!-- ✅ 접근 권한 없음 -->
    <div v-if="!isFinanceDept" class="flex flex-col items-center justify-center h-96 text-gray-500 gap-4">
      <span class="text-5xl">🚫</span>
      <p class="text-xl font-semibold">재정부 전용 화면입니다.</p>
      <p class="text-sm">접근 권한이 없습니다.</p>
    </div>

    <!-- ✅ 본문 (재정부만) -->
    <template v-else>

      <!-- ─── 검색 필터 ─────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>청구 시작일</label>
          <input type="date" v-model="search.startDate" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>청구 종료일</label>
          <input type="date" v-model="search.endDate" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>부서명</label>
          <input type="text" v-model="search.deptName" placeholder="전체" class="filter-input w-32" />
        </div>
        <button @click="page = 1; fetchList()" class="btn-search">🔍 조회</button>
      </div>

      <!-- ─── 메인 2-칼럼 레이아웃 ────────────────── -->
      <div class="main-layout">

        <!-- ◀ 좌측: 결재 목록 -->
        <section class="list-panel">
          <div class="panel-header">
            <h2 class="panel-title">결재완료 목록</h2>
            <div class="flex items-center gap-3">
              <span class="badge-count">{{ selectedIds.size }}건 선택</span>
              <label class="select-all-label">
                <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="w-4 h-4 accent-purple-600" />
                전체선택
              </label>
            </div>
          </div>

          <!-- 테이블 -->
          <div class="list-table-wrap">
            <table class="list-table">
              <thead>
                <tr>
                  <th class="col-check"></th>
                  <th>부서</th>
                  <th>유형</th>
                  <th>작성자</th>
                  <th>청구일</th>
                  <th>금액</th>
                  <th class="col-action"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in rows"
                  :key="row.id"
                  :class="['list-row', selectedIds.has(row.id) ? 'row-selected' : '']"
                  @click="toggleSelect(row.id)"
                >
                  <td class="text-center" @click.stop>
                    <input
                      type="checkbox"
                      :checked="selectedIds.has(row.id)"
                      @change="toggleSelect(row.id)"
                      class="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                  </td>
                  <td>{{ row.dept_name }}</td>
                  <td>{{ row.document_type }}</td>
                  <td>{{ row.author }}</td>
                  <td>{{ formatDate(row.request_date) }}</td>
                  <td class="text-right pr-2">{{ Math.floor(row.total_amount).toLocaleString() }}</td>
                  <!-- ✅ 건별 결재 버튼 -->
                  <td class="text-center" @click.stop>
                    <button
                      @click.stop="openPreview(row)"
                      class="btn-row-detail"
                    >결재</button>
                  </td>
                </tr>
                <tr v-if="rows.length === 0">
                  <td colspan="7" class="text-center py-10 text-gray-400">데이터가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 -->
          <div class="pagination">
            <button
              v-for="p in totalPages"
              :key="p"
              @click="page = p; fetchList()"
              :class="['page-btn', page === p ? 'active' : '']"
            >{{ p }}</button>
          </div>
        </section>

        <!-- ▶ 우측: 서명 & 결재의견 패널 -->
        <section class="sign-panel">
          <div class="panel-header">
            <h2 class="panel-title">서명 / 결재의견 입력</h2>
          </div>

          <!-- 선택 항목 요약 -->
          <div class="selected-summary" v-if="selectedIds.size > 0">
            <p class="summary-label">선택된 {{ selectedIds.size }}건에 동일 서명·의견이 적용됩니다.</p>
            <ul class="summary-list">
              <li v-for="row in selectedRows" :key="row.id">
                <span class="tag-dept">{{ row.dept_name }}</span>
                {{ row.document_type }} — {{ row.author }}
                <span class="text-gray-400 text-xs">({{ formatDate(row.request_date) }})</span>
              </li>
            </ul>
          </div>
          <div v-else class="empty-sign">
            <span class="text-4xl">☑️</span>
            <p class="mt-2 text-gray-500 text-sm">좌측 목록에서 결재할 항목을 선택하세요.</p>
          </div>

          <!-- 서명 캔버스 -->
          <div class="sign-section" :class="{ 'opacity-40 pointer-events-none': selectedIds.size === 0 }">
            <label class="sign-label">서명</label>
            <canvas ref="signaturePad" class="sign-canvas"></canvas>
            <div class="flex justify-between mt-2 text-sm text-gray-500">
              <span>기본 서명이 자동 로드됩니다. 지우기 후 재서명 가능.</span>
              <button @click="clearSignature(false)" class="btn-clear">지우기</button>
            </div>
          </div>

          <!-- ✅ 결재의견 — sign-section 과 동일한 padding -->
          <div class="sign-section mt-4" :class="{ 'opacity-40 pointer-events-none': selectedIds.size === 0 }">
            <label class="sign-label">결재의견 <span class="text-gray-400 font-normal text-xs">(선택)</span></label>
            <textarea
              v-model="bulkComment"
              rows="3"
              placeholder="결재 의견을 입력하세요..."
              class="w-full border border-gray-200 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-purple-400 outline-none resize-none text-sm"
            ></textarea>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons" :class="{ 'opacity-40 pointer-events-none': selectedIds.size === 0 }">
            <button @click="printAll" class="btn-print">🖨️ 프린트</button>
            <button @click="downloadAllPDF" class="btn-pdf">📄 PDF 저장</button>
            <button @click="submitBulkApproval" class="btn-approve" :disabled="submitting">
              <span v-if="submitting" class="animate-spin mr-1">⏳</span>
              <span v-else>✅</span>
              {{ submitting ? '처리중...' : '일괄 이관처리' }}
            </button>
          </div>

          <!-- 진행 상태 -->
          <div v-if="progress.total > 0" class="progress-bar-wrap">
            <div class="progress-label">{{ progress.done }} / {{ progress.total }} 완료</div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
            </div>
          </div>
        </section>
      </div>

    </template>

    <!-- ✅ 완료 알림 -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastMsg" class="bulk-toast">{{ toastMsg }}</div>
      </Transition>
    </Teleport>

    <!-- ✅ 커스텀 Confirm 모달 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div v-if="confirmModal.visible" class="confirm-overlay" @click.self="confirmModal.resolve(false)">
          <div class="confirm-box">
            <p class="confirm-msg">{{ confirmModal.message }}</p>
            <div class="confirm-actions">
              <button class="confirm-cancel" @click="confirmModal.resolve(false)">취소</button>
              <button class="confirm-ok" @click="confirmModal.resolve(true)">확인</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ✅ ReportPreview 모달 — 닫힐 때 목록 재조회 -->
    <ReportPreview
      v-if="previewReport"
      :report="previewReport"
      @close="previewReport = null; fetchList()"
      @refreshList="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, defineAsyncComponent } from "vue";
import { useUserStore } from "@/store/userStore";
import axios from "axios";

// ✅ ReportPreview — 비동기 로드
const ReportPreview = defineAsyncComponent(() => import("@/components/ReportPreview.vue"));

// ─── 권한 체크 ──────────────────────────────────────────────────
const userStore = useUserStore();
const isFinanceDept = computed(() => userStore.user?.deptName === "재정부");

// ─── 날짜 헬퍼 ──────────────────────────────────────────────────
function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("ko-KR") : "");

// ─── 검색 상태 ────────────────────────────────────────────────
const search = reactive({
  startDate: dateStr(oneMonthAgo),
  endDate: dateStr(today),
  deptName: "",
});
const rows = ref([]);
const page = ref(1);
const totalPages = ref(1);

// ─── 목록 조회 ────────────────────────────────────────────────
const fetchList = async () => {
  try {
    const res = await fetch("/api/approvalList", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        startDate: search.startDate,
        endDate: search.endDate,
        deptName: search.deptName || "",
        status: "결재완료",
        page: page.value,
        pageSize: 20,
      }),
    });
    const data = await res.json();
    if (data.success) {
      rows.value = data.rows.filter(r => r.status !== "재정부이관완료");
      totalPages.value = data.totalPages;
    }
  } catch (e) {
    console.error("목록 조회 실패:", e);
  }
};

// ─── 선택 관리 ────────────────────────────────────────────────
const selectedIds = ref(new Set());

const selectedRows = computed(() =>
  rows.value.filter(r => selectedIds.value.has(r.id))
);

const isAllSelected = computed(
  () => rows.value.length > 0 && rows.value.every(r => selectedIds.value.has(r.id))
);

function toggleSelect(id) {
  const s = new Set(selectedIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedIds.value = s;
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(rows.value.map(r => r.id));
  }
}

// ─── ReportPreview 연동 ───────────────────────────────────────
const previewReport = ref(null);

const openPreview = async (row) => {
  try {
    const res = await fetch(`/api/approval/detail/${row.id}`, { credentials: "include" });
    const data = await res.json();
    previewReport.value = {
      id: data.id,
      documentType: data.document_type,
      deptName: data.dept_name,
      author: data.author,
      payee: data.payee,
      date: data.request_date,
      totalAmount: data.total_amount,
      comment: data.comment,
      aliasName: data.aliasName,
      items: data.items || [],
      attachedFiles: data.attachedFiles || [],
      approvalHistory: data.approvalHistory || [],
    };
  } catch (e) {
    console.error("상세 조회 실패:", e);
    alert("상세 정보를 불러오는 데 실패했습니다.");
  }
};

// ─── 서명 캔버스 ─────────────────────────────────────────────
const signaturePad = ref(null);
let ctx = null;
let drawing = false;
const isImageLoaded = ref(false);
const wasCleared = ref(false);
const didRedrawAfterClear = ref(false);

function getPos(e) {
  const rect = signaturePad.value.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

const startDraw = (e) => {
  if (isImageLoaded.value) return;
  e.preventDefault?.();
  if (wasCleared.value) didRedrawAfterClear.value = true;
  drawing = true;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
};
const draw = (e) => {
  if (!drawing) return;
  e.preventDefault?.();
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};
const endDraw = () => { drawing = false; };

function clearSignature(skipMark = false) {
  const el = signaturePad.value;
  if (!el || !ctx) return;
  const rect = el.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  if (!skipMark) {
    wasCleared.value = true;
    didRedrawAfterClear.value = false;
  }
  isImageLoaded.value = false;
}

async function drawImageToCanvas(src) {
  return new Promise((resolve) => {
    const el = signaturePad.value;
    if (!el || !ctx) return resolve();
    const { width, height } = el.getBoundingClientRect();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      isImageLoaded.value = true;
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  });
}

async function loadDefaultSignature() {
  try {
    const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
    if (data?.signature) {
      await drawImageToCanvas(data.signature);
      return;
    }
  } catch (_) {}
  clearSignature(true);
}

async function saveDefaultSignature() {
  const el = signaturePad.value;
  if (!el) return;
  try {
    await axios.put("/api/users/me/signature", { signature: el.toDataURL("image/png") }, { withCredentials: true });
  } catch (e) {
    console.warn("기본서명 저장 실패:", e?.message);
  }
}

function getSignatureBlob() {
  return new Promise((resolve) => {
    const el = signaturePad.value;
    if (!el) return resolve(null);
    el.toBlob(resolve, "image/png");
  });
}

function isSignatureEmpty() {
  const el = signaturePad.value;
  if (!el || !ctx) return true;
  const rect = el.getBoundingClientRect();
  const imgData = ctx.getImageData(0, 0, Math.floor(rect.width), Math.floor(rect.height)).data;
  return !imgData.some(v => v !== 0);
}

// ─── 결재의견 ─────────────────────────────────────────────────
const bulkComment = ref("");

// ─── 진행 상태 ────────────────────────────────────────────────
const submitting = ref(false);
const progress = reactive({ done: 0, total: 0 });
const progressPct = computed(() =>
  progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
);

// ─── 토스트 ───────────────────────────────────────────────────
const toastMsg = ref("");
let toastTimer = null;
function showToast(msg) {
  toastMsg.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastMsg.value = ""; }, 2500);
}

// ─── 커스텀 Confirm 모달 ─────────────────────────────────────
const confirmModal = reactive({ visible: false, message: "", resolve: null });

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmModal.message = message;
    confirmModal.visible = true;
    confirmModal.resolve = (result) => {
      confirmModal.visible = false;
      confirmModal.resolve = null;
      resolve(result);
    };
  });
}

// ─── 일괄 이관 처리 ───────────────────────────────────────────
const submitBulkApproval = async () => {
  if (selectedIds.value.size === 0) { showToast("❗ 결재할 항목을 선택하세요."); return; }
  if (isSignatureEmpty()) { showToast("❗ 서명을 입력해주세요."); return; }
  const confirmed = await showConfirm(`선택한 ${selectedIds.value.size}건을 일괄 이관처리하시겠습니까?`);
  if (!confirmed) return;

  submitting.value = true;
  progress.done = 0;
  progress.total = selectedIds.value.size;

  const blob = await getSignatureBlob();
  if (!blob) { alert("서명 데이터 추출에 실패했습니다."); submitting.value = false; return; }

  let successCount = 0;
  const failIds = [];

  for (const id of selectedIds.value) {
    try {
      const fd = new FormData();
      fd.append("requestId", id);
      fd.append("comment", bulkComment.value);
      fd.append("signature", blob, "signature.png");

      const res = await fetch("/api/approval/approve", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      data.success ? successCount++ : failIds.push(id);
    } catch (e) {
      failIds.push(id);
    }
    progress.done++;
  }

  if (wasCleared.value && didRedrawAfterClear.value) await saveDefaultSignature();

  submitting.value = false;
  showToast(failIds.length === 0 ? `✅ ${successCount}건 일괄 이관 완료!` : `⚠️ ${successCount}건 성공, ${failIds.length}건 실패`);

  selectedIds.value = new Set();
  progress.done = 0;
  progress.total = 0;
  await fetchList();
};

// ─── 상세 로드 ────────────────────────────────────────────────
async function fetchDetail(id) {
  const res = await fetch(`/api/approval/detail/${id}`, { credentials: "include" });
  return await res.json();
}

// ─── Account categories ────────────────────────────────────────
const categories = ref([]);
async function loadCategories() {
  try {
    const res = await axios.get("/api/accountCategories");
    categories.value = res.data.categories || [];
  } catch (_) {}
}
function getCatName(code) {
  if (!code) return "";
  const f = categories.value.find(c => c.category_id === code);
  return f ? f.category_name : code;
}

// ─── 서명 DataURL ─────────────────────────────────────────────
function getSignatureDataURL() {
  const el = signaturePad.value;
  return el ? el.toDataURL("image/png") : null;
}

// ========================================================
// ✅ 프린트/PDF — ReportPreview 와 동일한 CSS/HTML 구조 사용
// ========================================================

/**
 * ReportPreview.vue 의 generatePDF 에서 사용하는 것과 동일한 CSS 문자열
 * (scoped 스타일을 인라인으로 재현)
 */
const PDF_CSS = `
  @font-face {
    font-family: 'NanumBarunGothic';
    src: url('/fonts/NanumBarunGothic.woff2') format('woff2');
    font-weight: normal; font-style: normal;
  }
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
    font-size: 14pt;
    color: #111;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 10mm;
    background: white;
    box-sizing: border-box;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* 제목 */
  .title-lg { font-size: 20pt; font-weight: 800; text-align: center; margin-bottom: 24px; margin-top: 16px; }
  .title-md { font-size: 16pt; font-weight: 700; margin: 16px 0 12px; }

  /* 결재란 영역 */
  .approval-wrapper {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    overflow: hidden;
  }
  .approval-table-left {
    border-collapse: collapse;
    text-align: center;
    width: calc(var(--left-col-count, 4) * 11%);
    min-width: calc(var(--left-col-count, 4) * 11%);
    table-layout: fixed;
  }
  .approval-table-right {
    border-collapse: collapse;
    text-align: center;
    width: 40%;
    table-layout: fixed;
  }
  .approval-table-left th, .approval-table-left td,
  .approval-table-right th, .approval-table-right td {
    border: 1px solid #d1d5db;
    vertical-align: middle;
    text-align: center;
    padding: 0 4px;
  }
  .approval-table-left thead th,
  .approval-table-right thead th {
    background: #ede9fe;
    font-size: 10pt;
    height: 28px;
  }
  .sign-row td { height: 100px; }
  .sign-img {
    height: 80px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    border-radius: 6px;
  }

  /* 부서명/관항 테이블 */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  .info-table td {
    border: 1px solid #d1d5db;
    padding: 5px 10px;
    height: 3rem;
    vertical-align: middle;
    font-size: 0.9em;
  }
  .info-label { background: #dbeafe; font-weight: bold; width: 130px; text-align: center; }

  /* 지출내역 테이블 */
  .expense-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 16px;
  }
  .expense-table th, .expense-table td {
    border: 1px solid #d1d5db;
    padding: 3px 5px;
    height: 3rem;
    vertical-align: middle;
    text-align: center;
    font-size: 0.875em;
  }
  .expense-table thead { background: #dbeafe; }
  .expense-table .detail-col { width: 45%; text-align: left; padding-left: 12px; }
  .expense-table .amount-col { text-align: right; padding-right: 10px; }
  .expense-table .total-row { background: #dbeafe; font-weight: bold; }

  /* 영수 문구 */
  .receipt-text {
    margin-top: 40px;
    text-align: right;
    font-size: 11pt;
    line-height: 2;
  }

  @media print {
    @page { size: A4; margin: 0; }
    body { margin: 0; }
    .page { box-shadow: none; border: none; }
    /* ✅ 프린트 시 배경색 강제 유지 */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .approval-table-left thead th,
    .approval-table-right thead th {
      background: #ede9fe !important;
    }
    .info-label {
      background: #dbeafe !important;
    }
    .expense-table thead th {
      background: #dbeafe !important;
    }
    .expense-table .total-row {
      background: #dbeafe !important;
    }
  }
`;

/**
 * 단일 결재건의 HTML 페이지 문자열 생성
 * 메인 결재 페이지 + 첨부파일 페이지(있는 경우) 모두 포함
 */
function buildReportHTML(detail, signatureDataURL) {
  const items = (detail.items || []).map(i => ({
    mok: i.mok === "__custom__" ? (i.customMok || "") : getCatName(i.mok),
    semok: i.semok === "__custom__" ? (i.customSemok || "") : getCatName(i.semok),
    detail: i.detail === "__custom__" ? (i.customDetail || "") : (i.detail || ""),
    amount: i.amount,
  }));
  while (items.length < 8) items.push({ mok: "", semok: "", detail: "", amount: null });

  const totalAmount = Number(detail.total_amount || 0).toLocaleString("ko-KR");
  const requestDate = detail.request_date
    ? new Date(detail.request_date).toLocaleDateString("ko-KR") : "";

  // 결재선
  const approvalLine = detail.approvalLine || [];
  const approvalHistory = detail.approvalHistory || [];

  const getRecord = (role) =>
    approvalHistory.slice().reverse().find(h => h.approver_role === role) || null;

  const getSignUrl = (role) => {
    const rec = getRecord(role);
    if (!rec?.signature_path) return "";
    return `/api/files/${encodeURIComponent(rec.signature_path)}`;
  };

  // 좌측 결재란 컬럼
  const leftCols = approvalLine.map(line => ({
    label: line.approver_role === "회계" ? "담당" : line.approver_role,
    signImg: getSignUrl(line.approver_role)
      ? `<img src="${getSignUrl(line.approver_role)}" class="sign-img" crossorigin="anonymous" />`
      : "",
  }));
  // 재정부 열 (이번에 이관하는 서명)
  leftCols.push({
    label: "재정부",
    signImg: signatureDataURL ? `<img src="${signatureDataURL}" class="sign-img" />` : "",
  });

  const colCount = leftCols.length;
  const thCells = leftCols.map(c => `<th>${c.label}</th>`).join("");
  const tdCells = leftCols.map(c => `<td>${c.signImg}</td>`).join("");

  const gwanHang = [getCatName(detail.selectedGwan), getCatName(detail.selectedHang)]
    .filter(Boolean).join(" / ") || "—";

  // ── getShrinkStyle (ReportPreview 와 동일한 알고리즘) ──────────
  const shrinkStyle = (text, maxWeightedLen) => {
    if (!text) return "white-space:nowrap;";
    let wl = 0;
    for (let i = 0; i < text.length; i++) wl += text.charCodeAt(i) > 255 ? 2 : 1;
    if (wl <= maxWeightedLen) return "white-space:nowrap;";
    const ratio = maxWeightedLen / wl;
    const factor = Math.max(0.65, ratio);
    return `font-size:${factor * 0.875}em;white-space:nowrap;text-overflow:clip;`;
  };

  // itemRows — shrink 스타일 적용
  const itemRowsHtml = items.map(item => `
    <tr>
      <td style="${shrinkStyle(item.mok, 14)}">${escHtml(item.mok)}</td>
      <td style="${shrinkStyle(item.semok, 14)}">${escHtml(item.semok)}</td>
      <td class="detail-col" style="${shrinkStyle(item.detail, 38)}">${escHtml(item.detail)}</td>
      <td class="amount-col">${item.amount != null && item.amount !== "" ? Number(item.amount).toLocaleString("ko-KR") + " 원" : ""}</td>
    </tr>`).join("");

  // ── 메인 결재 페이지 ─────────────────────────────────────────
  const mainPage = `
<div class="page">
  <h2 class="title-lg">${escHtml(detail.document_type || "")}</h2>

  <div class="approval-wrapper">
    <table class="approval-table-left" style="--left-col-count:${colCount}">
      <thead><tr>${thCells}</tr></thead>
      <tbody><tr class="sign-row">${tdCells}</tr></tbody>
    </table>
    <table class="approval-table-right">
      <thead><tr><th>담당</th><th>부장</th><th>위원장</th><th>당회장</th></tr></thead>
      <tbody><tr class="sign-row"><td></td><td></td><td></td><td></td></tr></tbody>
    </table>
  </div>

  <table class="info-table">
    <tr>
      <td class="info-label" style="width:256px;">부서명</td>
      <td>${escHtml(detail.dept_name || "")}</td>
    </tr>
    <tr>
      <td class="info-label" style="width:256px;">관/항</td>
      <td>${escHtml(gwanHang)}</td>
    </tr>
  </table>

  <h3 class="title-md">💸 지출내역</h3>
  <table class="expense-table">
    <thead>
      <tr>
        <th>목</th><th>세목</th>
        <th class="detail-col">지출내역</th>
        <th class="amount-col">금액</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
      <tr class="total-row">
        <td colspan="3" style="text-align:center">합 계</td>
        <td class="amount-col">${totalAmount} 원</td>
      </tr>
    </tbody>
  </table>

  <div class="receipt-text">
    위의 금액을 정히 영수합니다.<br/>
    ${escHtml(requestDate)}<br/>
    영수인 성명 : ${escHtml(detail.payee || detail.author || "")}
  </div>
</div>`;

  // ── 첨부파일 페이지 (ReportPreview 와 동일한 로직) ────────────
  const attachedFiles = detail.attachedFiles || [];

  // ReportPreview 상수
  const _A4_W = 650;
  const _A4_H = 1500;
  const _rowH  = 800;

  const _isImg = (f) =>
    (f.type || f.mime_type || "").startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name || f.file_name || "");

  const _fileUrl = (f) => {
    if (f.file_path) return `/api/files/${encodeURIComponent(f.file_path)}`;
    if (f.file_name) return `/api/files/${encodeURIComponent(f.file_name)}`;
    return "";
  };

  const _fileLabel = (f) => {
    const label = f.alias_name || f.file_name || f.name || "첨부파일";
    return label.length > 20 ? label.slice(0, 17) + "..." : label;
  };

  // ✅ ReportPreview.chunkedFiles 와 동일한 알고리즘
  const _buildChunkedFiles = (files) => {
    const pages = [];
    let currentPage = [];
    let currentHeight = 0;
    let currentRow = [];
    let currentRowWidth = 0;

    const flushRow = () => {
      if (currentRow.length) {
        currentPage.push([...currentRow]);
        currentRow = [];
        currentRowWidth = 0;
        currentHeight += _rowH;
      }
    };
    const flushPage = () => {
      if (currentPage.length) {
        pages.push([...currentPage]);
        currentPage = [];
        currentHeight = 0;
      }
    };

    files.forEach((f) => {
      const isPortrait = (f.height || 1000) > (f.width || 600);
      const estWidth   = isPortrait ? 300 : 700;
      const estHeight  = _isImg(f) ? _rowH : 200;

      if (currentHeight + estHeight > _A4_H) { flushRow(); flushPage(); }
      if (currentRowWidth + estWidth > _A4_W) { flushRow(); }

      currentRow.push(f);
      currentRowWidth += estWidth;
    });

    if (currentRow.length) flushRow();
    if (currentPage.length) flushPage();
    return pages;
  };

  // ✅ ReportPreview.getImageStyle 와 동일
  const _imgStyle = (file, rowLength, siblings = []) => {
    if (rowLength === 1) {
      const w = file.width || 800;
      const scale = Math.min(1, _A4_W / w);
      return `max-width:${w * scale}px;max-height:1000px;object-fit:contain;`;
    } else if (rowLength === 2 && siblings.length === 2) {
      const w1 = siblings[0].width || 600;
      const w2 = siblings[1].width || 600;
      const scale = Math.min(1, _A4_W / (w1 + w2));
      return `max-width:${(file.width || 600) * scale}px;max-height:900px;object-fit:contain;`;
    }
    return "max-width:100%;max-height:900px;object-fit:contain;";
  };

  // ✅ ReportPreview.getImageWrapperStyle 와 동일
  const _wrapStyle = (rowLength) =>
    rowLength === 1
      ? "width:100%;text-align:center;"
      : "width:45%;text-align:center;";

  const filePageGroups = _buildChunkedFiles(attachedFiles);

  const filePagesHTML = filePageGroups.map((pageRows, pageIdx) => {
    const totalFilePages = filePageGroups.length;

    const rowsHTML = pageRows.map(rowFiles => {
      const cols = rowFiles.map(f => {
        const url = _fileUrl(f);
        const imgTag = _isImg(f) && url
          ? `<img src="${url}" crossorigin="anonymous"
               style="${_imgStyle(f, rowFiles.length, rowFiles)}
                      display:block;margin:0 auto;
                      border-radius:6px;border:1px solid #e5e7eb;
                      box-shadow:0 2px 8px rgba(0,0,0,0.1);" />`
          : `<p style="font-size:0.85em;color:#9ca3af;font-style:italic;text-align:center;">
               (이미지 미리보기를 지원하지 않는 파일 형식입니다)
             </p>`;
        return `<div style="${_wrapStyle(rowFiles.length)}padding:0 8px;box-sizing:border-box;">
          <p style="font-size:0.85em;font-weight:500;color:#374151;margin:0 0 8px;
                    word-break:break-all;text-align:center;">${escHtml(_fileLabel(f))}</p>
          ${imgTag}
        </div>`;
      }).join("");

      return `<div style="display:flex;justify-content:center;gap:24px;margin-top:32px;">${cols}</div>`;
    }).join("");

    return `
<div class="page">
  <h2 class="title-lg" style="font-size:16pt;">
    📎 첨부파일${totalFilePages > 1 ? ` (${pageIdx + 1} / ${totalFilePages})` : ""}
  </h2>
  ${rowsHTML}
</div>`;
  }).join("\n");

  return mainPage + "\n" + filePagesHTML;
}



function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


/** 선택된 모든 건 상세 로드 후 HTML 조합 */
async function buildBulkHTML() {
  const signDataURL = getSignatureDataURL();
  const parts = [];
  for (const id of selectedIds.value) {
    try {
      const detail = await fetchDetail(id);
      parts.push(buildReportHTML(detail, signDataURL));
    } catch (e) {
      console.error("상세 로드 실패 id:", id, e);
    }
  }
  return parts.join("\n");
}

/** ── iframe 생성 + 문서 write 후 이미지 로드 대기 ── */
async function createPrintIframe(bodyHTML, hidden = true) {
  const iframe = document.createElement("iframe");
  if (hidden) {
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1200px;height:2000px;border:0;visibility:hidden;";
  } else {
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  }
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument || iframe.contentWindow.document;
  iDoc.open();
  iDoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${PDF_CSS}</style>
  </head><body>${bodyHTML}</body></html>`);
  iDoc.close();

  // ✅ 모든 이미지(서명 + 첨부파일) 로드 완료 대기 — 최대 5초
  await new Promise(resolve => {
    const checkAndWait = () => {
      const imgs = Array.from(iDoc.querySelectorAll("img"));
      if (imgs.length === 0) return resolve();

      let loaded = 0;
      const done = () => { if (++loaded >= imgs.length) resolve(); };

      imgs.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          done();
        } else if (img.complete) {
          // complete 이지만 naturalWidth === 0 → 에러 or 빈 이미지
          done();
        } else {
          img.onload = done;
          img.onerror = done;
        }
      });
    };

    // DOM 렌더링 후 이미지 상태 확인 (약간의 딜레이 필요)
    setTimeout(() => {
      checkAndWait();
      // 폴백: 최대 5초 대기
      setTimeout(resolve, 5000);
    }, 200);
  });

  // 레이아웃 안정화 대기
  await new Promise(r => setTimeout(r, 300));

  return iframe;
}


/** PDF 일괄 생성 */
const downloadAllPDF = async () => {
  if (selectedIds.value.size === 0) { alert("PDF로 저장할 항목을 선택하세요."); return; }

  showToast("⏳ PDF 생성 중...");

  let iframe = null;
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas-pro");

    const bodyHTML = await buildBulkHTML();
    iframe = await createPrintIframe(bodyHTML, true);
    const iDoc = iframe.contentDocument || iframe.contentWindow.document;

    const pages = iDoc.querySelectorAll(".page");
    const pdf = new jsPDF("p", "mm", "a4");

    const ROW_PX = 45;
    const SIGN_ROW_PX_PDF = 100;

    const pdfCSS = `
      .page { width: 794px !important; padding: 40px !important; box-shadow: none !important; border: none !important; }
      table { table-layout: fixed !important; border-collapse: collapse !important; }
      table:not(.approval-table-left):not(.approval-table-right) { width: 100% !important; }
      .approval-table-left { float: left !important; width: calc(var(--left-col-count, 4) * 11%) !important; }
      .approval-table-right { float: right !important; width: 40% !important; }
      .approval-wrapper { display: block !important; overflow: hidden !important; }
      th, td { height: ${ROW_PX}px !important; box-sizing: border-box !important; vertical-align: middle !important; text-align: center !important; padding: 0 5px !important; }
      .sign-row td { height: ${SIGN_ROW_PX_PDF}px !important; }
      .detail-col { text-align: left !important; padding-left: 12px !important; }
      .amount-col { text-align: right !important; padding-right: 10px !important; }
    `;

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (doc) => {
          doc.documentElement.style.width = "1200px";
          doc.body.style.width = "1200px";
          doc.body.style.margin = "0";
          doc.body.style.padding = "0";

          const style = doc.createElement("style");
          style.textContent = pdfCSS;
          doc.head.appendChild(style);

          const clonedPage = doc.querySelectorAll(".page")[i];
          if (clonedPage) {
            // float clearfix
            const leftT = clonedPage.querySelector(".approval-table-left");
            const rightT = clonedPage.querySelector(".approval-table-right");
            if (leftT && rightT) {
              const wrapper = clonedPage.querySelector(".approval-wrapper");
              if (wrapper) {
                const clear = doc.createElement("div");
                clear.style.clear = "both";
                wrapper.appendChild(clear);
              }
            }
            // transform 제거
            let curr = clonedPage;
            while (curr && curr !== doc.body) {
              curr.style.transform = "none";
              curr.style.position = "static";
              curr.style.margin = "0";
              curr.style.padding = "0";
              curr = curr.parentElement;
            }
            clonedPage.style.display = "block";
            clonedPage.style.width = "794px";
            clonedPage.style.margin = "0 auto";
            clonedPage.style.boxShadow = "none";

            // 대상 페이지만 남기기
            Array.from(doc.body.children).forEach(child => {
              if (!child.contains(clonedPage)) child.remove();
            });
          }
        },
      });

      const img = canvas.toDataURL("image/jpeg", 0.97);
      const pdfW = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * pdfW) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, pdfW, imgH);
    }

    const now = new Date().toISOString().slice(0, 10);
    pdf.save(`재정부_일괄결재_${now}.pdf`);
    showToast("✅ PDF 저장 완료!");
  } catch (e) {
    console.error("PDF 생성 오류:", e);
    alert("PDF 생성 중 오류가 발생했습니다.");
  } finally {
    if (iframe) document.body.removeChild(iframe);
  }
};

/** 프린트 */
const printAll = async () => {
  if (selectedIds.value.size === 0) { alert("프린트할 항목을 선택하세요."); return; }

  showToast("⏳ 프린트 준비 중...");

  let iframe = null;
  try {
    const bodyHTML = await buildBulkHTML();
    iframe = await createPrintIframe(bodyHTML, false);

    // iframe이 존재하는 동안 프린트 호출
    await new Promise(r => setTimeout(r, 300));
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    showToast("🖨️ 프린트 완료!");
  } catch (e) {
    console.error("프린트 오류:", e);
    alert("프린트 중 오류가 발생했습니다.");
  }
  // iframe은 남겨둠 (프린트 다이얼로그 유지)
};

// ─── 마운트 ──────────────────────────────────────────────────
onMounted(async () => {
  await loadCategories();
  if (isFinanceDept.value) {
    await fetchList();
    initCanvas();
  }
});

function initCanvas() {
  const el = signaturePad.value;
  if (!el) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = el.getBoundingClientRect();
  el.width = Math.round(rect.width * ratio);
  el.height = Math.round(rect.height * ratio);
  ctx = el.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  el.addEventListener("mousedown", startDraw);
  el.addEventListener("mousemove", draw);
  el.addEventListener("mouseup", endDraw);
  el.addEventListener("mouseleave", endDraw);
  el.addEventListener("touchstart", startDraw, { passive: false });
  el.addEventListener("touchmove", draw, { passive: false });
  el.addEventListener("touchend", endDraw);

  loadDefaultSignature();
}
</script>

<style scoped>
/* ─── 루트 ───────────────────────────────────────── */
.bulk-approval-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

/* ─── 검색 필터 바 ────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}
.filter-input {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.filter-input:focus { border-color: #a78bfa; }
.btn-search {
  padding: 8px 18px;
  background: #6d28d9;
  color: #fff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-search:hover { background: #5b21b6; }

/* ─── 메인 2분할 레이아웃 ─────────────────────────── */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  align-items: start;
}

/* ─── 공통 패널 ───────────────────────────────────── */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

/* ─── 좌측: 목록 패널 ─────────────────────────────── */
.list-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}
.badge-count {
  background: #ede9fe;
  color: #6d28d9;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
}
.select-all-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #4b5563;
  cursor: pointer;
  user-select: none;
}
.list-table-wrap { overflow-x: auto; }
.list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.list-table thead tr {
  background: #ede9fe;
  color: #374151;
}
.list-table th, .list-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}
.list-table th { font-size: 0.78rem; font-weight: 700; }
.col-check { width: 36px; }
.col-action { width: 64px; }
.list-row {
  cursor: pointer;
  transition: background 0.1s;
}
.list-row:hover { background: #f5f3ff; }
.row-selected { background: #ede9fe !important; }

/* ✅ 건별 결재 버튼 */
.btn-row-detail {
  padding: 4px 12px;
  background: #7c3aed;
  color: #fff;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}
.btn-row-detail:hover { background: #6d28d9; }

.pagination {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 14px;
  border-top: 1px solid #f3f4f6;
}
.page-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
  background: #fff;
  transition: all 0.1s;
}
.page-btn:hover { background: #f5f3ff; border-color: #a78bfa; }
.page-btn.active { background: #6d28d9; color: #fff; border-color: #6d28d9; }

/* ─── 우측: 서명 패널 ─────────────────────────────── */
.sign-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  padding-bottom: 20px;
}
.selected-summary {
  padding: 14px 18px;
  background: #f5f3ff;
  border-bottom: 1px solid #ede9fe;
}
.summary-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 8px;
}
.summary-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 140px;
  overflow-y: auto;
}
.summary-list li { font-size: 0.8rem; color: #374151; }
.tag-dept {
  background: #ddd6fe;
  color: #5b21b6;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.72rem;
  font-weight: 600;
  margin-right: 4px;
}
.empty-sign {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  border-bottom: 1px solid #f3f4f6;
}

/* ✅ sign-section: 좌우 padding 을 패널 전체에 통일 */
.sign-section {
  padding: 16px 18px 0;
}
.sign-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #374151;
  display: block;
  margin-bottom: 6px;
}
.sign-canvas {
  width: 100%;
  height: 160px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: crosshair;
  display: block;
}
.btn-clear {
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.78rem;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.1s;
}
.btn-clear:hover { background: #e5e7eb; }

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 10px;
  padding: 16px 18px 0;
  flex-wrap: wrap;
}
.btn-approve {
  flex: 1 1 100%;
  padding: 11px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-approve:hover { opacity: 0.9; }
.btn-approve:disabled { opacity: 0.6; cursor: not-allowed; }
/* 프린트 버튼 — 다크 그레이 */
.btn-print {
  flex: 1;
  padding: 9px 8px;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: opacity 0.15s;
  background: linear-gradient(135deg, #374151, #1f2937);
  color: #fff;
}
.btn-print:hover { opacity: 0.85; }

/* PDF 저장 버튼 — 레드 (Adobe PDF 컬러) */
.btn-pdf {
  flex: 1;
  padding: 9px 8px;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: opacity 0.15s;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
}
.btn-pdf:hover { opacity: 0.85; }


/* 진행 바 */
.progress-bar-wrap { padding: 12px 18px 0; }
.progress-label { font-size: 0.78rem; color: #6b7280; margin-bottom: 6px; text-align: right; }
.progress-track {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
  border-radius: 9999px;
  transition: width 0.3s;
}

/* ─── 토스트 ──────────────────────────────────────── */
.bulk-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: #1f2937;
  color: #fff;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; }

/* ─── 커스텀 Confirm 모달 ─────────────────────────── */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-box {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
  padding: 28px 32px 22px;
  min-width: 320px;
  max-width: 420px;
  text-align: center;
  animation: confirmPop 0.18s ease-out;
}
@keyframes confirmPop {
  from { opacity: 0; transform: scale(0.93); }
  to   { opacity: 1; transform: scale(1); }
}
.confirm-msg {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.6;
  margin-bottom: 22px;
  white-space: pre-line;
}
.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.confirm-cancel {
  padding: 9px 26px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.confirm-cancel:hover { background: #f3f4f6; }
.confirm-ok {
  padding: 9px 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.12s;
}
.confirm-ok:hover { opacity: 0.88; }

.confirm-fade-enter-active, .confirm-fade-leave-active { transition: opacity 0.18s ease; }
.confirm-fade-enter-from, .confirm-fade-leave-to { opacity: 0; }
</style>

