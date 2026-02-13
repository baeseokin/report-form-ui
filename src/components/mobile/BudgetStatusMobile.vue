<template>
  <div class="p-4 font-nanum min-h-[calc(100vh-4rem)] flex flex-col gap-4">
    <!-- 검색조건 접기/펼치기 (보라색 스타일) -->
    <div class="mb-4 bg-purple-100 rounded-lg border border-purple-200 shadow-sm overflow-hidden">
      <!-- 접힌 상태: 터치하면 펼침 -->
      <button
        type="button"
        @click="searchExpanded = true"
        class="w-full flex items-center justify-between p-3 text-left hover:bg-purple-200 active:bg-purple-300 transition"
        :class="{ 'hidden': searchExpanded }"
      >
        <span class="font-semibold text-gray-700">검색조건</span>
        <span class="text-sm text-gray-500 truncate flex-1 mx-2">{{ searchConditionSummary }}</span>
        <span class="text-gray-400 shrink-0">▼</span>
      </button>

      <!-- 펼친 상태: 조건 영역 -->
      <div v-show="searchExpanded" class="border-t border-purple-200">
        <button
          type="button"
          @click="searchExpanded = false"
          class="w-full flex items-center justify-between p-3 text-left bg-purple-200 hover:bg-purple-300 active:bg-purple-400 transition"
        >
          <span class="font-semibold text-gray-700">검색조건 접기</span>
          <span class="text-gray-400">▲</span>
        </button>
        <div class="p-3 pt-4 space-y-3 bg-white">
          <div>
            <label class="block text-sm mb-1">기준년도</label>
            <input
              type="number"
              v-model="filters.year"
              min="2000"
              max="2100"
              class="mobile-form-control w-full"
            />
          </div>
          <button
            type="button"
            @click="fetchBudgetStatus"
            class="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-purple-700 active:bg-purple-800 transition touch-manipulation"
          >
            조회
          </button>
        </div>
      </div>
    </div>

    <!-- 결과 목록 (카드 리스트) -->
    <section class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between shrink-0">
        <h2 class="font-bold text-base text-purple-800">예산집행 현황</h2>
        <span class="text-xs text-gray-500">총 {{ budgetRows.length }}건</span>
      </div>
      <div class="flex-1 overflow-y-auto min-h-[200px]">
        <p v-if="budgetRows.length === 0" class="text-center text-gray-500 text-sm py-8">
          데이터가 없습니다. 검색조건에서 조회를 눌러주세요.
        </p>
        <div v-else class="p-3 space-y-2">
          <template v-for="(row, index) in budgetRows" :key="row.dept_id || row.gwan_name || row.hang_name || index">
            <!-- 관: 동일한 관의 첫 번째 항 카드 위에만 표시 (배경색 + 계정코드) -->
            <p v-if="row.gwanRowSpan > 0" class="pt-1 pb-0.5">
              <span class="inline-block text-sm font-semibold text-purple-800 bg-purple-100 rounded px-2 py-1">
                {{ row.gwan_name }}<span v-if="row.gwan_category_id" class="text-purple-600 font-mono"> ({{ row.gwan_category_id }})</span>
              </span>
            </p>
            <!-- 항 카드 -->
            <div
              class="rounded-lg border px-3 py-2.5 touch-manipulation"
              :class="row.remaining_amount < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'"
            >
              <!-- 항명 + 항ID -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <p class="font-medium text-gray-900 text-sm">{{ row.hang_name }}</p>
                <span class="text-xs text-gray-500 font-mono">{{ row.hang_category_id }}</span>
              </div>
              <!-- 예산 / 지출 / 잔액 -->
              <div class="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div class="bg-gray-50 rounded px-2 py-1.5">
                  <p class="text-gray-500 leading-none">총예산액</p>
                  <p class="font-semibold text-right text-gray-900 mt-1">{{ formatAmount(row.total_budget) }}</p>
                </div>
                <div class="bg-gray-50 rounded px-2 py-1.5">
                  <p class="text-gray-500 leading-none">총지출액</p>
                  <p class="font-semibold text-right text-red-600 mt-1">{{ formatAmount(row.total_expense) }}</p>
                </div>
                <div class="rounded px-2 py-1.5" :class="row.remaining_amount < 0 ? 'bg-red-100' : 'bg-blue-50'">
                  <p class="text-gray-500 leading-none">잔액</p>
                  <p
                    class="font-semibold text-right mt-1"
                    :class="row.remaining_amount < 0 ? 'text-red-700' : 'text-blue-600'"
                  >
                    {{ formatAmount(row.remaining_amount) }}
                  </p>
                </div>
              </div>
            </div>
          </template>

          <!-- 합계 (모바일 최적: 세로 배치 + 큰 폰트, 금액 겹침 방지) -->
          <div v-if="budgetRows.length > 0" class="rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-4 mt-4">
            <p class="text-base font-bold text-purple-800 mb-3">합계</p>
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-3 bg-white/60 rounded-lg px-3 py-2.5 min-h-[2.75rem]">
                <span class="text-sm font-medium text-gray-600 shrink-0">총예산액</span>
                <span class="text-base font-bold text-gray-900 text-right break-all">{{ formatAmount(totals.budget) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 bg-white/60 rounded-lg px-3 py-2.5 min-h-[2.75rem]">
                <span class="text-sm font-medium text-gray-600 shrink-0">총지출액</span>
                <span class="text-base font-bold text-red-600 text-right break-all">{{ formatAmount(totals.expense) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 bg-white/60 rounded-lg px-3 py-2.5 min-h-[2.75rem]">
                <span class="text-sm font-medium text-gray-600 shrink-0">잔액</span>
                <span class="text-base font-bold text-blue-600 text-right break-all">{{ formatAmount(totals.remaining) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const today = new Date();
const currentYear = today.getFullYear();

const filters = ref({
  year: currentYear,
});

const searchExpanded = ref(false);
const searchConditionSummary = computed(() => `${filters.value.year}년`);

const budgetRows = ref([]);
const totals = ref({ budget: 0, expense: 0, remaining: 0 });
const fetchRequestId = ref(0);

const fetchBudgetStatus = async () => {
  try {
    const requestId = ++fetchRequestId.value;
    budgetRows.value = [];
    totals.value = { budget: 0, expense: 0, remaining: 0 };

    const res = await axios.get("/api/budget-status", {
      params: { year: filters.value.year },
    });
    if (requestId !== fetchRequestId.value) return;
    const rows = Array.isArray(res.data) ? res.data : [];

    const map = new Map();
    rows.forEach((r) => {
      const key = r.hang_category_id;
      if (!map.has(key)) {
        const budget = r.hang_total_budget;
        map.set(key, {
          ...r,
          total_budget: budget,
          total_expense: 0,
        });
      }
      const entry = map.get(key);
      entry.total_expense += Number(r.total_expense);
    });

    let processedRows = Array.from(map.values()).map((r) => ({
      ...r,
      remaining_amount: Number(r.total_budget) - r.total_expense,
    }));

    // 관(gwan) 순서 유지: API ORDER BY gwan.category_id, hang.category_id 와 동일하게 정렬
    processedRows.sort((a, b) => {
      const gwanA = String(a.gwan_category_id ?? a.gwan_name ?? "");
      const gwanB = String(b.gwan_category_id ?? b.gwan_name ?? "");
      const gwanCmp = gwanA.localeCompare(gwanB, undefined, { numeric: true });
      return gwanCmp !== 0 ? gwanCmp : String(a.hang_category_id).localeCompare(String(b.hang_category_id), undefined, { numeric: true });
    });

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
  if (isNaN(num)) return String(val);
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};
</script>
