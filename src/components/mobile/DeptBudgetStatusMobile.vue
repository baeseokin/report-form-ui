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
        <div class="p-3 pt-4 space-y-3 bg-white">
          <!-- 부서 선택 -->
          <div>
            <label class="block text-sm mb-1">부서 선택</label>
            <select
              v-model="selectedDeptId"
              @change="fetchData"
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

            <div class="w-24 shrink-0">
              <label class="block text-sm mb-1">회계연도</label>
              <input
                type="number"
                v-model="year"
                @change="fetchData"
                min="2000"
                max="2100"
                class="mobile-form-control"
              />
            </div>
          </div>


        </div>
      </div>
    </div>

    <!-- 상단 펼치기/접기 버튼 바 -->
    <div class="flex justify-end gap-1.5">
      <button
        type="button"
        @click="expandAll"
        class="px-2.5 py-1 text-xs bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-semibold transition shadow-2xs flex items-center gap-1 cursor-pointer"
      >
        <span>➕</span>
        <span>전체펼침</span>
      </button>
      <button
        type="button"
        @click="collapseAll"
        class="px-2.5 py-1 text-xs bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-semibold transition shadow-2xs flex items-center gap-1 cursor-pointer"
      >
        <span>➖</span>
        <span>전체접음</span>
      </button>
    </div>

    <!-- 계정별 카드 목록 -->
    <section class="space-y-2.5">
      <div v-if="categoriesTree.length === 0" class="text-center text-gray-500 text-sm py-8 bg-white rounded-xl shadow-xs border border-gray-200">
        데이터가 없습니다.
      </div>

      <div
        v-for="c in visibleTree"
        :key="c.id"
        class="rounded-xl border shadow-xs transition overflow-hidden"
        :class="getMobileCardClass(c)"
        :style="getMobileIndentStyle(c.depth)"
      >
        <!-- 카드 헤더 영역 (클릭하여 접기/펼치기) -->
        <div
          class="p-3.5"
          :class="{ 'cursor-pointer select-none active:bg-black/5': c.children && c.children.length > 0 }"
          @click="c.children && c.children.length > 0 && toggleCollapsed(c.id)"
        >
          <!-- 메인 제목 줄 -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <!-- 폴딩 화살표 토글 버튼 (자식 있을 때) -->
              <button
                v-if="c.children && c.children.length > 0"
                type="button"
                @click.stop="toggleCollapsed(c.id)"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 text-gray-700 font-bold shrink-0 text-xs transition-transform duration-150"
                :class="{ 'rotate-90': !collapsedIds.has(c.id) }"
              >
                ▶
              </button>
              <span v-else class="text-xs text-gray-400 shrink-0">📄</span>

              <!-- 단계 뱃지 -->
              <span
                class="px-2 py-0.5 text-[10px] rounded-md font-extrabold shrink-0 shadow-2xs"
                :class="getMobileBadgeClass(c.level)"
              >{{ c.level }}</span>

              <!-- 계정명 -->
              <span :class="getMobileTitleClass(c.level, !(c.children && c.children.length > 0))" class="truncate">
                {{ c.category_name }}
              </span>

              <!-- ETC 뱃지 -->
              <span
                v-if="c.isEtc"
                class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 shrink-0"
              >
                ETC
              </span>

              <!-- 하위 항목 개수 뱃지 (자식이 있는 경우) -->
              <span
                v-if="c.children && c.children.length > 0"
                class="px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0"
                :class="!collapsedIds.has(c.id) ? 'bg-black/10 text-gray-600' : 'bg-purple-600 text-white'"
              >
                {{ getDirectChildrenCount(c.id) }}
              </span>
            </div>

            <!-- 우측 집행률 -->
            <div class="shrink-0 text-right">
              <span class="text-[10px] text-gray-400 block leading-tight">집행률</span>
              <span class="text-xs font-mono font-bold text-purple-700">
                {{ calculateRate(getBudget(c), getExpense(c)) }}%
              </span>
            </div>
          </div>

          <!-- 계정코드 -->
          <div class="text-[11px] text-gray-400 font-mono mt-1 ml-7.5">
            {{ c.category_id || "-" }}
          </div>

          <!-- 2줄: 좌측 예산 / 우측 (지출, 잔액 세로 배열) -->
          <div class="mt-2.5 grid grid-cols-2 gap-2 text-xs">
            <!-- 좌측: 예산 -->
            <div class="bg-white/90 rounded-lg p-2.5 border border-black/5 shadow-2xs flex flex-col justify-between">
              <span class="text-[11px] text-gray-500 font-medium">예산</span>
              <p class="font-bold text-right text-gray-900 font-mono text-sm sm:text-base mt-1">
                {{ formatAmount(getBudget(c)) }}원
              </p>
            </div>

            <!-- 우측: 지출 & 잔액 세로 배열 -->
            <div class="flex flex-col gap-1.5 justify-between">
              <!-- 지출 -->
              <div class="bg-white/90 rounded-lg px-2.5 py-1.5 border border-black/5 shadow-2xs flex items-center justify-between">
                <span class="text-[11px] text-gray-500 font-medium">지출</span>
                <span class="font-bold font-mono text-xs text-red-600">
                  {{ formatAmount(getExpense(c)) }}원
                </span>
              </div>
              <!-- 잔액 -->
              <div class="bg-white/90 rounded-lg px-2.5 py-1.5 border border-black/5 shadow-2xs flex items-center justify-between">
                <span class="text-[11px] text-gray-500 font-medium">잔액</span>
                <span
                  class="font-bold font-mono text-xs"
                  :class="(getBudget(c) - getExpense(c)) < 0 ? 'text-red-600' : 'text-blue-600'"
                >
                  {{ formatAmount(getBudget(c) - getExpense(c)) }}원
                </span>
              </div>
            </div>
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
import { getCurrentYear } from "../../utils/dateUtils";

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const departments = ref([]);
const selectedDeptId = ref(null);
const categories = ref([]);
const year = ref(getCurrentYear());
const budgets = ref({});
const expenses = ref([]); // approval_items raw data

// ✅ 검색조건 펼침/접힘 (기본: 접힌 상태)
const searchExpanded = ref(false);

// 접힌 상태에서 보여줄 요약 문구
const searchConditionSummary = computed(() => {
  const dept = departments.value.find((d) => d.id === selectedDeptId.value);
  const deptName = dept ? dept.dept_name : "-";
  return `${deptName} · ${year.value}년`;
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
      params: { year: year.value },
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
    // 기본: 모든 상위 계정을 접어서 깔끔하게 시작 (예산편성서 작성 화면과 동일)
    collapseAll();

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
  return expenses.value.reduce((s, ex) => {
    let match = false;
    if (c.level === "세목") match = ex.semok === myId;
    else if (c.level === "목") match = ex.mok === myId;
    else if (c.level === "항") match = ex.hang === myId;
    else if (c.level === "관") match = ex.gwan === myId;
    return match ? s + (Number(ex.amount) || 0) : s;
  }, 0);
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

/* ========================================================
   🎨 예산편성서 작성 화면과 일치하는 모바일 카드/트리 스타일
   ======================================================== */
const getMobileCardClass = (item) => {
  switch (item.level) {
    case "관":
      return "border-l-[6px] border-l-blue-600 border-blue-200 bg-blue-50/70 shadow-xs";
    case "항":
      return "border-l-4 border-l-purple-500 border-purple-200 bg-purple-50/40";
    case "목":
      return "border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/30";
    default:
      return "border-l-4 border-l-gray-300 border-gray-200 bg-white";
  }
};

const getMobileIndentStyle = (depth) => {
  const margin = Math.max(0, ((depth || 1) - 1) * 8);
  return margin > 0 ? { marginLeft: `${margin}px` } : {};
};

const getMobileBadgeClass = (level) => {
  switch (level) {
    case "관": return "bg-blue-600 text-white";
    case "항": return "bg-purple-600 text-white";
    case "목": return "bg-emerald-600 text-white";
    default: return "bg-gray-100 text-gray-700 border border-gray-300";
  }
};

const getMobileTitleClass = (level, isLeaf) => {
  if (level === "관") return "text-sm font-extrabold text-blue-950 tracking-tight";
  if (level === "항") return "text-sm font-bold text-purple-950";
  if (level === "목") return "text-sm font-semibold text-emerald-950";
  return isLeaf ? "text-xs font-semibold text-gray-800" : "text-xs font-bold text-gray-900";
};

const getDirectChildrenCount = (id) => {
  return categories.value.filter((child) => child.parent_id === id).length;
};

const expandAll = () => {
  collapsedIds.value = new Set();
};

const collapseAll = () => {
  const allParentIds = categories.value
    .filter((c) => categories.value.some((other) => other.parent_id === c.id))
    .map((c) => c.id);
  collapsedIds.value = new Set(allParentIds);
};
</script>

