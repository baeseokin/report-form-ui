<template>
  <div class="p-4 font-nanum space-y-4">
    <h2 class="text-lg font-bold text-purple-700">📊 부서 예산집행 현황</h2>

    <!-- 검색 영역 -->
    <div class="space-y-3 bg-white rounded-xl shadow p-3">
      <!-- 부서 선택 -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1">부서 선택</label>
        <select
          v-model="selectedDeptId"
          @change="fetchData"
          class="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          :disabled="!canChangeDept"
        >
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <!-- 기준일자 / 회계연도 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">기준일자</label>
          <input
            type="date"
            v-model="baseDate"
            @change="fetchData"
            class="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">회계연도</label>
          <input
            type="number"
            v-model="year"
            min="2000"
            max="2100"
            @change="fetchData"
            class="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>

    <!-- 참고사항 -->
    <div class="text-[11px] text-gray-600 leading-relaxed bg-purple-50 border border-purple-100 rounded-lg p-3">
      <p>1. 선택된 부서의 예산금액과 지출금액을 확인할 수 있습니다.</p>
      <p>2. 청구 시 계정을 선택하지 않고 <strong>"직접입력"</strong>한 경우, 기타(ETC) 계정으로 지출금액이 표시됩니다.</p>
    </div>

    <!-- 리스트 (2줄 리스트 행) -->
    <section class="space-y-2">
      <div v-if="categoriesTree.length === 0" class="text-center text-gray-500 text-sm py-8 bg-white rounded-xl shadow">
        데이터가 없습니다.
      </div>

      <div
        v-for="c in categoriesTree"
        :key="c.id"
        class="rounded-lg border bg-white px-3 py-2 text-xs"
        :class="{
          'bg-gray-50': c.level === '관',
          'bg-blue-50': c.level === '항',
          'bg-green-50': c.level === '목'
        }"
      >
        <!-- 1줄: 계정명 + 집행률 -->
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 truncate">
              <span class="inline-block" :style="{ paddingLeft: getIndent(c.level) }">
                {{ c.category_name }}
              </span>
              <span v-if="c.isEtc" class="ml-1 text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700 align-middle">
                ETC
              </span>
              <span class="ml-2 text-[11px] text-gray-500 font-mono">
                {{ c.category_id || "-" }}
              </span>
            </p>
          </div>

          <div class="shrink-0 text-right">
            <p class="text-[11px] text-gray-500 leading-none">집행률</p>
            <p class="font-semibold text-purple-700 leading-none mt-1">
              {{ calculateRate(getBudget(c), getExpense(c)) }}%
            </p>
          </div>
        </div>

        <!-- 2줄: 예산/지출/잔액 -->
        <div class="mt-2 grid grid-cols-3 gap-2 text-[11px]">
          <div class="bg-gray-50 rounded px-2 py-1">
            <p class="text-gray-500">예산</p>
            <p class="font-semibold text-right text-gray-900">{{ formatAmount(getBudget(c)) }}</p>
          </div>
          <div class="bg-gray-50 rounded px-2 py-1">
            <p class="text-gray-500">지출</p>
            <p class="font-semibold text-right text-red-600">{{ formatAmount(getExpense(c)) }}</p>
          </div>
          <div class="bg-gray-50 rounded px-2 py-1">
            <p class="text-gray-500">잔액</p>
            <p class="font-semibold text-right text-blue-600">{{ formatAmount(getBudget(c) - getExpense(c)) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const departments = ref([]);
const selectedDeptId = ref(null);
const categories = ref([]);
const baseDate = ref(new Date().toISOString().split("T")[0]);
const year = ref(new Date().getFullYear());
const budgets = ref({});
const expenses = ref([]); // approval_items raw data

// ✅ 부서 선택 권한 (관리자 or 재정부)
const canChangeDept = computed(() => {
  if (!user.value) return false;
  const roles = user.value.roles || [];
  const isAdmin = roles.some((r) => r.role_name === "관리자");
  const isFinance = roles.some((r) => r.role_name === "재정부") || user.value.deptName === "재정부";
  return isAdmin || isFinance;
});

// ✅ 계층 구조 변환
const categoriesTree = computed(() => {
  const buildTree = (list, parentId = null, depth = 1) => {
    const children = list
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        ...c,
        depth,
        children: buildTree(list, c.id, depth + 1),
      }))
      .flatMap((c) => [c, ...c.children]);

    return children;
  };

  return buildTree(categories.value);
});

onMounted(async () => {
  const res = await axios.get("/api/departments");
  departments.value = res.data.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
  initDeptSelection();
});

watch(user, () => {
  initDeptSelection();
});

const initDeptSelection = () => {
  if (!user.value || departments.value.length === 0) return;

  if (canChangeDept.value) {
    if (!selectedDeptId.value) {
      selectedDeptId.value = departments.value[0].id;
      fetchData();
    }
  } else {
    selectedDeptId.value = user.value.deptId;
    fetchData();
  }
};

const fetchData = async () => {
  if (!selectedDeptId.value) return;

  try {
    // 1. 계정과목 조회
    const catRes = await axios.get(`/api/accountCategories/${selectedDeptId.value}`, {
      params: { date: baseDate.value },
    });
    const rawCategories = catRes.data.categories || [];

    // 실제 부모 ID 집합 (Leaf 여부 판단용)
    const realParentIds = new Set(rawCategories.map((c) => c.parent_id).filter((id) => id));

    // 2. 예산 및 지출 조회
    const res = await axios.get(`/api/dept-budget-status`, {
      params: { deptId: selectedDeptId.value, year: year.value },
    });
    expenses.value = res.data.expenses || [];

    // ✅ 3. 지출 내역을 분석하여 필요한 곳에 '기타(ETC)' 노드 주입
    const etcParentIds = new Set();

    expenses.value.forEach((ex) => {
      const isSemokCustom = !ex.semok || !ex.semok.startsWith("ACC");
      const isMokCustom = !ex.mok || !ex.mok.startsWith("ACC");
      const isHangCustom = !ex.hang || !ex.hang.startsWith("ACC");
      const isGwanCustom = !ex.gwan || !ex.gwan.startsWith("ACC");

      let parentId = null;

      if (isSemokCustom) {
        if (!isMokCustom) {
          const p = rawCategories.find((c) => c.category_id === ex.mok);
          if (p) parentId = p.id;
        } else if (!isHangCustom) {
          const p = rawCategories.find((c) => c.category_id === ex.hang);
          if (p) parentId = p.id;
        } else if (!isGwanCustom) {
          const p = rawCategories.find((c) => c.category_id === ex.gwan);
          if (p) parentId = p.id;
        } else {
          parentId = "ROOT"; // 최상위 기타
        }
      }
      if (parentId) etcParentIds.add(parentId);
    });

    const finalCategories = rawCategories.map((c) => ({
      ...c,
      isMasterLeaf: !realParentIds.has(c.id), // 원래 마스터상 Leaf였는지 표시
    }));

    etcParentIds.forEach((pid) => {
      if (pid === "ROOT") {
        finalCategories.push({
          id: "ETC_ROOT",
          category_id: "ETC",
          category_name: "기타",
          level: "관",
          parent_id: null,
          depth: 1,
          isEtc: true,
        });
      } else {
        const parent = finalCategories.find((c) => c.id === pid);
        if (parent) {
          let childLevel = "세목";
          if (parent.level === "관") childLevel = "항";
          else if (parent.level === "항") childLevel = "목";
          else if (parent.level === "목") childLevel = "세목";

          finalCategories.push({
            id: `ETC_${parent.id}`,
            category_id: "ETC",
            category_name: "기타",
            level: childLevel,
            parent_id: parent.id,
            depth: (parent.depth || 1) + 1,
            isEtc: true,
          });
        }
      }
    });

    categories.value = finalCategories;

    // 예산 매핑
    budgets.value = {};
    (res.data.budgets || []).forEach((b) => {
      budgets.value[b.category_id] = Number(b.budget_amount) || 0;
    });
  } catch (err) {
    console.error("❌ 데이터 조회 실패:", err);
  }
};

// 예산 계산 (하위 합산)
const getBudget = (c) => {
  if (c.isMasterLeaf) {
    return budgets.value[c.category_id] ?? 0;
  }
  const children = categories.value.filter((child) => child.parent_id === c.id);
  return children.reduce((sum, child) => sum + getBudget(child), 0);
};

// 지출 계산
const getExpense = (c) => {
  if (c.isEtc) {
    if (c.id === "ETC_ROOT") {
      return expenses.value.reduce((sum, ex) => {
        const isGwanCustom = !ex.gwan || !ex.gwan.startsWith("ACC");
        return isGwanCustom ? sum + (Number(ex.amount) || 0) : sum;
      }, 0);
    }

    const parent = categories.value.find((p) => p.id === c.parent_id);
    if (!parent) return 0;
    const pCode = parent.category_id;

    return expenses.value.reduce((sum, ex) => {
      let match = false;
      const isSemokCustom = !ex.semok || !ex.semok.startsWith("ACC");
      const isMokCustom = !ex.mok || !ex.mok.startsWith("ACC");
      const isHangCustom = !ex.hang || !ex.hang.startsWith("ACC");

      if (parent.level === "목") {
        if (ex.mok === pCode && isSemokCustom) match = true;
      } else if (parent.level === "항") {
        if (ex.hang === pCode && isMokCustom) match = true;
      } else if (parent.level === "관") {
        if (ex.gwan === pCode && isHangCustom) match = true;
      }
      return match ? sum + (Number(ex.amount) || 0) : sum;
    }, 0);
  }

  const children = categories.value.filter((child) => child.parent_id === c.id);
  if (children.length > 0) {
    return children.reduce((s, child) => s + getExpense(child), 0);
  }

  const myId = c.category_id;
  if (c.level === "세목") {
    return expenses.value.reduce(
      (s, ex) => (ex.semok === myId ? s + (Number(ex.amount) || 0) : s),
      0
    );
  }

  return 0;
};

// 금액 포맷
const formatAmount = (val) => {
  if (val === null || val === undefined) return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};

const calculateRate = (budget, expense) => {
  if (!budget || budget === 0) return 0;
  return ((expense / budget) * 100).toFixed(1);
};

const getIndent = (level) => {
  switch (level) {
    case "관":
      return "4px";
    case "항":
      return "16px";
    case "목":
      return "28px";
    case "세목":
      return "40px";
    default:
      return "4px";
  }
};
</script>

