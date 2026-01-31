<template>
  <div class="p-6 font-nanum">
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

      <div class="flex items-end gap-6">
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
        <button
          type="button"
          @click="fetchCategories"
          class="w-24 px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
        >
          조회
        </button>
        <button
          type="button"
          @click="downloadExcel"
          class="w-24 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="categoriesTree.length === 0"
        >
          Excel
        </button>
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
          <th class="border p-2 text-center">Owner부서</th>
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
            <span :style="{ paddingLeft: `${20 + (c.depth - 1) * 40}px` }">
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
          <td class="border p-2 text-center text-xs text-gray-600">
            {{ getDeptName(c.owner_dept_id) }}
          </td>
          <td class="border p-2 text-right font-mono">
            <template v-if="isLeafCategory(c.id)">
              <input
                v-if="c.owner_dept_id === selectedDeptId"
                type="text"
                class="border rounded p-1 w-40 text-right shadow-sm"
                :value="formatAmount(budgets[c.category_id] ?? 0)"
                @input="onBudgetInput($event, c)"
              />
              <span v-else class="text-gray-400 cursor-not-allowed" title="Owner 부서만 수정 가능">
                {{ formatAmount(budgets[c.category_id] ?? 0) }}
              </span>
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
import ExcelJS from "exceljs";

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

onMounted(async () => {
  const res = await axios.get("/api/departments");
  departments.value = res.data.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
  if (departments.value.length > 0) {
    selectedDeptId.value = departments.value[0].id;
    fetchCategories();
  }
});

// 계정과목 + 예산 로드
const fetchCategories = async () => {
  if (!selectedDeptId.value) return;

  try {
    // ✅ 부서별 계정과목 조회
    const res = await axios.get(`/api/accountCategories/${selectedDeptId.value}`, {
      params: { date: baseDate.value },
    });
    categories.value = res.data.categories || [];

    // ✅ 계정별(전사) 예산 불러오기 (부서 무관)
    const budgetRes = await axios.get(`/api/budgets`, {
      params: { year: year.value },
    });

    budgets.value = {};
    const budgetList = budgetRes.data.budgets || budgetRes.data || [];
    budgetList.forEach((b) => {
      budgets.value[b.category_id] = Number(b.budget_amount) || 0;
    });
  } catch (err) {
    console.error("❌ 데이터 조회 실패:", err);
  }
};

// 부모 계정명 찾기
const parentName = (parentId) => {
  const parent = categories.value.find((c) => c.id === parentId);
  return parent ? parent.category_name : "-";
};

const getDeptName = (deptId) => {
  const d = departments.value.find((dept) => dept.id === deptId);
  return d ? d.dept_name : "-";
};

// 날짜 포맷
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

// 일괄 저장
const saveAllBudgets = async () => {
  try {
    const payload = categories.value
      .filter((c) => isLeafCategory(c.id) && c.owner_dept_id === selectedDeptId.value)
      .map((c) => ({
      category_id: c.category_id, // 문자열 ID 저장
      year: year.value,
      budget_amount: isLeafCategory(c.id)
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
const isLeafCategory = (categoryId) =>
  !categories.value.some((category) => category.parent_id === categoryId);

// 하위 항목 합산
const sumChildren = (parentId) => {
  const children = categories.value.filter((c) => c.parent_id === parentId);
  return children.reduce((sum, child) => {
    // Owner 부서가 현재 선택된 부서와 같을 때만 합계에 포함
    if (child.owner_dept_id !== selectedDeptId.value) {
      return sum;
    }
    if (isLeafCategory(child.id)) {
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

// 계정 경로 (루트 → 현재) 이름 배열
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

// Excel 다운로드: 첨부 양식과 동일 (색상·셀병합·정렬)
const colLetter = (col) => String.fromCharCode(65 + col);

const downloadExcel = async () => {
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

  // A4 가로(랜드스케이프)에 맞춤
  ws.pageSetup.paperSize = 9; // A4
  ws.pageSetup.orientation = "landscape";
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1; // 가로 1페이지에 맞춤
  ws.pageSetup.fitToHeight = 1; // 세로 1페이지에 맞춤 (행 많으면 여러 페이지)

  const blackThin = { style: "thin", color: { argb: "FF000000" } };
  const tableBorder = {
    top: blackThin,
    left: blackThin,
    bottom: blackThin,
    right: blackThin,
  };

  // 열 너비
  ws.columns = [
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 20 },
  ];

  // 1행: 제목 (A1:F1 병합, 가운데, 굵게, 테두리)
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `${deptName} ${year.value}년 예산`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = tableBorder;

  // 2행: 헤더 (노란 배경, 가운데, 굵게, 테두리)
  const headerRow = ["관", "항", "목", "세목", "예산액", "비고"];
  headerRow.forEach((val, col) => {
    const cell = ws.getCell(2, col + 1);
    cell.value = val;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = tableBorder;
  });

  // 3행~: 데이터 (테두리)
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

  // 같은 값 연속 시 세로 병합 (관·항·목·세목)
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
