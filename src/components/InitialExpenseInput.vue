<template>
  <div class="p-6 font-nanum">
    <!-- 화면 설명 -->
    <div class="mb-6 bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-800 shadow-sm">
      <p class="font-medium">💡 회기 중간 시스템 도입에 따른 과거 지출 내역(기지출액)을 등록합니다.</p>
      <p class="mt-1 text-purple-600">입력된 데이터는 예산 잔액 계산에 반영되며 일반 결재 목록에는 표시되지 않습니다.</p>
    </div>

    <!-- 부서 & 연도 선택 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-6 items-end">
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">부서 선택</label>
        <select
          v-model="selectedDeptId"
          @change="fetchCategories"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition"
        >
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <div class="flex flex-col w-32">
        <label class="font-semibold text-gray-600 mb-1 text-sm">회계연도</label>
        <input
          type="number"
          v-model="year"
          @change="fetchCategories"
          min="2000"
          max="2100"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition"
        />
      </div>

      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">가청구건 등록일자</label>
        <input
          type="date"
          v-model="requestDate"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition"
        />
      </div>

      <div class="flex items-end">
        <button
          type="button"
          @click="fetchCategories"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          조회
        </button>
      </div>
    </div>

    <!-- 항(Hang) 목록 Grid -->
    <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-700">
            <th class="border p-3 text-center w-24">관(Gwan)</th>
            <th class="border p-3 text-center w-24">항(Hang)</th>
            <th class="border p-3 text-center">항 이름</th>
            <th class="border p-3 text-center w-64">기지출액 입력 (원)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hang in hangCategories" :key="hang.id" class="hover:bg-purple-50 transition text-sm h-10">
            <td class="border p-3 text-center text-gray-600">{{ parentName(hang.parent_id) }}</td>
            <td class="border p-3 text-center font-mono text-gray-600">{{ hang.category_id }}</td>
            <td class="border p-3 font-medium text-gray-800">{{ hang.category_name }}</td>
            <td class="border p-3 text-center">
              <input
                type="text"
                class="border border-gray-300 rounded px-3 py-1.5 w-full text-right focus:outline-none focus:ring-2 focus:ring-gray-300"
                :value="formatAmount(initialExpenses[hang.category_id] ?? 0)"
                @input="onAmountInput($event, hang.category_id)"
                placeholder="0"
              />
            </td>
          </tr>
          <tr v-if="hangCategories.length === 0">
            <td colspan="4" class="text-center p-6 text-gray-500">
              해당 부서에 등록된 항(Hang) 카테고리가 없습니다.
            </td>
          </tr>
        </tbody>
        <tfoot v-if="hangCategories.length > 0" class="bg-gray-50 font-bold">
          <tr>
            <td colspan="3" class="border p-3 text-center text-gray-700">총 기지출액 합계</td>
            <td class="border p-3 text-right text-purple-700 pr-5 text-base">
              {{ formatAmount(totalInitialExpense) }} 원
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 저장 버튼 -->
    <div class="flex justify-end">
      <button
        @click="saveInitialExpenses"
        :disabled="isSaving || hangCategories.length === 0 || totalInitialExpense === 0"
        class="px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg shadow-md hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <span v-if="isSaving">저장 중...</span>
        <span v-else>💾 가청구건 저장</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useUserStore } from "../store/userStore";

const userStore = useUserStore();
const departments = ref([]);
const selectedDeptId = ref(null);
const allCategories = ref([]);
const year = ref(new Date().getFullYear());
const requestDate = ref(new Date().toISOString().split("T")[0]);
const initialExpenses = ref({});
const isSaving = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get("/api/departments");
    departments.value = res.data.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
    if (departments.value.length > 0) {
      selectedDeptId.value = departments.value[0].id;
      await fetchCategories();
    }
  } catch (err) {
    console.error("부서 목록 로드 실패", err);
  }
});

const fetchCategories = async () => {
  if (!selectedDeptId.value) return;

  try {
    const res = await axios.get(`/api/accountCategories/${selectedDeptId.value}`);
    let categories = res.data.categories || res.data || [];
    allCategories.value = categories;
    
    // 금액 초기화
    initialExpenses.value = {};
    hangCategories.value.forEach(hang => {
      initialExpenses.value[hang.category_id] = 0;
    });
  } catch (err) {
    console.error("❌ 카테고리 로드 실패:", err);
  }
};

// '항' 레벨이고 현재 부서가 Owner인 카테고리만 필터링
const hangCategories = computed(() => {
  return allCategories.value.filter(c => c.level === '항' && c.owner_dept_id === selectedDeptId.value);
});

// 부모(관) 카테고리 이름 찾기
const parentName = (parentId) => {
  if (!parentId) return "-";
  const parent = allCategories.value.find((c) => c.id === parentId);
  return parent ? parent.category_name : "-";
};

// 부서 이름 찾기
const selectedDeptName = computed(() => {
  const d = departments.value.find(dept => dept.id === selectedDeptId.value);
  return d ? d.dept_name : "";
});

// 숫자 포맷팅 (콤마)
const formatAmount = (val) => {
  if (!val) return "";
  return Number(val).toLocaleString();
};

const onAmountInput = (e, categoryId) => {
  const raw = e.target.value.replace(/[^0-9]/g, "");
  initialExpenses.value[categoryId] = raw ? Number(raw) : 0;
  e.target.value = formatAmount(initialExpenses.value[categoryId]);
};

// 총합 계산
const totalInitialExpense = computed(() => {
  return Object.values(initialExpenses.value).reduce((sum, val) => sum + (Number(val) || 0), 0);
});

const saveInitialExpenses = async () => {
  if (totalInitialExpense.value === 0) {
    alert("입력된 기지출액이 없습니다.");
    return;
  }

  if (!confirm(`총 ${formatAmount(totalInitialExpense.value)}원의 가청구건(기지출액)을 등록하시겠습니까?\n등록된 내역은 지출 총액에 바로 반영됩니다.`)) {
    return;
  }

  isSaving.value = true;
  try {
    // 0보다 큰 금액이 입력된 항목만 추려냄
    const items = hangCategories.value
      .filter(hang => (initialExpenses.value[hang.category_id] || 0) > 0)
      .map(hang => {
        const gwan = allCategories.value.find(c => c.id === hang.parent_id);
        return {
          gwan_id: gwan ? gwan.category_id : null,
          hang_id: hang.category_id,
          amount: initialExpenses.value[hang.category_id]
        };
      });

    const payload = {
      dept_id: selectedDeptId.value,
      dept_name: selectedDeptName.value,
      year: year.value,
      request_date: requestDate.value,
      items
    };

    const res = await axios.post("/api/dummy-claims", payload);
    
    if (res.data.success) {
      alert("✅ 가청구건(기지출액)이 성공적으로 등록되었습니다.");
      initialExpenses.value = {}; // 입력 초기화
    } else {
      throw new Error(res.data.message || "저장 실패");
    }
  } catch (err) {
    console.error("가청구건 등록 에러:", err);
    alert(`❌ 등록에 실패했습니다.\n${err.message}`);
  } finally {
    isSaving.value = false;
  }
};
</script>
