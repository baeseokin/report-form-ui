<template>
  <div class="p-6 font-nanum">
    <!-- 화면 설명 -->
    <div class="mb-6 bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-800 shadow-sm">
      <p class="font-medium">💡 회기 중간 시스템 도입에 따른 과거 지출 내역(기지출액)을 등록합니다.</p>
      <p class="mt-1 text-purple-600">
        전체 계정에 대한 기지출액을 한 번에 입력할 수 있으며, 입력된 데이터는 예산 잔액 계산에 반영됩니다.<br/>
        기지출총액이나 합계 지출총액을 입력하면 서로 자동 계산됩니다.
      </p>
    </div>

    <!-- 연도 선택 및 조회 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-6 items-end">
      <div class="flex flex-col w-32">
        <label class="font-semibold text-gray-600 mb-1 text-sm">회계연도</label>
        <input
          type="number"
          v-model="year"
          @change="fetchData"
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
          @click="fetchData"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          조회
        </button>
      </div>
    </div>

    <!-- 전체 항(Hang) 목록 Grid -->
    <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-700">
            <th class="border p-3 text-center w-32">관(Gwan)</th>
            <th class="border p-3 text-center w-32">항(Hang)</th>
            <th class="border p-3 text-center w-32">주관 부서</th>
            <th class="border p-3 text-center w-32">항별 예산총액</th>
            <th class="border p-3 text-center w-32">시스템 지출총액</th>
            <th class="border p-3 text-center w-40">기지출총액 입력 (원)</th>
            <th class="border p-3 text-center w-40">합계 지출총액 (원)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hang in hangCategories" :key="hang.category_id" class="hover:bg-purple-50 transition text-sm h-10">
            <td class="border p-3 text-center text-gray-600">{{ hang.gwan_name || '-' }}</td>
            <td class="border p-3 font-medium text-gray-800">{{ hang.category_name }} <span class="text-xs text-gray-400">({{ hang.category_id }})</span></td>
            <td class="border p-3 text-center">
              <span v-if="hang.owner_dept_name" class="text-gray-700">{{ hang.owner_dept_name }}</span>
              <span v-else class="text-red-500 font-semibold text-xs">미지정</span>
            </td>
            <td class="border p-3 text-right text-gray-600">{{ formatAmount(hang.budget) }}</td>
            <td class="border p-3 text-right text-gray-600">{{ formatAmount(hang.system_expense) }}</td>
            
            <td class="border p-3 text-center">
              <input
                type="text"
                class="border border-gray-300 rounded px-3 py-1.5 w-full text-right focus:outline-none focus:ring-2 focus:ring-gray-300"
                :value="formatAmount(inputInitialExpenses[hang.category_id])"
                @input="onInitialAmountInput($event, hang)"
                placeholder="0"
                :class="{ 'bg-yellow-50': isModified(hang.category_id) }"
              />
            </td>
            <td class="border p-3 text-center">
              <input
                type="text"
                class="border border-blue-300 rounded px-3 py-1.5 w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-300 text-blue-800 font-medium"
                :value="formatAmount(inputTotalExpenses[hang.category_id])"
                @input="onTotalAmountInput($event, hang)"
                placeholder="0"
                :class="{ 'bg-yellow-50': isModified(hang.category_id) }"
              />
            </td>
          </tr>
          <tr v-if="hangCategories.length === 0">
            <td colspan="7" class="text-center p-6 text-gray-500">
              조회된 항(Hang) 카테고리가 없습니다.
            </td>
          </tr>
        </tbody>
        <tfoot v-if="hangCategories.length > 0" class="bg-gray-50 font-bold">
          <tr>
            <td colspan="3" class="border p-3 text-center text-gray-700">총계</td>
            <td class="border p-3 text-right text-gray-700 pr-3">{{ formatAmount(sumBudget) }}</td>
            <td class="border p-3 text-right text-gray-700 pr-3">{{ formatAmount(sumSystem) }}</td>
            <td class="border p-3 text-right text-purple-700 pr-3">{{ formatAmount(sumInitial) }}</td>
            <td class="border p-3 text-right text-blue-700 pr-3">{{ formatAmount(sumTotal) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 저장 버튼 -->
    <div class="flex justify-end gap-3">
      <button
        v-if="hasModifications"
        @click="fetchData"
        class="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-300 transition"
      >
        변경 취소
      </button>
      <button
        @click="saveInitialExpenses"
        :disabled="isSaving || hangCategories.length === 0 || !hasModifications"
        class="px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg shadow-md hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <span v-if="isSaving">저장 중...</span>
        <span v-else>💾 변경된 항목 일괄 저장</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const year = ref(new Date().getFullYear());
const requestDate = ref(new Date().toISOString().split("T")[0]);
const hangCategories = ref([]);

const originalInitialExpenses = ref({});
const inputInitialExpenses = ref({});
const inputTotalExpenses = ref({});
const isSaving = ref(false);

onMounted(() => {
  fetchData();
});

const fetchData = async () => {
  try {
    const res = await axios.get(`/api/initial-expenses-data?year=${year.value}`);
    if (res.data.success) {
      hangCategories.value = res.data.categories || [];
      
      // 상태 초기화
      originalInitialExpenses.value = {};
      inputInitialExpenses.value = {};
      inputTotalExpenses.value = {};

      hangCategories.value.forEach(hang => {
        const initial = Number(hang.initial_expense) || 0;
        const system = Number(hang.system_expense) || 0;
        
        originalInitialExpenses.value[hang.category_id] = initial;
        inputInitialExpenses.value[hang.category_id] = initial;
        inputTotalExpenses.value[hang.category_id] = system + initial;
      });
    }
  } catch (err) {
    console.error("❌ 데이터 로드 실패:", err);
    alert("데이터를 불러오는데 실패했습니다.");
  }
};

// 검증 헬퍼: 주관 부서가 있는지 체크
const checkOwnerDept = (hang) => {
  if (!hang.owner_dept_id) {
    alert(`[${hang.category_name}] 주관 부서가 지정되지 않았습니다.\n계정과목 관리 화면에서 주관 부서를 먼저 설정해 주세요.`);
    return false;
  }
  return true;
};

// 기지출총액 입력 핸들러
const onInitialAmountInput = (e, hang) => {
  let rawStr = e.target.value.replace(/[^0-9-]/g, "");
  if (rawStr === "-" || rawStr === "") rawStr = "0";
  let initialValue = Number(rawStr);

  // 주관 부서 체크
  if (!checkOwnerDept(hang)) {
    e.target.value = formatAmount(inputInitialExpenses.value[hang.category_id]);
    return;
  }

  const systemExpense = Number(hang.system_expense) || 0;
  const totalValue = systemExpense + initialValue;

  inputInitialExpenses.value[hang.category_id] = initialValue;
  inputTotalExpenses.value[hang.category_id] = totalValue;
  e.target.value = formatAmount(initialValue);
};

// 합계 지출총액 입력 핸들러
const onTotalAmountInput = (e, hang) => {
  let rawStr = e.target.value.replace(/[^0-9-]/g, "");
  if (rawStr === "-" || rawStr === "") rawStr = "0";
  let totalValue = Number(rawStr);

  const systemExpense = Number(hang.system_expense) || 0;
  const initialValue = totalValue - systemExpense;

  // 주관 부서 체크
  if (!checkOwnerDept(hang)) {
    e.target.value = formatAmount(inputTotalExpenses.value[hang.category_id]);
    return;
  }

  inputTotalExpenses.value[hang.category_id] = totalValue;
  inputInitialExpenses.value[hang.category_id] = initialValue;
  e.target.value = formatAmount(totalValue);
};

// 숫자 포맷팅 (콤마)
const formatAmount = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return Number(val).toLocaleString();
};

const isModified = (categoryId) => {
  return inputInitialExpenses.value[categoryId] !== originalInitialExpenses.value[categoryId];
};

const hasModifications = computed(() => {
  return hangCategories.value.some(hang => isModified(hang.category_id));
});

// 합계 계산
const sumBudget = computed(() => hangCategories.value.reduce((sum, h) => sum + (Number(h.budget) || 0), 0));
const sumSystem = computed(() => hangCategories.value.reduce((sum, h) => sum + (Number(h.system_expense) || 0), 0));
const sumInitial = computed(() => hangCategories.value.reduce((sum, h) => sum + (Number(inputInitialExpenses.value[h.category_id]) || 0), 0));
const sumTotal = computed(() => hangCategories.value.reduce((sum, h) => sum + (Number(inputTotalExpenses.value[h.category_id]) || 0), 0));


const saveInitialExpenses = async () => {
  if (!hasModifications.value) return;

  const modifiedItems = hangCategories.value
    .filter(hang => isModified(hang.category_id))
    .map(hang => ({
      category_id: hang.category_id,
      parent_id: hang.parent_id,
      owner_dept_id: hang.owner_dept_id,
      amount: inputInitialExpenses.value[hang.category_id]
    }));

  if (modifiedItems.length === 0) return;

  // 음수 검증
  const negativeItems = modifiedItems.filter(item => item.amount < 0);
  if (negativeItems.length > 0) {
    alert(`기지출총액은 음수일 수 없습니다.\n음수가 입력된 항목이 ${negativeItems.length}건 있습니다.\n합계 지출총액이 시스템 지출총액보다 작지 않은지 확인해주세요.`);
    return;
  }

  if (!confirm(`총 ${modifiedItems.length}건의 계정과목 기지출액을 업데이트 하시겠습니까?`)) {
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      year: year.value,
      request_date: requestDate.value,
      items: modifiedItems
    };

    const res = await axios.post("/api/dummy-claims-bulk", payload);
    
    if (res.data.success) {
      alert("✅ 변경된 기지출액이 성공적으로 저장되었습니다.");
      await fetchData(); // 재조회하여 상태 동기화
    } else {
      throw new Error(res.data.message || "저장 실패");
    }
  } catch (err) {
    console.error("저장 에러:", err);
    alert(`❌ 등록에 실패했습니다.\n${err.message}`);
  } finally {
    isSaving.value = false;
  }
};
</script>
