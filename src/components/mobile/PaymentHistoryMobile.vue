<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen pb-16">
    <!-- ✅ 검색조건 접기/펼치기 아코디언 -->
    <div class="mb-4 bg-purple-100 rounded-lg border border-purple-200 shadow-sm overflow-hidden">
      <!-- 접힌 상태: 터치하면 펼침 -->
      <button
        type="button"
        @click="searchExpanded = true"
        class="w-full flex items-center justify-between p-3 text-left hover:bg-purple-200 active:bg-purple-300 transition"
        :class="{ 'hidden': searchExpanded }"
      >
        <span class="font-semibold text-gray-700 text-sm">검색조건</span>
        <span class="text-xs text-gray-500 truncate flex-1 mx-2">{{ searchConditionSummary }}</span>
        <span class="text-gray-400 shrink-0 text-xs">▼</span>
      </button>

      <!-- 펼친 상태: 조건 영역 -->
      <div v-show="searchExpanded" class="border-t border-purple-200">
        <button
          type="button"
          @click="searchExpanded = false"
          class="w-full flex items-center justify-between p-3 text-left bg-purple-200 hover:bg-purple-300 active:bg-purple-400 transition"
        >
          <span class="font-semibold text-gray-700 text-sm">검색조건 접기</span>
          <span class="text-gray-400 text-xs">▲</span>
        </button>

        <div class="p-4 space-y-3 bg-white">
          <!-- 부서명 -->
          <div v-if="canEditDept">
            <label class="block text-xs font-semibold text-gray-600 mb-1">부서명</label>
            <select
              v-model="filters.deptName"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">전체</option>
              <option v-for="d in departmentOptions" :key="d.id ?? d.dept_name" :value="d.dept_name">
                {{ d.dept_name }}
              </option>
            </select>
          </div>
          <div v-else>
            <label class="block text-xs font-semibold text-gray-600 mb-1">부서명</label>
            <input
              type="text"
              :value="user?.deptName || '-'"
              disabled
              class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-100 text-gray-500 outline-none"
            />
          </div>

          <!-- 신청 시작일자 -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">신청 시작일자</label>
            <input
              type="date"
              v-model="filters.startDate"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <!-- 신청 종료일자 -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">신청 종료일자</label>
            <input
              type="date"
              v-model="filters.endDate"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <!-- 관 -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">관</label>
            <select
              v-model="filters.selectedGwan"
              @change="filters.selectedHang = '';"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">전체</option>
              <option v-for="g in gwans" :key="g.category_id" :value="g.category_id">
                {{ g.category_name }}
              </option>
            </select>
          </div>

          <!-- 항 -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">항</label>
            <select
              v-model="filters.selectedHang"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">전체</option>
              <option v-for="h in hangs" :key="h.category_id" :value="h.category_id">
                {{ h.category_name }}
              </option>
            </select>
          </div>

          <!-- 검색어 -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">검색어 (지출내역/신청자)</label>
            <input
              type="text"
              v-model="filters.keyword"
              placeholder="검색어 입력"
              @keyup.enter="handleSearch"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            type="button"
            @click="handleSearch"
            :disabled="loading"
            class="w-full py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 active:bg-black transition text-sm flex items-center justify-center gap-1.5"
          >
            <span v-if="loading" class="animate-spin text-sm">🔄</span>
            <span>조회</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ 상단 툴바: 엑셀 다운로드 버튼 + 건수/합계 요약 -->
    <div class="flex items-center justify-between mb-3 px-1">
      <button
        type="button"
        @click="downloadExcel"
        :disabled="downloadingExcel || totalCount === 0"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 active:bg-emerald-700 text-white rounded-lg transition font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{{ downloadingExcel ? "생성중..." : "엑셀 다운로드" }}</span>
      </button>

      <div class="text-xs text-gray-600 flex items-center gap-2">
        <span>건수: <strong class="text-gray-900 font-bold">{{ Number(totalCount || 0).toLocaleString() }}</strong>건</span>
        <span class="text-gray-300">|</span>
        <span>합계: <strong class="text-purple-700 font-bold">{{ Number(totalAmount || 0).toLocaleString() }}</strong>원</span>
      </div>
    </div>

    <!-- ✅ 카드 리스트 뷰 -->
    <div v-if="loading && payments.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
      <div class="animate-spin text-xl mb-2">🔄</div>
      <div class="text-sm">지출내역을 불러오는 중입니다...</div>
    </div>

    <div v-else-if="payments.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 text-sm">
      조회된 지출내역이 없습니다.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in payments"
        :key="item.item_id"
        @click="openPreview(item.request_id)"
        class="bg-white rounded-lg shadow-sm p-4 border border-gray-200 active:bg-purple-50 transition"
      >
        <!-- 상단 헤더: 부서명 뱃지 + 신청일자 -->
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {{ item.dept_name || '-' }}
          </span>
          <span class="text-xs text-gray-400">
            {{ formatDate(item.request_date) }}
          </span>
        </div>

        <!-- 본문: 지출내역 -->
        <div class="text-base font-bold text-gray-900 mb-1.5 leading-snug">
          {{ item.detail || '-' }}
        </div>

        <!-- 관/항 및 목/세목 칩 -->
        <div class="mb-2 flex flex-wrap gap-1.5">
          <span class="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
            {{ formatGwanHang(item) }}
          </span>
          <span v-if="formatMokSemok(item) !== '-'" class="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            {{ formatMokSemok(item) }}
          </span>
        </div>

        <!-- 하단: 신청자 및 금액 -->
        <div class="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
          <span class="text-xs text-gray-500">
            신청자: <strong class="text-gray-700 font-medium">{{ item.author || '-' }}</strong>
          </span>
          <div class="text-right">
            <span class="text-base font-bold font-mono text-purple-700">{{ formatAmount(item.amount) }}</span>
            <span class="text-xs text-gray-600 ml-0.5">원</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 모바일 페이지네이션 -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
      <button
        type="button"
        @click="fetchPayments(currentPage - 1)"
        :disabled="currentPage <= 1"
        class="px-3 py-1.5 border rounded-lg text-xs bg-white active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        이전
      </button>

      <span class="text-xs font-medium text-gray-700 px-2">
        {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        type="button"
        @click="fetchPayments(currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="px-3 py-1.5 border rounded-lg text-xs bg-white active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";

const ReportPreview = defineAsyncComponent(() => import("../ReportPreview.vue"));

const { user } = storeToRefs(useUserStore());

const payments = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const totalAmount = ref(0);
const pageSize = 15;
const loading = ref(false);
const downloadingExcel = ref(false);
const searchExpanded = ref(false);
const previewReport = ref(null);

const departments = ref([]);
const allCategories = ref([]);

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

const canEditDept = computed(() => {
  if (!user.value?.roles) return false;
  return user.value.roles.some(
    (r) => r.role_name === "재정부" || r.role_name === "관리자"
  ) || user.value.deptName === "재정부" || user.value.deptName === "교회";
});

const departmentOptions = computed(() => {
  const list = (departments.value || []).slice().sort((a, b) => (a.dept_name || "").localeCompare(b.dept_name || ""));
  if (canEditDept.value) return list;
  const deptName = user.value?.deptName;
  if (!deptName) return list;
  const mine = list.find((d) => d.dept_name === deptName);
  return mine ? [mine] : [{ id: null, dept_name: deptName }];
});

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

const searchConditionSummary = computed(() => {
  const parts = [];
  if (filters.value.deptName) parts.push(filters.value.deptName);
  if (filters.value.keyword) parts.push(`"${filters.value.keyword}"`);
  if (parts.length === 0) return "전체 검색";
  return parts.join(", ");
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
    console.error("데이터 로드 실패:", e);
  }

  if (user.value?.deptName && !canEditDept.value) {
    filters.value.deptName = user.value.deptName;
  }

  fetchPayments(1);
});

const handleSearch = () => {
  searchExpanded.value = false;
  fetchPayments(1);
};

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

const downloadExcel = async () => {
  if (downloadingExcel.value) return;
  downloadingExcel.value = true;

  try {
    const res = await axios.post("/api/paymentHistory", {
      ...filters.value,
      isExcel: true
    });

    const rows = res.data.rows || [];
    if (rows.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "원천교회 재정부 지출청구 시스템";
    wb.created = new Date();

    const ws = wb.addWorksheet("지출내역", {
      views: [{ showGridLines: true }]
    });

    ws.mergeCells("A1:I1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "지출내역 현황";
    titleCell.font = { name: "NanumGothic", size: 16, bold: true, color: { argb: "FF1E1B4B" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 36;

    ws.mergeCells("A2:I2");
    const metaCell = ws.getCell("A2");
    const deptLabel = filters.value.deptName || (canEditDept.value ? "전체" : user.value?.deptName || "전체");
    const periodLabel = `${filters.value.startDate || "시작일"} ~ ${filters.value.endDate || "종료일"}`;
    metaCell.value = `[부서: ${deptLabel}]  [기간: ${periodLabel}]  [조회건수: ${rows.length.toLocaleString()}건]  [합계금액: ${Number(res.data.totalAmount || 0).toLocaleString()}원]  [다운로드일시: ${new Date().toLocaleString("ko-KR")}]`;
    metaCell.font = { name: "NanumGothic", size: 9, color: { argb: "FF4B5563" } };
    metaCell.alignment = { horizontal: "right", vertical: "middle" };
    ws.getRow(2).height = 20;

    ws.getRow(3).height = 8;

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
        fgColor: { argb: "FFF3E8FF" }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thinBorder;
    });

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

    for (let c = 1; c <= 9; c++) {
      const cell = summaryRow.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" }
      };
      cell.border = thinBorder;
    }

    ws.columns = [
      { width: 8 },
      { width: 16 },
      { width: 14 },
      { width: 12 },
      { width: 24 },
      { width: 24 },
      { width: 36 },
      { width: 16 },
      { width: 16 },
    ];

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
