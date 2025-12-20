<template>
  <div class="p-6 font-nanum">
    <h2 class="text-2xl font-bold text-purple-700 mb-6">💰 예산 관리</h2>

    <!-- 총 예산 표시 -->
    <div class="mb-6 p-4 bg-purple-50 border border-purple-300 rounded text-xl font-bold text-purple-800 shadow-sm">
      📊 총 예산: {{ formatAmount(totalBudget) }} 원
    </div>

    <!-- 부서 & 기준일자 선택 -->
    <div class="mb-6 flex flex-wrap items-end gap-6">
      <div>
        <label class="font-semibold text-gray-700">부서 선택</label>
        <select
          v-model="selectedDeptId"
          @change="fetchCategories"
          class="ml-2 border rounded p-2 shadow-sm"
        >
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <div>
        <label class="font-semibold text-gray-700">기준일자</label>
        <input
          type="date"
          v-model="baseDate"
          @change="fetchCategories"
          class="ml-2 border rounded p-2 shadow-sm"
        />
      </div>

      <div>
        <label class="font-semibold text-gray-700">회계연도</label>
        <input
          type="number"
          v-model="year"
          min="2000"
          max="2100"
          class="ml-2 border rounded p-2 w-28 shadow-sm"
        />
      </div>
    </div>

    <!-- 계정 목록 Grid -->
    <table class="w-full border text-sm mb-6">
      <thead>
        <tr class="bg-purple-100 text-gray-800">
          <th class="border p-2 text-center">계정명</th>
          <th class="border p-2 text-center">계정ID</th>
          <th class="border p-2 text-center">단계</th>
          <th class="border p-2 text-center">상위 계정</th>
          <th class="border p-2 text-center">유효기간</th>
          <th class="border p-2 text-center">예산금액</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in categoriesTree"
          :key="c.id"
          :class="{
            'bg-gray-100 font-bold': c.level === '관',
            'bg-blue-50': c.level === '항',
            'bg-green-50': c.level === '목',
            'bg-white': c.level === '세목'
          }"
        >
          <td class="border p-2">
            <span :style="{ paddingLeft: `${(c.depth - 1) * 40}px` }">
              {{ c.category_name }}
            </span>
          </td>
          <td class="border p-2 text-center font-mono">{{ c.category_id || '-' }}</td>
          <td class="border p-2 text-center">{{ c.level }}</td>
          <td class="border p-2 text-center">{{ parentName(c.parent_id) }}</td>
          <td class="border p-2 text-center">
            {{ formatDate(c.valid_from) }} ~
            {{ c.valid_to ? formatDate(c.valid_to) : "현재" }}
          </td>
          <td class="border p-2 text-right font-mono">
            <template v-if="['항', '목', '세목'].includes(c.level)">
              <input
                type="text"
                class="border rounded p-1 w-40 text-right shadow-sm"
                :value="formatAmount(budgets[c.category_id] ?? 0)"
                @input="onBudgetInput($event, c)"
              />
            </template>
            <template v-else>
              {{ formatAmount(sumChildren(c.id)) }}
            </template>
          </td>
        </tr>
        <tr v-if="categoriesTree.length === 0">
          <td colspan="6" class="text-center p-4 text-gray-500">
            데이터가 없습니다.
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 저장 버튼 -->
    <div class="flex justify-end">
      <button
        @click="saveAllBudgets"
        class="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
      >
        💾 저장
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const departments = ref([]);
const selectedDeptId = ref(null);
const categories = ref([]);
const baseDate = ref(new Date().toISOString().split("T")[0]);
const year = ref(new Date().getFullYear());
const budgets = ref({});

// ✅ 계층 구조 변환
const categoriesTree = computed(() => {
  const buildTree = (list, parentId = null, depth = 1) => {
    return list
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        ...c,
        depth,
        children: buildTree(list, c.id, depth + 1),
      }))
      .flatMap((c) => [c, ...c.children]);
  };
  return buildTree(categories.value);
});

// ✅ 총 예산 합계 (최상위 노드 기준으로 계산)
const totalBudget = computed(() => {
  const roots = categories.value.filter((c) => c.parent_id === null);
  return roots.reduce((sum, root) => sum + sumChildren(root.id), 0);
});

// 부서 목록 로드
onMounted(async () => {
  const res = await axios.get("/api/departments");
  departments.value = res.data;
  if (departments.value.length > 0) {
    selectedDeptId.value = departments.value[0].id;
    fetchCategories();
  }
});

// 계정과목 + 예산 로드
const fetchCategories = async () => {
  if (!selectedDeptId.value) return;

  try {
    const res = await axios.get(`/api/accountCategories/${selectedDeptId.value}`, {
      params: { date: baseDate.value },
    });
    categories.value = res.data.categories || [];

    // ✅ 해당 부서/년도 예산 불러오기
    const budgetRes = await axios.get(`/api/budgets/${selectedDeptId.value}`, {
      params: { year: year.value },
    });

    console.log("budgetRes :", budgetRes);
    budgets.value = {};
    budgetRes.data.budgets.forEach((b) => {
      console.log()
      budgets.value[b.category_id] = Number(b.budget_amount) || 0;
    });
    console.log("budgets :", budgets);
  } catch (err) {
    console.error("❌ 데이터 조회 실패:", err);
  }
};

// 부모 계정명 찾기
const parentName = (parentId) => {
  const parent = categories.value.find((c) => c.id === parentId);
  return parent ? parent.category_name : "-";
};

// 날짜 포맷
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

// 일괄 저장
const saveAllBudgets = async () => {
  try {
    const payload = categories.value.map((c) => ({
      dept_id: selectedDeptId.value,
      category_id: c.category_id, // 문자열 ID 저장
      year: year.value,
      budget_amount: ["항", "목", "세목"].includes(c.level)
        ? (budgets.value[c.category_id] ?? 0)
        : sumChildren(c.id),
    }));

    await axios.post("/api/budgets/bulk", { budgets: payload });
    alert("💾 예산이 저장되었습니다.");
  } catch (err) {
    console.error("❌ 예산 저장 실패:", err);
    alert("❌ 저장 실패");
  }
};

// 입력 처리 (숫자만 허용)
const onBudgetInput = (e, category) => {
  const raw = e.target.value.replace(/[^0-9]/g, "");
  budgets.value[category.category_id] = raw ? Number(raw) : 0;
};

// 하위 항목 합산
const sumChildren = (parentId) => {
  const children = categories.value.filter((c) => c.parent_id === parentId);
  console.log("children :", children);
  return children.reduce((sum, child) => {
    console.log("sumChildren-child.category_id:",child.category_id);  
    console.log("sumChildren-budgets.value:",budgets.value);  
    if (["항", "목", "세목"].includes(child.level)) {
      sum += Number(budgets.value[child.category_id] ?? 0);
    } else {
      sum += sumChildren(child.id);
    }
    return sum;
  }, 0);
};

// 금액 포맷
const formatAmount = (val) => {
  if (val === null || val === undefined) return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};
</script>
