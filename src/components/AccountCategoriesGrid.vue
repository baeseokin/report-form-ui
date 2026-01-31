<template>
  <div class="p-6 font-nanum h-[calc(100vh-4rem)] flex flex-col">
    <div class="flex gap-4 flex-1 overflow-hidden">
      <!-- 🟢 좌측: 계정과목 마스터 관리 -->
      <div class="flex-1 flex flex-col bg-white border rounded-lg shadow-sm min-w-0">
        <div class="p-4 bg-purple-50 border-b flex justify-between items-center">
          <h3 class="font-bold text-lg text-purple-800">📂 계정과목 마스터</h3>
          <button
            @click="openModal('add', null)"
            class="px-3 py-1 bg-white border border-purple-300 text-purple-700 rounded hover:bg-purple-100 text-sm shadow-sm"
          >
            + 최상위(관) 추가
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100 text-gray-700 sticky top-0 z-10">
              <tr>
                <th class="border p-2 w-10 text-center">
                  <input type="checkbox" @change="toggleAllLeft" :checked="isAllLeftChecked" />
                </th>
                <th class="border p-2 text-left">계정명</th>
                <th class="border p-2 text-center w-20">단계</th>
                <th class="border p-2 text-center w-24">ID</th>
                <th class="border p-2 text-center w-24">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in visibleCategories"
                :key="c.id"
                class="hover:bg-gray-50 group"
                :class="{
                  'bg-blue-50': c.level === '관',
                  'bg-white': c.level !== '관'
                }"
              >
                <td class="border p-2 text-center">
                  <input type="checkbox" :value="c.id" v-model="leftCheckedIds" />
                </td>
                <td class="border p-2">
                  <div :style="{ paddingLeft: `${(c.depth - 1) * 20}px` }" class="flex items-center">
                    <!-- 토글 아이콘 -->
                    <span
                      v-if="c.children && c.children.length > 0"
                      @click.stop="toggleExpand(c.id)"
                      class="mr-1 cursor-pointer text-gray-500 hover:text-purple-600 w-4 text-center inline-block select-none"
                    >
                      {{ expandedIds.has(c.id) ? '▼' : '▶' }}
                    </span>
                    <span v-else class="w-4 mr-1 inline-block"></span>
                    <span class="mr-1 text-gray-400" v-if="c.depth > 1">└</span>
                    {{ c.category_name }}
                  </div>
                </td>
                <td class="border p-2 text-center text-gray-500">{{ c.level }}</td>
                <td class="border p-2 text-center font-mono text-xs">{{ c.category_id }}</td>
                <td class="border p-2 text-center">
                  <div class="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="openModal('add', c)" class="text-green-600 hover:bg-green-100 p-1 rounded" title="하위 추가">➕</button>
                    <button @click="openModal('edit', c)" class="text-blue-600 hover:bg-blue-100 p-1 rounded" title="수정">✏️</button>
                    <button @click="deleteCategory(c)" class="text-red-600 hover:bg-red-100 p-1 rounded" title="삭제">🗑</button>
                  </div>
                </td>
              </tr>
              <tr v-if="categoriesTree.length === 0">
                <td colspan="4" class="text-center p-6 text-gray-500">등록된 계정과목이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 🟠 중앙: 이동 버튼 -->
      <div class="flex flex-col justify-center items-center gap-4 px-2">
        <button
          @click="moveToRight"
          class="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!selectedDeptId || leftCheckedIds.length === 0"
          title="선택한 계정을 부서로 이동(매핑)"
        >
          ▶
        </button>
        <button
          @click="moveToLeft"
          class="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!selectedDeptId || rightCheckedIds.length === 0"
          title="선택한 계정을 부서에서 제거(매핑 해제)"
        >
          ◀
        </button>
      </div>

      <!-- � 우측: 부서별 매핑 관리 -->
      <!--  우측: 부서별 매핑 관리 -->
      <div class="flex-1 flex flex-col bg-white border rounded-lg shadow-sm min-w-0">
        <div class="p-4 bg-blue-50 border-b flex justify-between items-center gap-4">
          <div class="flex items-center gap-2 flex-1">
            <h3 class="font-bold text-lg text-blue-800 whitespace-nowrap">🔗 부서 매핑</h3>
            <select
              v-model="selectedDeptId"
              @change="fetchDeptMapping"
              class="border rounded p-1 text-sm flex-1 max-w-[200px]"
            >
              <option :value="null" disabled>부서 선택</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">
                {{ d.dept_name }}
              </option>
            </select>
          </div>
          <button
            @click="saveMapping"
            :disabled="!selectedDeptId"
            class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm disabled:bg-gray-300"
          >
            저장
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-2 relative">
          <div v-if="!selectedDeptId" class="absolute inset-0 flex items-center justify-center text-gray-400 bg-white bg-opacity-80 z-10">
            부서를 선택하면 매핑 정보를 설정할 수 있습니다.
          </div>

          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100 text-gray-700 sticky top-0">
              <tr>
                <th class="border p-2 w-10 text-center">
                  <input type="checkbox" @change="toggleAllRight" :checked="isAllRightChecked" />
                </th>
                <th class="border p-2 text-left">계정명</th>
                <th class="border p-2 text-center w-24">ID</th>
                <th class="border p-2 text-center w-20">단계</th>
                <th class="border p-2 text-center w-28">Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in categoriesTree" :key="c.id" class="hover:bg-gray-50" v-show="mappedCategoryIds.includes(c.id)">
                <td class="border p-2 text-center">
                  <input type="checkbox" :value="c.id" v-model="rightCheckedIds" />
                </td>
                <td class="border p-2">
                  <div :style="{ paddingLeft: `${(c.depth - 1) * 20}px` }" class="flex items-center">
                    <span class="mr-1 text-gray-400" v-if="c.depth > 1">└</span>
                    {{ c.category_name }}
                  </div>
                </td>
                <td class="border p-2 text-center text-gray-500 text-xs">{{ c.category_id }}</td>
                <td class="border p-2 text-center text-gray-500">{{ c.level }}</td>
                <td class="border p-2 text-center">
                  <div v-if="c.level === '관'">
                    <span class="text-xs text-gray-300">-</span>
                  </div>
                  <div v-else-if="c.owner_dept_id === selectedDeptId">
                    <button @click="toggleOwner(c)" class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-bold">
                      Owner (On)
                    </button>
                  </div>
                  <div v-else-if="c.owner_dept_id">
                    <span class="text-xs text-gray-500">{{ getDeptName(c.owner_dept_id) }}</span>
                  </div>
                  <div v-else>
                    <button @click="toggleOwner(c)" class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded hover:bg-gray-200">
                      Set Owner
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 추가/수정 모달 -->
    <div
      v-if="showModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
    >
      <div class="bg-white rounded-lg shadow-lg w-[400px] p-6">
        <h3 class="text-lg font-bold mb-4 text-purple-700">
          {{ modalMode === "add" ? "➕ 계정 추가" : "✏️ 계정 수정" }}
        </h3>

        <div class="space-y-3">
          <label class="block" v-if="modalForm.parent_id">
            <span class="text-gray-700">부모 계정ID</span>
            <input
              v-model="modalForm.parent_category_id"
              class="w-full border rounded p-2 mt-1 bg-gray-100"
              readonly
            />
          </label>

          <label class="block" v-if="modalForm.parent_id">
            <span class="text-gray-700">부모 계정명</span>
            <input
              v-model="modalForm.parent_category_name"
              class="w-full border rounded p-2 mt-1 bg-gray-100"
              readonly
            />
          </label>

          <label class="block">
            <span class="text-gray-700">계정ID</span>
            <input
              v-model="modalForm.category_id"
              class="w-full border rounded p-2 mt-1 bg-gray-100"
              readonly
            />
          </label>

          <label class="block">
            <span class="text-gray-700">계정명</span>
            <input
              v-model="modalForm.category_name"
              class="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-purple-400"
            />
          </label>


          <label class="block">
            <span class="text-gray-700">단계</span>
            <select
              v-model="modalForm.level"
              class="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-purple-400"
            >
              <option value="관">관</option>
              <option value="항">항</option>
              <option value="목">목</option>
              <option value="세목">세목</option>
            </select>
          </label>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            취소
          </button>
          <button
            @click="saveCategory"
            class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            저장
          </button>
        </div>
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
const mappedCategoryIds = ref([]); // 우측 화면에서 체크된 ID 목록
const leftCheckedIds = ref([]);    // 좌측 선택
const rightCheckedIds = ref([]);   // 우측 선택
const expandedIds = ref(new Set()); // 펼쳐진 노드 ID

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

// ✅ 트리 펼침/접기 필터링 (좌측 화면용)
const visibleCategories = computed(() => {
  const visibleNodes = [];
  const visibleIds = new Set();
  const expanded = expandedIds.value;

  for (const node of categoriesTree.value) {
    // 최상위(관)는 항상 표시
    if (!node.parent_id) {
      visibleIds.add(node.id);
      visibleNodes.push(node);
    } else {
      // 부모가 표시되어 있고 & 부모가 펼쳐져 있어야 표시
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
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  expandedIds.value = newSet;
};

// 전체 선택 여부
const isAllLeftChecked = computed(() => {
  return categories.value.length > 0 && leftCheckedIds.value.length === categories.value.length;
});
const isAllRightChecked = computed(() => {
  const mappedCount = mappedCategoryIds.value.length;
  return mappedCount > 0 && rightCheckedIds.value.length === mappedCount;
});

onMounted(async () => {
  try {
    const [deptRes, catRes] = await Promise.all([
      axios.get("/api/departments"),
      axios.get("/api/accountCategories") // 전체 계정과목 조회
    ]);
    departments.value = deptRes.data.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
    categories.value = Array.isArray(catRes.data.categories) ? catRes.data.categories : [];

    // ✅ 초기 로딩 시 '관' 레벨만 펼침 (항, 목, 세목은 접음)
    // "관, 항 까지만 펼쳐주고" -> 관 Open, 항 Closed (보이는 것: 관, 항)
    const initialExpanded = new Set();
    categories.value.forEach(c => {
      if (c.level === '관') {
        initialExpanded.add(c.id);
      }
    });
    expandedIds.value = initialExpanded;
  } catch (err) {
    console.error("❌ 초기 데이터 로드 실패:", err);
  }
});

// 마스터 데이터 재조회
const fetchAllCategories = async () => {
  try {
    const res = await axios.get("/api/accountCategories");
    categories.value = res.data.categories || [];
  } catch (err) {
    console.error("계정과목 조회 실패:", err);
  }
};

// 부서 선택 시 매핑 정보 조회
const fetchDeptMapping = async () => {
  if (!selectedDeptId.value) return;
  try {
    // 기존 API 활용: 해당 부서에 매핑된 목록만 가져옴
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

// ✅ 새 category_id 생성 (부서 종속성 제거)
const generateCategoryId = (childLevel, parentId) => {
  const parent = categories.value.find(c => c.id === parentId);
  
  const prefix = "ACC";
  let g = "00", h = "00", m = "00", s = "00";

  // 부모의 prefix(관/항/목 자리) 복사
  if (parent?.category_id) {
    g = parent.category_id.substr(3, 2);
    h = parent.category_id.substr(5, 2);
    m = parent.category_id.substr(7, 2);
    s = parent.category_id.substr(9, 2);
  }

  // parent 하위에서 childLevel 형제들을 찾고, 해당 자리 숫자의 최대값 + 1
  const siblings = categories.value.filter(c => c.parent_id === parentId && c.level === childLevel);

  const pickNum = (cat) => {
    if (!cat?.category_id) return 0;
    if (childLevel === "항")   return parseInt(cat.category_id.substr(5, 2)) || 0;  // 항 자리
    if (childLevel === "목")   return parseInt(cat.category_id.substr(7, 2)) || 0;  // 목 자리
    if (childLevel === "세목") return parseInt(cat.category_id.substr(9, 2)) || 0;  // 세목 자리
    if (childLevel === "관")   return parseInt(cat.category_id.substr(3, 2)) || 0;  // (예외) 관 추가 시
    return 0;
  };

  const maxNum = siblings.reduce((max, cat) => Math.max(max, pickNum(cat)), 0);
  const next = String(maxNum + 1).padStart(2, "0");

  // childLevel에 따라 해당 자리만 증가
  if (childLevel === "관")   g = next;
  if (childLevel === "항")   h = next;
  if (childLevel === "목")   m = next;
  if (childLevel === "세목") s = next;

  return `${prefix}${g}${h}${m}${s}`;
};


// 상위 → 하위 레벨 매핑
const nextLevel = (lvl) => {
  if (lvl === "관") return "항";
  if (lvl === "항") return "목";
  if (lvl === "목") return "세목";
  // 세목에서 +를 누르면 동일 레벨(세목)로 추가하도록 유지하거나, 막고 싶으면 여기서 처리
  return "세목";
};

const openModal = (mode, category) => {
  modalMode.value = mode;

  if (mode === "add") {
    // 부모(선행한 데이터)
    const parentCategory = category ? categories.value.find(c => c.id === category?.id) : null;

    // 부모가 있으면 하위 레벨로 자동 설정, 없으면(최상위 추가) 관부터
    const childLevel = parentCategory ? nextLevel(parentCategory.level) : "관";
    const parentIdForChild = parentCategory?.id || null;

    modalForm.value = {
      id: null,
      parent_id: parentIdForChild,
      parent_category_id: parentCategory?.category_id || "",
      parent_category_name: parentCategory?.category_name || "",
      // ✅ 부모 하위의 같은 레벨 최대값 + 1 로 category_id 생성
      category_id: generateCategoryId(
        childLevel,
        parentIdForChild
      ),
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


const closeModal = () => {
  showModal.value = false;
};

const saveCategory = async () => {
  if (modalMode.value === "add") {
    await axios.post("/api/accountCategories", {
      ...modalForm.value,
    });
  } else if (modalMode.value === "edit") {
    await axios.put(`/api/accountCategories/${modalForm.value.id}`, modalForm.value);
  }
  fetchAllCategories();
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

  // 이미 다른 부서가 Owner인 경우 경고
  if (original.owner_dept_id && original.owner_dept_id !== selectedDeptId.value) {
    alert(`이미 '${getDeptName(original.owner_dept_id)}' 부서가 Owner로 지정되어 있습니다.`);
    return;
  }

  // 현재 부서가 Owner면 해제(null), 아니면 설정
  const newOwner = original.owner_dept_id === selectedDeptId.value ? null : selectedDeptId.value;
  try {
    await axios.put(`/api/accountCategories/${original.id}`, { ...original, owner_dept_id: newOwner });
    // DB 저장 확인을 위해 재조회 (백엔드 미구현 시 UI 자동 원복됨)
    await fetchAllCategories();
  } catch (err) {
    console.error("Owner 설정 실패", err);
    alert("Owner 설정 중 오류가 발생했습니다.");
  }
};

// ✅ deleteCategory (실제 삭제)
const deleteCategory = async (row) => {
  if (!confirm(`'${row.category_name}' 계정을 삭제하시겠습니까?`)) return;
  try {
    await axios.delete(`/api/accountCategories/${row.id}`);
    await fetchAllCategories(); // ✅ 삭제 후 재조회
  } catch (e) {
    console.error(e);
    alert("삭제에 실패했습니다.");
  }
};

// ✅ 매핑 저장
const saveMapping = async () => {
  if (!selectedDeptId.value) return;
  try {
    await axios.post(`/api/departments/${selectedDeptId.value}/account-mapping`, {
      categoryIds: mappedCategoryIds.value
    });
    alert("매핑 정보가 저장되었습니다.");
  } catch (err) {
    console.error("매핑 저장 실패:", err);
    alert("저장 실패");
  }
};

const toggleAllLeft = (e) => {
  if (e.target.checked) {
    leftCheckedIds.value = categories.value.map(c => c.id);
  } else {
    leftCheckedIds.value = [];
  }
};

const toggleAllRight = (e) => {
  if (e.target.checked) {
    rightCheckedIds.value = [...mappedCategoryIds.value];
  } else {
    rightCheckedIds.value = [];
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
