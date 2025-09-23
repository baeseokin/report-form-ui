<template>
  <div class="p-6 font-nanum">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">📊 계정 과목 관리 (Grid)</h2>

    <!-- 조회 조건 -->
    <div class="mb-4 flex items-center gap-4">
      <!-- 부서 선택 -->
      <div class="flex items-center gap-2">
        <label class="font-semibold text-gray-700">부서</label>
        <select v-model="selectedDeptId" @change="fetchCategories" class="border rounded p-2">
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
          class="border rounded p-2"
        />
      </div>
    </div>

    <!-- 계정 목록 Grid -->
    <table class="w-full border text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2 text-center">계정명</th>
          <th class="border p-2 text-center">단계</th>
          <th class="border p-2 text-center">상위 계정</th>
          <th class="border p-2 text-center">유효기간</th>
          <th class="border p-2 text-center">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in categoriesTree" :key="c.id" class="hover:bg-gray-50">
          <td class="border p-2">
            <span :style="{ paddingLeft: `${(c.depth - 1) * 40}px` }">
              {{ c.category_name }}
            </span>
          </td>
          <td class="border p-2">{{ c.level }}</td>
          <td class="border p-2">{{ parentName(c.parent_id) }}</td>
          <td class="border p-2 text-center">
            {{ formatDate(c.valid_from) }} ~ {{ c.valid_to ? formatDate(c.valid_to) : "현재" }}
          </td>
          <td class="border p-2 text-center space-x-2">
            <button @click="openModal('add', c)" class="text-green-600">➕</button>
            <button @click="openModal('edit', c)" class="text-blue-600">✏️</button>
            <button @click="expireCategory(c)" class="text-red-600">🗑</button>
          </td>
        </tr>
        <tr v-if="categoriesTree.length === 0">
          <td colspan="5" class="text-center p-4 text-gray-500">데이터가 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <!-- 추가/수정 모달 -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white rounded-lg shadow-lg w-[400px] p-6">
        <h3 class="text-lg font-bold mb-4">
          {{ modalMode === "add" ? "➕ 계정 추가" : "✏️ 계정 수정" }}
        </h3>

        <div class="space-y-3">
          <label class="block">
            <span class="text-gray-700">계정명</span>
            <input v-model="modalForm.category_name" class="w-full border rounded p-2 mt-1" />
          </label>

          <label class="block">
            <span class="text-gray-700">단계</span>
            <select v-model="modalForm.level" class="w-full border rounded p-2 mt-1">
              <option value="관">관</option>
              <option value="항">항</option>
              <option value="목">목</option>
              <option value="세목">세목</option>
            </select>
          </label>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeModal" class="px-4 py-2 bg-gray-400 text-white rounded">취소</button>
          <button @click="saveCategory" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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
const selectedDate = ref(new Date().toISOString().split("T")[0]); // 오늘 날짜 기본값
const categories = ref([]);

const showModal = ref(false);
const modalMode = ref("add");
const modalForm = ref({ id: null, parent_id: null, category_name: "", level: "관" });

// ✅ 계층 구조를 Grid로 변환 (depth 계산)
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
    console.log("📥 accountCategories 응답:", res.data);

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

const openModal = (mode, category) => {
  modalMode.value = mode;
  if (mode === "add") {
    modalForm.value = { id: null, parent_id: category?.id || null, category_name: "", level: "항" };
  } else if (mode === "edit") {
    modalForm.value = { ...category };
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
