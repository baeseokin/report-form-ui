<template>
  <div class="p-6 font-nanum">
    <!-- ✅ 검색조건 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-6 items-end">
      <!-- 부서명 (재정부 or 관리자는 전체 또는 특정 부서 선택 가능, 그 외는 본인 부서로 고정) -->
      <div v-if="canEditDept" class="flex flex-col w-44">
        <label class="font-semibold text-gray-600 mb-1 text-sm">부서명</label>
        <select
          v-model="filters.deptName"
          @change="fetchPayments(1)"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        >
          <option value="">전체</option>
          <option v-for="d in departmentOptions" :key="d.id ?? d.dept_name" :value="d.dept_name">
            {{ d.dept_name }}
          </option>
        </select>
      </div>
      <div v-else class="flex flex-col w-44">
        <label class="font-semibold text-gray-600 mb-1 text-sm">부서명</label>
        <input
          type="text"
          :value="user?.deptName || '-'"
          disabled
          class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 w-full text-sm text-gray-600 cursor-not-allowed outline-none"
        />
      </div>

      <!-- 신청 시작일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">신청 시작일자</label>
        <input
          type="date"
          v-model="filters.startDate"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition text-sm"
        />
      </div>

      <!-- 신청 종료일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">신청 종료일자</label>
        <input
          type="date"
          v-model="filters.endDate"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition text-sm"
        />
      </div>

      <!-- 줄바꿈 (대화면에서 관/항이 2열 배치되도록 유도) -->
      <div class="w-full hidden lg:block border-b border-gray-100 my-1"></div>

      <!-- 관 -->
      <div class="flex flex-col w-36">
        <label class="font-semibold text-gray-600 mb-1 text-sm">관</label>
        <select
          v-model="filters.selectedGwan"
          @change="filters.selectedHang = ''; fetchPayments(1)"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition text-sm"
        >
          <option value="">전체</option>
          <option v-for="g in gwans" :key="g.category_id" :value="g.category_id">
            {{ g.category_name }}
          </option>
        </select>
      </div>

      <!-- 항 -->
      <div class="flex flex-col w-36">
        <label class="font-semibold text-gray-600 mb-1 text-sm">항</label>
        <select
          v-model="filters.selectedHang"
          @change="fetchPayments(1)"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition text-sm"
        >
          <option value="">전체</option>
          <option v-for="h in hangs" :key="h.category_id" :value="h.category_id">
            {{ h.category_name }}
          </option>
        </select>
      </div>

      <!-- 검색어 -->
      <div class="flex flex-col w-80">
        <label class="font-semibold text-gray-600 mb-1 text-sm">검색어 (지출내역/신청자)</label>
        <input
          type="text"
          v-model="filters.keyword"
          placeholder="지출내역 또는 신청자 입력"
          @keyup.enter="fetchPayments(1)"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition text-sm"
        />
      </div>

      <!-- 조회 및 엑셀 다운로드 버튼 -->
      <div class="flex items-end gap-2">
        <button
          @click="fetchPayments(1)"
          :disabled="loading"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="loading" class="inline-block animate-spin">🔄</span>
          <span>조회</span>
        </button>

        <button
          type="button"
          @click="downloadExcel"
          :disabled="downloadingExcel || totalCount === 0"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title="검색 조건에 맞는 전체 지출내역 엑셀 파일 다운로드"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span v-if="downloadingExcel">다운로드 생성 중...</span>
          <span v-else>엑셀 다운로드</span>
        </button>
      </div>
    </div>

    <!-- ✅ 목록 상단 우측 요약 정보 (지출 건수, 합계금액) -->
    <div class="flex justify-end items-center mb-2 px-1 text-sm text-gray-600 gap-3">
      <div>
        <span>지출 건수:</span>
        <strong class="font-bold text-gray-900 ml-1">{{ Number(totalCount || 0).toLocaleString() }}</strong>건
      </div>
      <span class="text-gray-300">|</span>
      <div>
        <span>합계금액:</span>
        <strong class="font-bold text-purple-700 ml-1">{{ Number(totalAmount || 0).toLocaleString() }}</strong>원
      </div>
    </div>

    <!-- 결과 목록 데이터 테이블 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div tabindex="0" role="region" aria-label="지출내역 목록" class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-purple-100 text-gray-700 font-bold">
              <th class="border p-3 text-center w-32">부서명</th>
              <th class="border p-3 text-center w-28">신청일자</th>
              <th class="border p-3 text-center w-24">신청자</th>
              <th class="border p-3 text-center w-44">관/항</th>
              <th class="border p-3 text-center w-44">목/세목</th>
              <th class="border p-3 text-center">지출내역</th>
              <th class="border p-3 text-center w-36">청구금액</th>
              <th class="border p-3 text-center w-20">상세</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && payments.length === 0">
              <td colspan="8" class="border p-12 text-center text-gray-400">
                <div class="inline-block animate-spin text-xl mb-2">🔄</div>
                <div>지출내역을 불러오는 중입니다...</div>
              </td>
            </tr>
            <tr v-else-if="payments.length === 0">
              <td colspan="8" class="border p-12 text-center text-gray-500">
                조회된 지출내역이 없습니다.
              </td>
            </tr>
            <tr
              v-for="item in payments"
              :key="item.item_id"
              @click="openPreview(item.request_id)"
              class="hover:bg-purple-50 transition text-sm h-11 cursor-pointer"
            >
              <td class="border p-3 text-center">{{ item.dept_name || '-' }}</td>
              <td class="border p-3 text-center">{{ formatDate(item.request_date) }}</td>
              <td class="border p-3 text-center">{{ item.author || '-' }}</td>
              <td class="border p-3 text-center">
                {{ formatGwanHang(item) }}
              </td>
              <td class="border p-3 text-center">
                {{ formatMokSemok(item) }}
              </td>
              <td class="border p-3 text-left">
                <span :title="item.detail" class="font-medium text-gray-900">{{ item.detail || '-' }}</span>
              </td>
              <td class="border p-3 text-right font-mono font-semibold text-gray-900">
                {{ formatAmount(item.amount) }}원
              </td>
              <td class="border p-2 text-center" @click.stop>
                <button
                  type="button"
                  @click="openPreview(item.request_id)"
                  class="p-1.5 rounded-lg hover:bg-purple-100 transition text-purple-700"
                  title="지출결의서 상세보기"
                >
                  👁
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ✅ 하단 페이지네이션 -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-1.5 mt-6">
      <button
        type="button"
        @click="fetchPayments(currentPage - 1)"
        :disabled="currentPage <= 1"
        class="px-3 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        이전
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        @click="fetchPayments(page)"
        :class="[
          'px-3.5 py-1.5 border rounded-lg text-sm font-medium transition',
          currentPage === page
            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
            : 'bg-white hover:bg-gray-100 text-gray-700'
        ]"
      >
        {{ page }}
      </button>

      <button
        type="button"
        @click="fetchPayments(currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="px-3 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        다음
      </button>
    </div>

    <!-- 지출결의서 상세보기 모달 -->
    <ReportPreview
      v-if="previewReport"
      :report="previewReport"
      @close="previewReport = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import axios from "axios";
import ExcelJS from "exceljs";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";

const ReportPreview = defineAsyncComponent(() => import("./ReportPreview.vue"));

const { user } = storeToRefs(useUserStore());

const payments = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const totalAmount = ref(0);
const pageSize = 15;
const loading = ref(false);
const downloadingExcel = ref(false);
const previewReport = ref(null);

const departments = ref([]);
const allCategories = ref([]);

// 날짜 초기값: 최근 1개월
const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const formatDateValue = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const filters = ref({
  deptName: "",
  startDate: formatDateValue(oneMonthAgo),
  endDate: formatDateValue(today),
  selectedGwan: "",
  selectedHang: "",
  keyword: "",
});

// ✅ 권한 체크: 재정부 or 관리자만 부서 변경 가능
const canEditDept = computed(() => {
  if (!user.value?.roles) return false;
  return user.value.roles.some(
    (r) => r.role_name === "재정부" || r.role_name === "관리자"
  ) || user.value.deptName === "재정부" || user.value.deptName === "교회";
});

// ✅ 부서 옵션: 관리자/재정부는 전체 목록, 그 외는 본인 부서만
const departmentOptions = computed(() => {
  const list = (departments.value || []).slice().sort((a, b) => (a.dept_name || "").localeCompare(b.dept_name || ""));
  if (canEditDept.value) return list;
  const deptName = user.value?.deptName;
  if (!deptName) return list;
  const mine = list.find((d) => d.dept_name === deptName);
  return mine ? [mine] : [{ id: null, dept_name: deptName }];
});

// ✅ 관 목록
const gwans = computed(() => {
  const list = allCategories.value.filter((c) => c.level === "관");
  const unique = [];
  const map = new Map();
  for (const item of list) {
    if (!map.has(item.category_id)) {
      map.set(item.category_id, true);
      unique.push(item);
    }
  }
  return unique;
});

// ✅ 선택된 관에 속한 항 목록
const hangs = computed(() => {
  if (!filters.value.selectedGwan) return [];
  const gwan = gwans.value.find((g) => String(g.category_id) === String(filters.value.selectedGwan));
  if (!gwan) return [];

  const list = allCategories.value.filter(
    (c) => c.level === "항" && String(c.parent_id) === String(gwan.category_id)
  );

  const unique = [];
  const map = new Map();
  for (const item of list) {
    if (!map.has(item.category_id)) {
      map.set(item.category_id, true);
      unique.push(item);
    }
  }
  return unique;
});

// ✅ 페이지네이션 버튼 번호 계산 (현재 페이지 주변 최대 5~7개)
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - 3);
  let end = Math.min(total, current + 3);
  if (start === 1) {
    end = 7;
  } else if (end === total) {
    start = total - 6;
  }
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

onMounted(async () => {
  try {
    const [deptRes, catRes] = await Promise.all([
      axios.get("/api/departments"),
      axios.get("/api/accountCategories/all")
    ]);
    departments.value = deptRes.data || [];
    allCategories.value = catRes.data?.categories || [];
  } catch (e) {
    console.error("기본 데이터 로드 실패:", e);
  }

  // 일반 사용자인 경우 본인 부서로 기본 세팅
  if (user.value?.deptName && !canEditDept.value) {
    filters.value.deptName = user.value.deptName;
  }

  fetchPayments(1);
});

// ✅ 지출내역 목록 조회
const fetchPayments = async (page = 1) => {
  if (page < 1 || (totalPages.value > 0 && page > totalPages.value && totalPages.value >= 1)) return;
  currentPage.value = page;
  loading.value = true;

  try {
    const res = await axios.post("/api/paymentHistory", {
      ...filters.value,
      page,
      pageSize,
    });

    payments.value = res.data.rows || [];
    totalPages.value = res.data.totalPages || 1;
    totalCount.value = res.data.totalCount ?? 0;
    totalAmount.value = res.data.totalAmount ?? 0;
  } catch (err) {
    console.error("지출내역 조회 실패:", err);
    payments.value = [];
    totalCount.value = 0;
    totalAmount.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatGwanHang = (item) => {
  const gwan = item.gwan_name || item.gwan;
  const hang = item.hang_name || item.hang;
  if (gwan && hang) return `${gwan} / ${hang}`;
  if (gwan) return gwan;
  if (hang) return hang;
  return "-";
};

const formatMokSemok = (item) => {
  const rawMok = item.mok_name || item.mok;
  const rawSemok = item.semok_name || item.semok;
  const mok = rawMok && rawMok !== "-" ? rawMok : "";
  const semok = rawSemok && rawSemok !== "-" ? rawSemok : "";
  if (mok && semok) return `${mok} / ${semok}`;
  if (mok) return mok;
  if (semok) return semok;
  return "-";
};

const formatAmount = (val) => {
  if (val === null || val === undefined) return "0";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("ko-KR");
};

// ✅ 결재 상세 미리보기 모달 열기
const openPreview = async (requestId) => {
  if (!requestId) return;
  try {
    const res = await axios.get(`/api/approval/detail/${requestId}`);
    previewReport.value = {
      id: res.data.id,
      documentType: res.data.document_type,
      deptName: res.data.dept_name,
      author: res.data.author,
      payee: res.data.payee,
      date: res.data.request_date,
      totalAmount: res.data.total_amount,
      comment: res.data.comment,
      remarks: res.data.remarks,
      aliasName: res.data.aliasName,
      accountInfo: res.data.accountInfo,
      requesterPhone: res.data.requesterPhone,
      selectedGwan: res.data.selectedGwan,
      selectedHang: res.data.selectedHang,
      items: res.data.items || [],
      budgetPlanItems: res.data.budgetPlanItems || [],
      targetYear: res.data.targetYear || null,
      attachedFiles: res.data.attachedFiles || [],
      approvalHistory: res.data.approvalHistory || []
    };
  } catch (err) {
    console.error("상세보기 로드 실패:", err);
  }
};

// ✅ 엑셀 다운로드 (exceljs 활용)
const downloadExcel = async () => {
  if (downloadingExcel.value) return;
  downloadingExcel.value = true;

  try {
    // 1. 현재 검색조건의 전체 데이터 요청
    const res = await axios.post("/api/paymentHistory", {
      ...filters.value,
      isExcel: true
    });

    const rows = res.data.rows || [];
    if (rows.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 2. Excel 워크북 및 시트 생성
    const wb = new ExcelJS.Workbook();
    wb.creator = "원천교회 재정부 지출청구 시스템";
    wb.created = new Date();

    const ws = wb.addWorksheet("지출내역", {
      views: [{ showGridLines: true }]
    });

    // 3. 타이틀 행
    ws.mergeCells("A1:I1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "지출내역 현황";
    titleCell.font = { name: "NanumGothic", size: 16, bold: true, color: { argb: "FF1E1B4B" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 36;

    // 4. 메타 정보 행
    ws.mergeCells("A2:I2");
    const metaCell = ws.getCell("A2");
    const deptLabel = filters.value.deptName || (canEditDept.value ? "전체" : user.value?.deptName || "전체");
    const periodLabel = `${filters.value.startDate || "시작일"} ~ ${filters.value.endDate || "종료일"}`;
    metaCell.value = `[부서: ${deptLabel}]  [기간: ${periodLabel}]  [조회건수: ${rows.length.toLocaleString()}건]  [합계금액: ${Number(res.data.totalAmount || 0).toLocaleString()}원]  [다운로드일시: ${new Date().toLocaleString("ko-KR")}]`;
    metaCell.font = { name: "NanumGothic", size: 9, color: { argb: "FF4B5563" } };
    metaCell.alignment = { horizontal: "right", vertical: "middle" };
    ws.getRow(2).height = 20;

    // 빈 줄
    ws.getRow(3).height = 8;

    // 5. 헤더 정의
    const headers = ["순번", "부서명", "신청일자", "신청자", "관/항", "목/세목", "지출내역", "청구금액", "지급처(수령인)"];
    const headerRow = ws.getRow(4);
    headerRow.values = headers;
    headerRow.height = 26;

    const thinBorder = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };

    headers.forEach((_, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.font = { name: "NanumGothic", size: 10, bold: true, color: { argb: "FF374151" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3E8FF" } // soft purple
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thinBorder;
    });

    // 6. 데이터 행 작성
    let currentRowIdx = 5;
    let sumAmount = 0;

    rows.forEach((r, idx) => {
      const row = ws.getRow(currentRowIdx);
      const amount = Number(r.amount || 0);
      sumAmount += amount;

      row.values = [
        idx + 1,
        r.dept_name || "-",
        formatDate(r.request_date),
        r.author || "-",
        formatGwanHang(r),
        formatMokSemok(r),
        r.detail || "-",
        amount,
        r.payee || "-"
      ];
      row.height = 22;

      // 셀별 스타일
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(8).numFmt = "#,##0";
      row.getCell(9).alignment = { horizontal: "center", vertical: "middle" };

      for (let c = 1; c <= 9; c++) {
        const cell = row.getCell(c);
        cell.font = { name: "NanumGothic", size: 9 };
        cell.border = thinBorder;
      }

      currentRowIdx++;
    });

    // 7. 합계 행 작성
    const summaryRow = ws.getRow(currentRowIdx);
    summaryRow.height = 25;
    ws.mergeCells(`A${currentRowIdx}:G${currentRowIdx}`);
    const sumLabelCell = summaryRow.getCell(1);
    sumLabelCell.value = "합 계";
    sumLabelCell.font = { name: "NanumGothic", size: 10, bold: true, color: { argb: "FF1E1B4B" } };
    sumLabelCell.alignment = { horizontal: "center", vertical: "middle" };

    const sumValCell = summaryRow.getCell(8);
    sumValCell.value = sumAmount;
    sumValCell.numFmt = "#,##0";
    sumValCell.font = { name: "NanumGothic", size: 10, bold: true, color: { argb: "FF6D28D9" } };
    sumValCell.alignment = { horizontal: "right", vertical: "middle" };

    const emptyCell = summaryRow.getCell(9);
    emptyCell.value = "";

    for (let c = 1; c <= 9; c++) {
      const cell = summaryRow.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" }
      };
      cell.border = thinBorder;
    }

    // 8. 열 너비 자동 조정
    ws.columns = [
      { width: 8 },  // 순번
      { width: 16 }, // 부서명
      { width: 14 }, // 신청일자
      { width: 12 }, // 신청자
      { width: 24 }, // 관/항
      { width: 24 }, // 목/세목
      { width: 36 }, // 지출내역
      { width: 16 }, // 청구금액
      { width: 16 }, // 지급처
    ];

    // 9. 다운로드 실행
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = formatDateValue(new Date()).replace(/-/g, "");
    const safeDept = (deptLabel || "전체").replace(/[\/\\?%*:|"<>]/g, "");
    a.href = url;
    a.download = `지출내역_${safeDept}_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("엑셀 다운로드 오류:", err);
    alert("엑셀 다운로드 중 오류가 발생했습니다.");
  } finally {
    downloadingExcel.value = false;
  }
};
</script>
