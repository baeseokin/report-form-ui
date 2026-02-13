<template>
  <div class="p-4 font-nanum min-h-[calc(100vh-4rem)] flex flex-col gap-4">
    <!-- 부서 선택 (상단 고정) -->
    <section class="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
      <label class="block text-sm font-semibold text-gray-700 mb-2">부서 선택</label>
      <select
        v-model="selectedDeptId"
        @change="fetchDeptMapping"
        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white"
      >
        <option :value="null" disabled>부서 선택</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">
          {{ d.dept_name }}
        </option>
      </select>
    </section>

    <!-- 계정과목 마스터 -->
    <section class="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="p-3 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
        <h3 class="font-bold text-base text-purple-800">📂 계정과목 마스터</h3>
        <button
          @click="openModal('add', null)"
          class="px-3 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 text-sm font-medium touch-manipulation"
        >
          + 최상위 추가
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="divide-y divide-gray-100">
          <div
            v-for="c in visibleCategories"
            :key="c.id"
            class="flex items-center gap-2 px-3 py-2.5 touch-manipulation"
            :class="{
              'bg-blue-50': c.level === '관',
              'bg-white': c.level !== '관'
            }"
          >
            <input
              type="checkbox"
              :value="c.id"
              v-model="leftCheckedIds"
              class="w-5 h-5 shrink-0 rounded border-gray-300"
            />
            <button
              v-if="c.children && c.children.length > 0"
              @click.stop="toggleExpand(c.id)"
              class="w-7 h-7 shrink-0 flex items-center justify-center text-gray-500 rounded-lg active:bg-gray-200"
            >
              {{ expandedIds.has(c.id) ? '▼' : '▶' }}
            </button>
            <span v-else class="w-7 shrink-0 block" />
            <div class="min-w-0 flex-1">
              <div :style="{ paddingLeft: `${(c.depth - 1) * 12}px` }" class="flex items-center gap-1 flex-wrap">
                <span v-if="c.depth > 1" class="text-gray-400 shrink-0">└</span>
                <span class="font-medium text-gray-900 truncate">{{ c.category_name }}</span>
                <span class="text-xs text-gray-500 font-mono shrink-0">{{ c.category_id }}</span>
                <span class="text-xs text-gray-400 shrink-0">{{ c.level }}</span>
              </div>
            </div>
            <div class="flex gap-1 shrink-0">
              <button @click="openModal('add', c)" class="p-2 text-green-600 rounded-lg active:bg-green-100" title="하위 추가">➕</button>
              <button @click="openModal('edit', c)" class="p-2 text-blue-600 rounded-lg active:bg-blue-100" title="수정">✏️</button>
              <button @click="deleteCategory(c)" class="p-2 text-red-600 rounded-lg active:bg-red-100" title="삭제">🗑</button>
            </div>
          </div>
        </div>
        <p v-if="categoriesTree.length === 0" class="text-center text-gray-500 py-8 text-sm">등록된 계정과목이 없습니다.</p>
      </div>
    </section>

    <!-- 이동 버튼 (세로 배치) -->
    <div class="grid grid-cols-2 gap-3">
      <button
        @click="moveToRight"
        class="py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium text-sm shadow-sm active:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        :disabled="!selectedDeptId || leftCheckedIds.length === 0"
      >
        ▶ 부서에 추가
      </button>
      <button
        @click="moveToLeft"
        class="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm shadow-sm active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        :disabled="!selectedDeptId || rightCheckedIds.length === 0"
      >
        ◀ 매핑 해제
      </button>
    </div>

    <!-- 부서 매핑 목록 -->
    <section class="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center flex-wrap gap-2">
        <h3 class="font-bold text-base text-blue-800">🔗 부서 매핑</h3>
        <button
          @click="saveMapping"
          :disabled="!selectedDeptId"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation"
        >
          저장
        </button>
      </div>
      <div v-if="!selectedDeptId" class="p-6 text-center text-gray-400 text-sm">
        부서를 선택하면 매핑 정보를 설정할 수 있습니다.
      </div>
      <div v-else class="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-64">
        <div
          v-for="c in categoriesTree"
          :key="c.id"
          v-show="mappedCategoryIds.includes(c.id)"
          class="flex items-center gap-2 px-3 py-2.5 touch-manipulation"
        >
          <input
            type="checkbox"
            :value="c.id"
            v-model="rightCheckedIds"
            class="w-5 h-5 shrink-0 rounded border-gray-300"
          />
          <div class="min-w-0 flex-1">
            <div :style="{ paddingLeft: `${(c.depth - 1) * 12}px` }" class="flex items-center gap-1 flex-wrap">
              <span v-if="c.depth > 1" class="text-gray-400 shrink-0">└</span>
              <span class="font-medium text-gray-900 truncate">{{ c.category_name }}</span>
              <span class="text-xs text-gray-500 font-mono">{{ c.category_id }}</span>
              <span class="text-xs text-gray-400">{{ c.level }}</span>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <template v-if="c.level === '관'">
              <span class="text-xs text-gray-300">-</span>
            </template>
            <template v-else-if="c.owner_dept_id === selectedDeptId">
              <button @click="toggleOwner(c)" class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold touch-manipulation">
                Owner
              </button>
            </template>
            <template v-else-if="c.owner_dept_id">
              <span class="text-xs text-gray-500">{{ getDeptName(c.owner_dept_id) }}</span>
            </template>
            <template v-else>
              <button @click="toggleOwner(c)" class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded touch-manipulation">
                Set Owner
              </button>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- 추가/수정 모달 (모바일 풀스크린 스타일) -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex flex-col bg-white font-nanum"
    >
      <div class="flex-1 overflow-y-auto p-4">
        <h3 class="text-lg font-bold mb-4 text-purple-700">
          {{ modalMode === "add" ? "➕ 계정 추가" : "✏️ 계정 수정" }}
        </h3>
        <div class="space-y-4">
          <label class="block" v-if="modalForm.parent_id">
            <span class="text-sm text-gray-600">부모 계정ID</span>
            <input v-model="modalForm.parent_category_id" class="w-full border rounded-lg p-3 mt-1 bg-gray-100 text-base" readonly />
          </label>
          <label class="block" v-if="modalForm.parent_id">
            <span class="text-sm text-gray-600">부모 계정명</span>
            <input v-model="modalForm.parent_category_name" class="w-full border rounded-lg p-3 mt-1 bg-gray-100 text-base" readonly />
          </label>
          <label class="block">
            <span class="text-sm text-gray-600">계정ID</span>
            <input v-model="modalForm.category_id" class="w-full border rounded-lg p-3 mt-1 bg-gray-100 text-base" readonly />
          </label>
          <label class="block">
            <span class="text-sm text-gray-600">계정명</span>
            <input v-model="modalForm.category_name" class="w-full border rounded-lg p-3 mt-1 focus:ring-2 focus:ring-purple-400 text-base" />
          </label>
          <label class="block">
            <span class="text-sm text-gray-600">단계</span>
            <select v-model="modalForm.level" class="w-full border rounded-lg p-3 mt-1 focus:ring-2 focus:ring-purple-400 text-base">
              <option value="관">관</option>
              <option value="항">항</option>
              <option value="목">목</option>
              <option value="세목">세목</option>
            </select>
          </label>
        </div>
      </div>
      <div class="p-4 border-t bg-gray-50 flex gap-3">
        <button @click="closeModal" class="flex-1 py-3 bg-gray-400 text-white rounded-xl font-medium active:bg-gray-500 touch-manipulation">
          취소
        </button>
        <button @click="saveCategory" class="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium active:bg-purple-700 touch-manipulation">
          저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const departments = ref([]);
const selectedDeptId = ref(null);
const categories = ref([]);
const mappedCategoryIds = ref([]);
const leftCheckedIds = ref([]);
const rightCheckedIds = ref([]);
const expandedIds = ref(new Set());

const showModal = ref(false);
const modalMode = ref("add");
const modalForm = ref({ id: null, parent_id: null, category_id: "", category_name: "", level: "관" });

const categoriesTree = computed(() => {
  const buildTree = (list, parentId = null, depth = 1) => {
    return list
      .filter(c => c.parent_id === parentId)
      .map(c => ({
        ...c,
        depth,
        children: buildTree(list, c.id, depth + 1),
      }))
      .flatMap(c => [c, ...c.children]);
  };
  return buildTree(categories.value);
});

const visibleCategories = computed(() => {
  const visibleNodes = [];
  const visibleIds = new Set();
  const expanded = expandedIds.value;
  for (const node of categoriesTree.value) {
    if (!node.parent_id) {
      visibleIds.add(node.id);
      visibleNodes.push(node);
    } else {
      if (visibleIds.has(node.parent_id) && expanded.has(node.parent_id)) {
        visibleIds.add(node.id);
        visibleNodes.push(node);
      }
    }
  }
  return visibleNodes;
});

const toggleExpand = (id) => {
  const newSet = new Set(expandedIds.value);
  if (newSet.has(id)) newSet.delete(id);
  else newSet.add(id);
  expandedIds.value = newSet;
};

onMounted(async () => {
  try {
    const [deptRes, catRes] = await Promise.all([
      axios.get("/api/departments"),
      axios.get("/api/accountCategories")
    ]);
    departments.value = deptRes.data.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
    categories.value = Array.isArray(catRes.data.categories) ? catRes.data.categories : [];
    const initialExpanded = new Set();
    categories.value.forEach(c => { if (c.level === '관') initialExpanded.add(c.id); });
    expandedIds.value = initialExpanded;
  } catch (err) {
    console.error("❌ 초기 데이터 로드 실패:", err);
  }
});

const fetchAllCategories = async () => {
  try {
    const res = await axios.get("/api/accountCategories");
    categories.value = res.data.categories || [];
  } catch (err) {
    console.error("계정과목 조회 실패:", err);
  }
};

const fetchDeptMapping = async () => {
  if (!selectedDeptId.value) return;
  try {
    const res = await axios.get(`/api/accountCategories/${selectedDeptId.value}`);
    const mappedList = res.data.categories || [];
    mappedCategoryIds.value = mappedList.map(c => c.id);
  } catch (err) {
    console.error("매핑 정보 조회 실패:", err);
    mappedCategoryIds.value = [];
    leftCheckedIds.value = [];
    rightCheckedIds.value = [];
  }
};

const generateCategoryId = (childLevel, parentId) => {
  const parent = categories.value.find(c => c.id === parentId);
  const prefix = "ACC";
  let g = "00", h = "00", m = "00", s = "00";
  if (parent?.category_id) {
    g = parent.category_id.substr(3, 2);
    h = parent.category_id.substr(5, 2);
    m = parent.category_id.substr(7, 2);
    s = parent.category_id.substr(9, 2);
  }
  const siblings = categories.value.filter(c => c.parent_id === parentId && c.level === childLevel);
  const pickNum = (cat) => {
    if (!cat?.category_id) return 0;
    if (childLevel === "항") return parseInt(cat.category_id.substr(5, 2)) || 0;
    if (childLevel === "목") return parseInt(cat.category_id.substr(7, 2)) || 0;
    if (childLevel === "세목") return parseInt(cat.category_id.substr(9, 2)) || 0;
    if (childLevel === "관") return parseInt(cat.category_id.substr(3, 2)) || 0;
    return 0;
  };
  const maxNum = siblings.reduce((max, cat) => Math.max(max, pickNum(cat)), 0);
  const next = String(maxNum + 1).padStart(2, "0");
  if (childLevel === "관") g = next;
  if (childLevel === "항") h = next;
  if (childLevel === "목") m = next;
  if (childLevel === "세목") s = next;
  return `${prefix}${g}${h}${m}${s}`;
};

const nextLevel = (lvl) => {
  if (lvl === "관") return "항";
  if (lvl === "항") return "목";
  if (lvl === "목") return "세목";
  return "세목";
};

const openModal = (mode, category) => {
  modalMode.value = mode;
  if (mode === "add") {
    const parentCategory = category ? categories.value.find(c => c.id === category?.id) : null;
    const childLevel = parentCategory ? nextLevel(parentCategory.level) : "관";
    const parentIdForChild = parentCategory?.id || null;
    modalForm.value = {
      id: null,
      parent_id: parentIdForChild,
      parent_category_id: parentCategory?.category_id || "",
      parent_category_name: parentCategory?.category_name || "",
      category_id: generateCategoryId(childLevel, parentIdForChild),
      category_name: "",
      level: childLevel,
      dept_ids: []
    };
  } else if (mode === "edit") {
    const parentCategory = categories.value.find(c => c.id === category.parent_id);
    modalForm.value = {
      ...category,
      parent_category_id: parentCategory?.category_id || "",
      parent_category_name: parentCategory?.category_name || "",
      dept_ids: category.dept_ids ? String(category.dept_ids).split(',').map(Number) : []
    };
  }
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveCategory = async () => {
  if (modalMode.value === "add") {
    await axios.post("/api/accountCategories", { ...modalForm.value });
  } else if (modalMode.value === "edit") {
    await axios.put(`/api/accountCategories/${modalForm.value.id}`, modalForm.value);
  }
  await fetchAllCategories();
  closeModal();
};

const getDeptName = (deptId) => {
  const d = departments.value.find(dept => dept.id === deptId);
  return d ? d.dept_name : "";
};

const toggleOwner = async (c) => {
  if (!selectedDeptId.value) return;
  const original = categories.value.find(cat => cat.id === c.id);
  if (!original) return;
  if (original.owner_dept_id && original.owner_dept_id !== selectedDeptId.value) {
    alert(`이미 '${getDeptName(original.owner_dept_id)}' 부서가 Owner로 지정되어 있습니다.`);
    return;
  }
  const newOwner = original.owner_dept_id === selectedDeptId.value ? null : selectedDeptId.value;
  try {
    await axios.put(`/api/accountCategories/${original.id}`, { ...original, owner_dept_id: newOwner });
    await fetchAllCategories();
  } catch (err) {
    console.error("Owner 설정 실패", err);
    alert("Owner 설정 중 오류가 발생했습니다.");
  }
};

const deleteCategory = async (row) => {
  if (!confirm(`'${row.category_name}' 계정을 삭제하시겠습니까?`)) return;
  try {
    await axios.delete(`/api/accountCategories/${row.id}`);
    await fetchAllCategories();
  } catch (e) {
    console.error(e);
    alert("삭제에 실패했습니다.");
  }
};

const saveMapping = async () => {
  if (!selectedDeptId.value) return;
  try {
    await axios.post(`/api/departments/${selectedDeptId.value}/account-mapping`, { categoryIds: mappedCategoryIds.value });
    alert("매핑 정보가 저장되었습니다.");
  } catch (err) {
    console.error("매핑 저장 실패:", err);
    alert("저장 실패");
  }
};

const moveToRight = () => {
  if (!selectedDeptId.value) return alert("부서를 선택하세요.");
  const newSet = new Set([...mappedCategoryIds.value, ...leftCheckedIds.value]);
  mappedCategoryIds.value = Array.from(newSet);
  leftCheckedIds.value = [];
};

const moveToLeft = () => {
  if (!selectedDeptId.value) return;
  mappedCategoryIds.value = mappedCategoryIds.value.filter(id => !rightCheckedIds.value.includes(id));
  rightCheckedIds.value = [];
};
</script>
