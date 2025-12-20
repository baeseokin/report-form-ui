<template>
  <div class="p-6 font-nanum">
    <h2 class="text-2xl font-bold text-purple-700 mb-6">🏛 예산집행 현황</h2>

    <!-- ✅ 검색조건 -->
    <div class="flex flex-wrap gap-4 mb-6 items-end">
      <!-- 기준년도 -->
      <div class="flex flex-col w-32">
        <label class="font-bold mb-1 text-gray-700">기준년도</label>
        <input
          type="number"
          v-model="filters.year"
          class="border rounded p-2 w-full"
        />
      </div>
      <!-- 부서 선택 -->
      <div class="flex flex-col w-48">
        <label class="font-bold mb-1 text-gray-700">부서</label>
        <select v-model="filters.deptId" class="border rounded p-2 w-full">
          <option value="">전체</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.dept_name }}
          </option>
        </select>
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="fetchBudgetStatus"
          class="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
        >
          조회
        </button>
      </div>
    </div>

    <!-- ✅ 결과 목록 -->
    <div>
      <table class="w-full border text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-800">
            <th class="border p-2">부서명</th>
            <th class="border p-2">관</th>
            <th class="border p-2">항</th>            
            <th class="border p-2 text-center">총예산액</th>
            <th class="border p-2 text-center">총지출액</th>
            <th class="border p-2 text-center">잔액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in budgetRows" :key="row.dept_id||row.gwan_name||row.hang_name"
              :class="row.remaining_amount < 0 ? 'bg-red-100 text-red-700 font-semibold' : 'bg-white'">
            <td class="border p-2">{{ row.dept_name }},{{ row.dept_id }}</td>
            <td class="border p-2">{{ row.gwan_name }}</td>
            <td class="border p-2">{{ row.hang_name }}</td>            
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
  deptId: "",
});

const budgetRows = ref([]);
const totals = ref({ budget: 0, expense: 0, remaining: 0 });
const departments = ref([]);

const fetchDepartments = async () => {
  try {
    const res = await axios.get("/api/departments");
    departments.value = res.data;
  } catch (err) {
    console.error("부서 목록 조회 실패:", err);
    departments.value = [];
  }
};

const fetchBudgetStatus = async () => {
  try {
    const params = { year: filters.value.year };
    if (filters.value.deptId) {
      params.deptId = filters.value.deptId;
    }
    const res = await axios.get("/api/budget-status", {
      params,
    });
    const rows = Array.isArray(res.data) ? res.data : [];

    const selectedDept = departments.value.find(
      (dept) => String(dept.id) === String(filters.value.deptId),
    );
    const selectedDeptName = selectedDept?.dept_name;
    const filteredRows = filters.value.deptId
      ? rows.filter((row) => {
          const rowDeptId = row.dept_id ?? row.deptId ?? row.deptID;
          if (rowDeptId !== undefined && rowDeptId !== null) {
            return String(rowDeptId) === String(filters.value.deptId);
          }
          if (selectedDeptName) {
            return String(row.dept_name) === String(selectedDeptName);
          }
          return false;
        })
      : rows;
    budgetRows.value = "";    
    budgetRows.value = filteredRows;
    
    console.log("budgetRows:",budgetRows);

    // ✅ 합계 계산
    const totalBudget = filteredRows.reduce((sum, r) => sum + Number(r.total_budget), 0);
    const totalExpense = filteredRows.reduce((sum, r) => sum + Number(r.total_expense), 0);
    const totalRemaining = filteredRows.reduce((sum, r) => sum + Number(r.remaining_amount), 0);

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
  fetchDepartments();
  fetchBudgetStatus();
});

const formatAmount = (val) => {
  if (val === null || val === undefined) return "";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};
</script>
