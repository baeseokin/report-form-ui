<template>
  <div class="p-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800 mb-4">🏛 부서별 예산 현황</h2>

    <!-- ✅ 검색조건 -->
    <div class="flex flex-wrap gap-4 mb-6 items-end">
      <!-- 기준년도 -->
      <div class="flex flex-col w-32">
        <label class="font-bold mb-1">기준년도</label>
        <input
          type="number"
          v-model="filters.year"
          class="border rounded p-2 w-full"
        />
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="fetchBudgetStatus"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          조회
        </button>
      </div>
    </div>

    <!-- ✅ 결과 목록 -->
    <div>
      <table class="w-full border text-sm">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="border p-2">부서명</th>
            <th class="border p-2 text-center">총예산액</th>
            <th class="border p-2 text-center">총지출액</th>
            <th class="border p-2 text-center">잔액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in budgetRows" :key="row.dept_id" class="hover:bg-gray-50">
            <td class="border p-2">{{ row.dept_name }}</td>
            <td class="border p-2 text-right">{{ formatAmount(row.total_budget) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(row.total_expense) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(row.remaining_amount) }}</td>
          </tr>

          <tr v-if="budgetRows.length === 0">
            <td colspan="4" class="text-center p-4">데이터가 없습니다.</td>
          </tr>

          <!-- 합계 -->
          <tr v-else class="font-bold bg-gray-200">
            <td class="border p-2 text-center">합계</td>
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

const fetchBudgetStatus = async () => {
  try {
    const res = await axios.get("/api/budget-status", {
      params: { year: filters.value.year },
    });
    budgetRows.value = res.data;

    // ✅ 합계 계산
    const totalBudget = res.data.reduce((sum, r) => sum + Number(r.total_budget), 0);
    const totalExpense = res.data.reduce((sum, r) => sum + Number(r.total_expense), 0);
    const totalRemaining = res.data.reduce((sum, r) => sum + Number(r.remaining_amount), 0);

    totals.value = {
      budget: totalBudget,
      expense: totalExpense,
      remaining: totalRemaining,
    };
  } catch (err) {
    console.error("예산 현황 조회 실패:", err);
    budgetRows.value = [];
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
