<template>
  <div class="p-6 font-nanum">
    <h2 class="text-2xl font-bold text-purple-700 mb-6">📊 계정 과목 관리</h2>

    <!-- 조회 조건 -->
    <div class="mb-6 flex items-center gap-6 bg-purple-50 p-4 rounded-lg shadow-sm">
      <!-- 부서 선택 -->
      <div class="flex items-center gap-2">
        <label class="font-semibold text-gray-700">부서</label>
        <select
          v-model="selectedDeptId"
          @change="fetchCategories"
          class="border rounded p-2 focus:ring-2 focus:ring-purple-400"
        >
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <!-- 기준일자 -->
      <div class="flex items-center gap-2">
        <label class="font-semibold text-gray-700">기준일자</label>
        <input
          type="date"
          v-model="selectedDate"
          @change="fetchCategories"
          class="border rounded p-2 focus:ring-2 focus:ring-purple-400"
        />
      </div>
    </div>

    <!-- 계정 목록 Grid -->
    <table class="w-full border text-sm">
      <thead class="bg-purple-100 text-gray-800">
        <tr>
          <th class="border p-2 text-center">계정명</th>
          <th class="border p-2 text-center">계정ID</th>
          <th class="border p-2 text-center">단계</th>
          <th class="border p-2 text-center">상위 계정</th>
          <th class="border p-2 text-center">유효기간</th>
          <th class="border p-2 text-center">관리</th>
        </tr>
      </thead>
      <tbody>
        <!-- 데이터가 있을 때: 기존 트리 렌더링 -->
        <template v-if="categoriesTree.length > 0">
          <tr
            v-for="c in categoriesTree"
            :key="c.id"
            class="hover:bg-gray-100"
            :class="{
              'bg-blue-200': c.level === '관',
              'bg-gray-100': c.level === '항',
              'bg-yellow-50': c.level === '목',
              'bg-white': c.level === '세목'
            }"
          >
            <td class="border p-2">
              <span :style="{ paddingLeft: `${(c.depth - 1) * 40}px` }">
                {{ c.category_name }}
              </span>
            </td>
            <td class="border p-2 text-center">{{ c.category_id }}</td>
            <td class="border p-2">{{ c.level }}</td>
            <td class="border p-2">{{ parentName(c.parent_id) }}</td>
            <td class="border p-2 text-center">
              {{ formatDate(c.valid_from) }} ~ {{ c.valid_to ? formatDate(c.valid_to) : "현재" }}
            </td>
            <td class="border p-2 text-center space-x-2">
              <button @click="openModal('add', c)" class="text-green-600 hover:underline">➕</button>
              <button @click="openModal('edit', c)" class="text-blue-600 hover:underline">✏️</button>
              <button @click="expireCategory(c)" class="text-red-600 hover:underline">🗑</button>
            </td>
          </tr>
        </template>

        <!-- 데이터가 없을 때: '+' 버튼 노출 -->
        <template v-else>
          <tr>
            <td colspan="6" class="text-center p-6">
              <button
                @click="openModal('add', null)"
                class="inline-flex items-center gap-2 text-2xl text-purple-700 hover:text-purple-900 px-5 py-3 border rounded-lg bg-white hover:bg-purple-50 shadow"
                :disabled="!selectedDeptId"
                :class="{ 'opacity-60 cursor-not-allowed': !selectedDeptId }"
                title="부서를 먼저 선택하세요"
              >
                ＋ <span class="text-base">관 추가</span>
              </button>
              <div class="mt-2 text-gray-500 text-sm">
                해당 부서에 최상위 ‘관’을 먼저 등록하세요.
              </div>
            </td>
          </tr>
        </template>
      </tbody>
</table>

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
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const categories = ref([]);

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

onMounted(async () => {
  const res = await axios.get("/api/departments");
  departments.value = res.data;
  if (departments.value.length > 0) {
    selectedDeptId.value = departments.value[0].id;
    fetchCategories();
  }
});

const fetchCategories = async () => {
  if (!selectedDeptId.value) return;
  try {
    const res = await axios.get(`/api/accountCategories/${selectedDeptId.value}`, {
      params: { date: selectedDate.value },
    });
    categories.value = Array.isArray(res.data.categories) ? res.data.categories : [];
  } catch (err) {
    console.error("❌ 계정과목 조회 실패:", err);
    categories.value = [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

const parentName = (parentId) => {
  const parent = categories.value.find(c => c.id === parentId);
  return parent ? parent.category_name : "-";
};

// ✅ 새 category_id 생성: parentId 하위 같은 레벨의 최대값 + 1
const generateCategoryId = (deptId, childLevel, parentId) => {
  const dept = departments.value.find(d => d.id === deptId);
  const deptCd = dept?.dept_cd || "XXX"; // 예: ANG

  const parent = categories.value.find(c => c.id === parentId);
  // parent가 없으면(최상위 관 추가) 각 자리 기본 "00"
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

  return `${deptCd}${g}${h}${m}${s}`;
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
  // ✅ 부서 선택 가드
  if (!selectedDeptId.value) {
    alert("부서를 먼저 선택하세요.");
    return;
  }

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
        selectedDeptId.value,
        childLevel,
        parentIdForChild
      ),
      category_name: "",
      level: childLevel
    };
  } else if (mode === "edit") {
    const parentCategory = categories.value.find(c => c.id === category.parent_id);
    modalForm.value = {
      ...category,
      parent_category_id: parentCategory?.category_id || "",
      parent_category_name: parentCategory?.category_name || ""
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
      dept_id: selectedDeptId.value,
    });
  } else if (modalMode.value === "edit") {
    await axios.put(`/api/accountCategories/${modalForm.value.id}`, modalForm.value);
  }
  fetchCategories();
  closeModal();
};

const expireCategory = async (category) => {
  if (!confirm(`'${category.category_name}' 항목을 종료하시겠습니까?`)) return;
  await axios.put(`/api/accountCategories/${category.id}/expire`, {
    valid_to: new Date().toISOString().split("T")[0],
  });
  fetchCategories();
};
</script>
