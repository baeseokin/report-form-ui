<template>
  <div class="p-6 font-nanum">
    <!-- 부서 & 기준일자 선택 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-gradient-to-br from-blue-50 via-white to-sky-50 rounded-xl shadow-lg border-l-4 border-blue-500 py-[15px] px-[14px] sm:p-6 md:p-8 mb-6 flex flex-wrap gap-6 items-end">
      <div class="flex flex-col">
        <label class="font-semibold text-blue-800 mb-1 text-sm">부서 선택</label>
        <select
          v-model="selectedDeptId"
          class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-44 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          :disabled="!canChangeDept"
        >
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="font-semibold text-blue-800 mb-1 text-sm">기준일자</label>
        <input
          type="date"
          v-model="baseDate"
          class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-44 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
        />
      </div>

      <div class="flex flex-col">
        <label class="font-semibold text-blue-800 mb-1 text-sm">회계연도</label>
        <input
          type="number"
          v-model="year"
          min="2000"
          max="2100"
          class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-28 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
        />
      </div>

      <button
        type="button"
        @click="fetchData"
        class="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition font-medium"
      >
        조회
      </button>
    </div>

    <!-- 계정 목록 Grid -->
    <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-800">
            <th class="border p-2 text-center">계정명</th>
          <th class="border p-2 text-center">계정ID</th>
          <th class="border p-2 text-center">예산금액</th>
          <th class="border p-2 text-center">지출금액</th>
          <th class="border p-2 text-center">잔액</th>
          <th class="border p-2 text-center">집행률</th>
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
            'bg-white': c.level === '세목' || c.isEtc
          }"
        >
          <td class="border p-2 col-account-name">
            <div :style="{ paddingLeft: getIndent(c.level) }">
              {{ c.category_name }}
            </div>
          </td>
          <td class="border p-2 text-center font-mono">{{ c.category_id || '-' }}</td>
          
          <!-- 예산금액 -->
          <td class="border p-2 text-right font-mono">
            {{ formatAmount(getBudget(c)) }}
          </td>

          <!-- 지출금액 -->
          <td class="border p-2 text-right font-mono text-red-600">
            {{ formatAmount(getExpense(c)) }}
          </td>

          <!-- 잔액 -->
          <td class="border p-2 text-right font-mono text-blue-600">
            {{ formatAmount(getBudget(c) - getExpense(c)) }}
          </td>

          <!-- 집행률 -->
          <td class="border p-2 text-right">
            {{ calculateRate(getBudget(c), getExpense(c)) }}%
          </td>
        </tr>
        <tr v-if="categoriesTree.length === 0">
          <td colspan="6" class="text-center p-4 text-gray-500">
            데이터가 없습니다.
          </td>
        </tr>
      </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useUserStore } from "../store/userStore";
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
  const isAdmin = roles.some(r => r.role_name === "관리자");
  const isFinance = roles.some(r => r.role_name === "재정부") || user.value.deptName === "재정부";
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

    // 최상위(관) 레벨이 아니고, children이 없는 Leaf 노드인 경우 '기타' 항목 추가 검토
    // 하지만 여기서는 '기타'를 별도의 카테고리 노드로 추가하는 방식보다는
    // 화면 표시 시점에 계산 로직으로 처리하거나, 가상의 노드를 추가해야 함.
    // 요청사항: "mok, semok 이 ACC로 시작하지 않는 금액은 '기타' 를 추가하고 여기에 합산"
    
    // '기타' 항목은 보통 '항'이나 '목' 하위에 존재할 수 있음.
    // 여기서는 단순화를 위해, 각 '항'의 하위에 '기타'를 추가하는 로직을 구현.
    // 또는 전체 트리 구성 후 마지막에 처리.
    
    return children;
  };

  let tree = buildTree(categories.value);

  // '기타' 항목 추가 로직
  // expenses 중 ACC로 시작하지 않는 항목들을 찾아서, 해당 상위 카테고리(항/목) 아래에 '기타' 노드 추가
  // 하지만 상위 카테고리를 찾기 어려우므로(코드 매핑 불가), 
  // 여기서는 편의상 최상위 또는 특정 위치에 '기타(미분류)'를 보여주거나,
  // 각 '항' 레벨에서 하위 '목'에 매핑되지 않은 지출을 '기타'로 표시하는 것이 적절함.
  
  // 본 구현에서는 BudgetsGrid와 동일한 구조를 유지하되, 
  // getExpense 함수에서 매핑되지 않는 항목을 처리하도록 함.
  // 별도의 '기타' 행을 추가하려면 tree 구조를 변형해야 함.
  
  return tree;
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
    // 권한이 있으면: 선택된게 없을 때만 첫 번째 부서 자동 선택
    if (!selectedDeptId.value) {
      selectedDeptId.value = departments.value[0].id;
      fetchData();
    }
  } else {
    // 권한이 없으면: 본인 부서로 강제 고정
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
    const realParentIds = new Set(rawCategories.map(c => c.parent_id).filter(id => id));

    // 2. 예산 및 지출 조회
    const res = await axios.get(`/api/dept-budget-status`, {
      params: { deptId: selectedDeptId.value, year: year.value },
    });
    expenses.value = res.data.expenses || [];

    // ✅ 3. 지출 내역을 분석하여 필요한 곳에 '기타(ETC)' 노드 주입
    const etcParentIds = new Set();

    expenses.value.forEach(ex => {
      const isSemokCustom = !ex.semok || !ex.semok.startsWith('ACC');
      const isMokCustom = !ex.mok || !ex.mok.startsWith('ACC');
      const isHangCustom = !ex.hang || !ex.hang.startsWith('ACC');
      const isGwanCustom = !ex.gwan || !ex.gwan.startsWith('ACC');

      let parentId = null;

      // 가장 깊은 유효한 상위 계정을 찾아 그 밑에 ETC를 달아줌
      if (isSemokCustom) {
        if (!isMokCustom) {
          const p = rawCategories.find(c => c.category_id === ex.mok);
          if (p) parentId = p.id;
        } else if (!isHangCustom) {
          const p = rawCategories.find(c => c.category_id === ex.hang);
          if (p) parentId = p.id;
        } else if (!isGwanCustom) {
          const p = rawCategories.find(c => c.category_id === ex.gwan);
          if (p) parentId = p.id;
        } else {
          parentId = 'ROOT'; // 최상위 기타
        }
      }
      if (parentId) etcParentIds.add(parentId);
    });

    const finalCategories = rawCategories.map(c => ({
      ...c,
      isMasterLeaf: !realParentIds.has(c.id) // 원래 마스터상 Leaf였는지 표시
    }));

    etcParentIds.forEach(pid => {
      if (pid === 'ROOT') {
        finalCategories.push({
          id: 'ETC_ROOT',
          category_id: 'ETC',
          category_name: '기타',
          level: '관',
          parent_id: null,
          depth: 1,
          isEtc: true
        });
      } else {
        const parent = finalCategories.find(c => c.id === pid);
        if (parent) {
          let childLevel = '세목';
          if (parent.level === '관') childLevel = '항';
          else if (parent.level === '항') childLevel = '목';
          else if (parent.level === '목') childLevel = '세목';

          finalCategories.push({
            id: `ETC_${parent.id}`,
            category_id: 'ETC',
            category_name: '기타',
            level: childLevel,
            parent_id: parent.id,
            depth: (parent.depth || 1) + 1,
            isEtc: true
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

// 예산 계산 (BudgetsGrid와 동일: 하위 합산)
const getBudget = (c) => {
  // 마스터 데이터상 Leaf였으면 본인 예산 사용 (ETC 자식이 생겨도 본인 예산 유지)
  if (c.isMasterLeaf) {
    return budgets.value[c.category_id] ?? 0;
  }
  // 하위 합산
  const children = categories.value.filter((child) => child.parent_id === c.id);
  return children.reduce((sum, child) => sum + getBudget(child), 0);
};

// 지출 계산
const getExpense = (c) => {
  // 1. ETC 노드인 경우: 해당 부모에 속하면서 하위 코드가 커스텀인 지출 합산
  if (c.isEtc) {
    if (c.id === 'ETC_ROOT') {
      return expenses.value.reduce((sum, ex) => {
        const isGwanCustom = !ex.gwan || !ex.gwan.startsWith('ACC');
        return isGwanCustom ? sum + (Number(ex.amount) || 0) : sum;
      }, 0);
    }

    const parent = categories.value.find(p => p.id === c.parent_id);
    if (!parent) return 0;
    const pCode = parent.category_id;

    return expenses.value.reduce((sum, ex) => {
      let match = false;
      const isSemokCustom = !ex.semok || !ex.semok.startsWith('ACC');
      const isMokCustom = !ex.mok || !ex.mok.startsWith('ACC');
      const isHangCustom = !ex.hang || !ex.hang.startsWith('ACC');

      if (parent.level === '목') {
        // 부모가 목: 목 코드는 일치하고, 세목이 커스텀(또는 없음)
        if (ex.mok === pCode && isSemokCustom) match = true;
      } else if (parent.level === '항') {
        // 부모가 항: 항 코드는 일치하고, 목이 커스텀
        if (ex.hang === pCode && isMokCustom) match = true;
      } else if (parent.level === '관') {
        // 부모가 관: 관 코드는 일치하고, 항이 커스텀
        if (ex.gwan === pCode && isHangCustom) match = true;
      }
      return match ? sum + (Number(ex.amount) || 0) : sum;
    }, 0);
  }

  // 2. 일반 노드: 하위 합산 (ETC 자식 포함)
  const children = categories.value.filter((child) => child.parent_id === c.id);
  if (children.length > 0) {
    return children.reduce((s, child) => s + getExpense(child), 0);
  }

  // 3. 최하위 Leaf (세목 등): 정확히 일치하는 지출 합산
  const myId = c.category_id;
  if (c.level === '세목') {
    return expenses.value.reduce((s, ex) => (ex.semok === myId ? s + (Number(ex.amount) || 0) : s), 0);
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
    case '관': return '20px';
    case '항': return '80px';
    case '목': return '140px';
    case '세목': return '220px';
    default: return '20px';
  }
};
</script>

<style scoped>
.col-account-name {
  text-align: left !important;
}
</style>