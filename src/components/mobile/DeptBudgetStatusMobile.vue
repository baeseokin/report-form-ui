<template>
  <div class="p-4 font-nanum space-y-4">
    <!-- 검색조건 접기/펼치기 -->
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
        <div class="p-3 pt-0 space-y-3">
          <!-- 부서 선택 -->
          <div>
            <label class="block text-sm mb-1">부서 선택</label>
            <select
              v-model="selectedDeptId"
              class="mobile-form-control mobile-form-control-select w-full disabled:bg-gray-100 disabled:text-gray-500"
              :disabled="!canChangeDept"
            >
              <option v-for="d in departments" :key="d.id" :value="d.id">
                {{ d.dept_name }}
              </option>
            </select>
          </div>

          <!-- 기준일자 / 회계연도 -->
          <div class="flex gap-3 items-end">
            <div class="flex-1 min-w-0">
              <label class="block text-sm mb-1">기준일자</label>
              <div class="mobile-form-control-date-wrap">
                <input
                  type="date"
                  v-model="baseDate"
                  class="mobile-form-control mobile-form-control-date"
                />
                <span class="mobile-form-control-date-icon" aria-hidden="true">📅</span>
              </div>
            </div>
            <div class="w-24 shrink-0">
              <label class="block text-sm mb-1">회계연도</label>
              <input
                type="number"
                v-model="year"
                min="2000"
                max="2100"
                class="mobile-form-control"
              />
            </div>
          </div>

          <button
            type="button"
            @click="fetchData"
            class="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-purple-700 active:bg-purple-800 transition"
          >
            조회
          </button>
        </div>
      </div>
    </div>

    <!-- 리스트 (2줄 리스트 행) -->
    <section class="space-y-2">
      <div v-if="categoriesTree.length === 0" class="text-center text-gray-500 text-sm py-8 bg-white rounded-xl shadow">
        데이터가 없습니다.
      </div>

      <div
        v-for="c in visibleTree"
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
          <div class="min-w-0 flex items-center">
            <!-- 접기/펼치기 버튼 (자식이 있을 때만) -->
            <button
              v-if="c.children && c.children.length > 0"
              type="button"
              @click="toggleCollapsed(c.id)"
              class="shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded touch-manipulation"
              :aria-expanded="!collapsedIds.has(c.id)"
            >
              <span class="text-[10px] leading-none">{{ collapsedIds.has(c.id) ? '▶' : '▼' }}</span>
            </button>
            <span v-else class="w-6 shrink-0 block" aria-hidden="true"></span>
            <p class="font-semibold text-gray-900 truncate min-w-0">
              <span class="inline-block" :style="{ paddingLeft: getIndent(c.level) }">
                <span v-if="getLevelSymbol(c.level)" class="mr-1 text-gray-400 shrink-0" aria-hidden="true">{{ getLevelSymbol(c.level) }}</span>{{ c.category_name }}
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

// ✅ 검색조건 펼침/접힘 (기본: 접힌 상태)
const searchExpanded = ref(false);

// 접힌 상태에서 보여줄 요약 문구
const searchConditionSummary = computed(() => {
  const dept = departments.value.find((d) => d.id === selectedDeptId.value);
  const deptName = dept ? dept.dept_name : "-";
  const dateStr = baseDate.value ? baseDate.value.replace(/-/g, ".") : "-";
  return `${deptName} · ${dateStr} · ${year.value}년`;
});

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

// ✅ 트리 접기: 접힌 노드 id 집합 (접힌 노드의 자식은 숨김)
const collapsedIds = ref(new Set());

const toggleCollapsed = (id) => {
  const next = new Set(collapsedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsedIds.value = next;
};

/** 접기 반영한 표시용 트리 (조상이 접혀 있으면 제외) */
const visibleTree = computed(() => {
  const collapsed = collapsedIds.value;
  const tree = categoriesTree.value;
  const visible = [];
  const stack = []; // { id, depth } — 자식이 있는 노드는 접힌 경우에도 넣어서, 자식이 부모 접힘을 알 수 있게 함

  for (const node of tree) {
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }
    if (stack.length > 0 && collapsed.has(stack[stack.length - 1].id)) {
      continue;
    }
    visible.push(node);
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      stack.push({ id: node.id, depth: node.depth });
    }
  }
  return visible;
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
    // 기본: 관·항·목은 펼침, 세목은 접음 → 자식이 있는 '목' 노드만 접힌 상태로
    const initialCollapsed = new Set();
    finalCategories.forEach((c) => {
      if (c.level === "목") {
        const hasChild = finalCategories.some((other) => other.parent_id === c.id);
        if (hasChild) initialCollapsed.add(c.id);
      }
    });
    collapsedIds.value = initialCollapsed;

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

/** 들여쓰기: 관/항/목/세목 기호 시작 위치 통일 */
const getIndent = (level) => {
  switch (level) {
    case "관":
    case "항":
    case "목":
    case "세목":
      return "5px";
    default:
      return "5px";
  }
};

/** depth 구분용 트리 문자: 관 없음, 항 → └, 목 → └└, 세목 → └└└ */
const getLevelSymbol = (level) => {
  switch (level) {
    case "관":
      return "";
    case "항":
      return "└";
    case "목":
      return "└└";
    case "세목":
      return "└└└";
    default:
      return "";
  }
};
</script>

