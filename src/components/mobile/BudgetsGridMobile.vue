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
            <label class="block text-sm mb-1">부서 선택</label>
            <select
              v-model="selectedDeptId"
              @change="fetchCategories"
              class="mobile-form-control mobile-form-control-select w-full"
            >
              <option v-for="d in departments" :key="d.id" :value="d.id">
                {{ d.dept_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">기준일자</label>
            <div class="mobile-form-control-date-wrap">
              <input
                type="date"
                v-model="baseDate"
                @change="fetchCategories"
                class="mobile-form-control mobile-form-control-date"
              />
              <span class="mobile-form-control-date-icon" aria-hidden="true">📅</span>
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">회계연도</label>
            <input
              type="number"
              v-model="year"
              min="2000"
              max="2100"
              class="mobile-form-control w-full"
            />
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              @click="fetchCategories"
              class="flex-1 py-2.5 text-sm font-medium rounded-lg bg-purple-600 text-white shadow-sm hover:bg-purple-700 active:bg-purple-800 transition touch-manipulation"
            >
              조회
            </button>
            <button
              type="button"
              @click="downloadExcel"
              class="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
              :disabled="categoriesTree.length === 0"
            >
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 계정 목록 (카드 리스트) -->
    <section class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between shrink-0">
        <h2 class="font-bold text-base text-purple-800">예산 계정 목록</h2>
        <span class="text-xs text-gray-500">총 {{ categoriesTree.length }}건</span>
      </div>
      <div class="flex-1 overflow-y-auto min-h-[200px]">
        <p v-if="categoriesTree.length === 0" class="text-center text-gray-500 text-sm py-8">
          데이터가 없습니다. 검색조건에서 조회를 눌러주세요.
        </p>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="c in visibleTree"
            :key="c.id"
            class="px-3 py-2.5 touch-manipulation"
            :class="{
              'bg-blue-50': c.level === '관',
              'bg-gray-50': c.level === '항',
              'bg-green-50': c.level === '목',
              'bg-white': c.level === '세목'
            }"
          >
            <!-- 1줄: 접기 버튼 + 계정명 + 단계 -->
            <div class="flex items-start gap-2">
              <button
                v-if="hasChildren(c.id)"
                type="button"
                @click="toggleCollapsed(c.id)"
                class="shrink-0 w-7 h-7 flex items-center justify-center text-gray-500 rounded-lg active:bg-gray-200 mt-0.5"
                :aria-expanded="!collapsedIds.has(c.id)"
              >
                <span class="text-xs leading-none">{{ collapsedIds.has(c.id) ? '▶' : '▼' }}</span>
              </button>
              <span v-else class="w-7 shrink-0 block" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-gray-900 text-sm break-words" :style="{ paddingLeft: `${(c.depth - 1) * 8}px` }">
                  {{ c.category_name }}
                </p>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500">
                  <span class="font-mono">{{ c.category_id || '-' }}</span>
                  <span class="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{{ c.level }}</span>
                  <span v-if="c.owner_dept_id" class="text-gray-500">{{ getDeptName(c.owner_dept_id) }}</span>
                </div>
              </div>
            </div>

            <!-- 2줄: 예산금액 (입력 또는 합계 표시) -->
            <div class="mt-2 ml-9">
              <template v-if="isLeafCategory(c.id)">
                <template v-if="c.owner_dept_id === selectedDeptId">
                  <label class="block text-xs text-gray-600 mb-1">예산금액</label>
                  <input
                    type="text"
                    inputmode="numeric"
                    class="w-full mobile-form-control text-right text-sm py-2"
                    :value="formatAmount(budgets[c.category_id] ?? 0)"
                    @input="onBudgetInput($event, c)"
                  />
                </template>
                <template v-else>
                  <p class="text-xs text-gray-500">예산금액</p>
                  <p class="text-sm font-medium text-gray-600">
                    {{ formatAmount(budgets[c.category_id] ?? 0) }}
                    <span class="text-xs text-gray-400 ml-1">(Owner만 수정)</span>
                  </p>
                </template>
              </template>
              <template v-else>
                <p class="text-xs text-gray-500">하위 합계</p>
                <p class="text-sm font-semibold text-purple-700">{{ formatAmount(sumChildren(c.id)) }}</p>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 저장 버튼 (하단 고정) -->
    <div class="shrink-0 pt-2 pb-4">
      <button
        @click="saveAllBudgets"
        class="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-700 active:opacity-90 transition touch-manipulation"
      >
        💾 예산 저장
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

const searchExpanded = ref(false);
const collapsedIds = ref(new Set());

const searchConditionSummary = computed(() => {
  const dept = departments.value.find((d) => d.id === selectedDeptId.value);
  const deptName = dept ? dept.dept_name : "-";
  const dateStr = baseDate.value ? baseDate.value.replace(/-/g, ".") : "-";
  return `${deptName} · ${dateStr} · ${year.value}년`;
});

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

function hasChildren(categoryId) {
  return categories.value.some((c) => c.parent_id === categoryId);
}

function toggleCollapsed(id) {
  const next = new Set(collapsedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsedIds.value = next;
}

const visibleTree = computed(() => {
  const collapsed = collapsedIds.value;
  const isVisible = (c) => {
    let pid = c.parent_id;
    while (pid) {
      if (collapsed.has(pid)) return false;
      const parent = categories.value.find((x) => x.id === pid);
      pid = parent ? parent.parent_id : null;
    }
    return true;
  };
  return categoriesTree.value.filter(isVisible);
});

onMounted(async () => {
  const res = await axios.get("/api/departments");
  departments.value = res.data.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
  if (departments.value.length > 0) {
    selectedDeptId.value = departments.value[0].id;
    fetchCategories();
  }
});

const fetchCategories = async () => {
  if (!selectedDeptId.value) return;
  try {
    const res = await axios.get(`/api/accountCategories/${selectedDeptId.value}`, {
      params: { date: baseDate.value },
    });
    categories.value = res.data.categories || [];

    const budgetRes = await axios.get(`/api/budgets`, {
      params: { year: year.value },
    });
    budgets.value = {};
    const budgetList = budgetRes.data.budgets || budgetRes.data || [];
    budgetList.forEach((b) => {
      budgets.value[b.category_id] = Number(b.budget_amount) || 0;
    });
    collapsedIds.value = new Set();
  } catch (err) {
    console.error("❌ 데이터 조회 실패:", err);
  }
};

const getDeptName = (deptId) => {
  const d = departments.value.find((dept) => dept.id === deptId);
  return d ? d.dept_name : "-";
};

const isLeafCategory = (categoryId) =>
  !categories.value.some((category) => category.parent_id === categoryId);

const sumChildren = (parentId) => {
  const children = categories.value.filter((c) => c.parent_id === parentId);
  return children.reduce((sum, child) => {
    if (child.owner_dept_id !== selectedDeptId.value) return sum;
    if (isLeafCategory(child.id)) {
      sum += Number(budgets.value[child.category_id] ?? 0);
    } else {
      sum += sumChildren(child.id);
    }
    return sum;
  }, 0);
};

const formatAmount = (val) => {
  if (val === null || val === undefined) return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};

const onBudgetInput = (e, category) => {
  const raw = e.target.value.replace(/[^0-9]/g, "");
  budgets.value[category.category_id] = raw ? Number(raw) : 0;
};

const saveAllBudgets = async () => {
  try {
    const payload = categories.value
      .filter((c) => isLeafCategory(c.id) && c.owner_dept_id === selectedDeptId.value)
      .map((c) => ({
        category_id: c.category_id,
        year: year.value,
        budget_amount: budgets.value[c.category_id] ?? 0,
      }));

    await axios.post("/api/budgets/bulk", { budgets: payload });
    alert("💾 예산이 저장되었습니다.");
  } catch (err) {
    console.error("❌ 예산 저장 실패:", err);
    alert("❌ 저장 실패");
  }
};

const getPathNames = (category) => {
  const list = categories.value;
  const path = [];
  let c = category;
  while (c) {
    path.unshift(c.category_name);
    c = c.parent_id != null ? list.find((x) => x.id === c.parent_id) : null;
  }
  return path;
};

const colLetter = (col) => String.fromCharCode(65 + col);

const downloadExcel = async () => {
  const { default: ExcelJS } = await import("exceljs");

  const leavesInOrder = categoriesTree.value.filter((c) => isLeafCategory(c.id));
  const deptName = getDeptName(selectedDeptId.value) || "부서";

  const dataRows = [];
  let prevPath = [null, null, null, null];
  leavesInOrder.forEach((c) => {
    const path = getPathNames(c);
    const p0 = path[0] ?? null;
    const p1 = path[1] ?? null;
    const p2 = path[2] ?? null;
    const p3 = path[3] ?? null;
    dataRows.push([
      p0 !== prevPath[0] ? p0 : null,
      p1 !== prevPath[1] ? p1 : null,
      p2 !== prevPath[2] ? p2 : null,
      p3 !== prevPath[3] ? p3 : null,
      Number(budgets.value[c.category_id] ?? 0),
      null,
    ]);
    prevPath = [p0, p1, p2, p3];
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("예산 일반 양식", { views: [{ state: "frozen", ySplit: 2 }] });

  ws.pageSetup.paperSize = 9;
  ws.pageSetup.orientation = "landscape";
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 1;

  const blackThin = { style: "thin", color: { argb: "FF000000" } };
  const tableBorder = {
    top: blackThin,
    left: blackThin,
    bottom: blackThin,
    right: blackThin,
  };

  ws.columns = [
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 20 },
  ];

  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `${deptName} ${year.value}년 예산`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = tableBorder;

  const headerRow = ["관", "항", "목", "세목", "예산액", "비고"];
  headerRow.forEach((val, col) => {
    const cell = ws.getCell(2, col + 1);
    cell.value = val;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = tableBorder;
  });

  const dataStartRow = 3;
  dataRows.forEach((row, r) => {
    const excelRow = dataStartRow + r;
    row.forEach((val, col) => {
      const cell = ws.getCell(excelRow, col + 1);
      cell.value = val;
      cell.border = tableBorder;
      if (col === 4) {
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  const mergeRange = (sr, sc, er, ec) =>
    ws.mergeCells(`${colLetter(sc)}${sr}:${colLetter(ec)}${er}`);
  for (let col = 0; col <= 3; col++) {
    let runStart = null;
    const n = dataRows.length;
    for (let r = 0; r < n; r++) {
      if (dataRows[r][col] !== null) {
        if (runStart !== null && r - 1 >= runStart + 1) {
          mergeRange(dataStartRow + runStart, col, dataStartRow + r - 1, col);
        }
        runStart = r;
      }
    }
    if (runStart !== null && n - 1 >= runStart + 1) {
      mergeRange(dataStartRow + runStart, col, dataStartRow + n - 1, col);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${deptName}_${year.value}예산서.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>
