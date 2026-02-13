<template>
  <div class="p-6 font-nanum">
    <!-- ✅ 검색조건 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-6 items-end">
      <!-- 기준년도 -->
      <div class="flex flex-col">
        <label class="font-semibold text-gray-600 mb-1 text-sm">기준년도</label>
        <input
          type="number"
          v-model="filters.year"
          class="bg-white border border-gray-200 rounded-lg px-3 py-2 w-28 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition"
        />
      </div>
      <button
        type="button"
        @click="fetchBudgetStatus"
        class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
      >
        조회
      </button>
    </div>

    <!-- ✅ 결과 목록 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-800">
            <th class="border p-2 w-32">관</th>
            <th class="border p-2">항</th>
            <th class="border p-2">항ID</th>
            <th class="border p-2 text-center">총예산액</th>
            <th class="border p-2 text-center">총지출액</th>
            <th class="border p-2 text-center">잔액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in budgetRows" :key="row.dept_id||row.gwan_name||row.hang_name"
              :class="row.remaining_amount < 0 ? 'bg-red-100 text-red-700 font-semibold' : 'bg-white'">
            <td 
              v-if="row.gwanRowSpan > 0" 
              :rowspan="row.gwanRowSpan" 
              class="border p-2 align-top bg-white text-gray-800 font-medium"
            >{{ row.gwan_name }}</td>
            <td class="border p-2">{{ row.hang_name }}</td>
            <td class="border p-2 text-center text-gray-500 text-xs">{{ row.hang_category_id }}</td>
            <td class="border p-2 text-right">{{ formatAmount(row.total_budget) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(row.total_expense) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(row.remaining_amount) }}</td>
          </tr>

          <tr v-if="budgetRows.length === 0">
            <td colspan="6" class="text-center p-4 text-gray-500">데이터가 없습니다.</td>
          </tr>

          <!-- 합계 -->
          <tr v-else class="font-bold bg-gray-200">
            <td class="border p-2 text-center">합계</td>
            <td class="border p-2"></td>
            <td class="border p-2"></td>
            <td class="border p-2 text-right">{{ formatAmount(totals.budget) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(totals.expense) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(totals.remaining) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const today = new Date();
const currentYear = today.getFullYear();

const filters = ref({
  year: currentYear,
});

const budgetRows = ref([]);
const totals = ref({ budget: 0, expense: 0, remaining: 0 });
const fetchRequestId = ref(0);

const fetchBudgetStatus = async () => {
  try {
    const requestId = ++fetchRequestId.value;
    budgetRows.value = [];
    totals.value = { budget: 0, expense: 0, remaining: 0 };
    
    const params = { 
      year: filters.value.year,
    };

    const res = await axios.get("/api/budget-status", {
      params,
    });
    if (requestId !== fetchRequestId.value) return;
    const rows = Array.isArray(res.data) ? res.data : [];

    let processedRows = [];

    // ✅ 클라이언트 사이드 집계 및 필터링
    const map = new Map();
    rows.forEach((r) => {
      // 계정(관/항) 기준으로 집계
      const key = r.hang_category_id;
      if (!map.has(key)) {
        // 전체 조회 시에는 '항' 전체 예산(hang_total_budget)을 사용
        const budget = r.hang_total_budget;
        map.set(key, {
          ...r,
          total_budget: budget,
          total_expense: 0,
        });
      }
      const entry = map.get(key);
      // 지출액은 부서별 합산 (Owner 부서 필터링 된 경우 해당 계정의 모든 지출 합산)
      entry.total_expense += Number(r.total_expense);
    });

    processedRows = Array.from(map.values()).map((r) => ({
      ...r,
      remaining_amount: Number(r.total_budget) - r.total_expense,
    }));
    
    // 정렬 (관 ID -> 항 ID). API ORDER BY gwan.category_id, hang.category_id 와 동일하게
    processedRows.sort((a, b) => {
      const gwanA = String(a.gwan_category_id ?? a.gwan_name ?? "");
      const gwanB = String(b.gwan_category_id ?? b.gwan_name ?? "");
      const gwanCmp = gwanA.localeCompare(gwanB, undefined, { numeric: true });
      return gwanCmp !== 0 ? gwanCmp : String(a.hang_category_id).localeCompare(String(b.hang_category_id), undefined, { numeric: true });
    });

    // ✅ 관(Gwan) 셀 병합 계산
    if (processedRows.length > 0) {
      let lastGwan = null;
      let lastGwanIndex = 0;
      processedRows.forEach((row, index) => {
        if (row.gwan_name !== lastGwan) {
          lastGwan = row.gwan_name;
          lastGwanIndex = index;
          row.gwanRowSpan = 1;
        } else {
          row.gwanRowSpan = 0;
          processedRows[lastGwanIndex].gwanRowSpan++;
        }
      });
    }

    budgetRows.value = processedRows;

    // ✅ 합계 계산
    const totalBudget = processedRows.reduce((sum, r) => sum + Number(r.total_budget), 0);
    const totalExpense = processedRows.reduce((sum, r) => sum + Number(r.total_expense), 0);
    const totalRemaining = processedRows.reduce((sum, r) => sum + Number(r.remaining_amount), 0);

    totals.value = {
      budget: totalBudget,
      expense: totalExpense,
      remaining: totalRemaining,
    };
  } catch (err) {
    console.error("예산 현황 조회 실패:", err);
    budgetRows.value = [];
    totals.value = { budget: 0, expense: 0, remaining: 0 };
  }
};

onMounted(() => {
  fetchBudgetStatus();
});

const formatAmount = (val) => {
  if (val === null || val === undefined) return "";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};
</script>
