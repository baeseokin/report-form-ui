<template>
  <div class="space-y-6 font-nanum px-2">
    <h2 class="text-lg font-bold text-gray-800">💸 지출내역 입력</h2>

    <!-- 📊 예산/지출/잔액 표시 -->
    <div class="grid grid-cols-1 gap-3 text-base font-bold">
      <div class="p-3 bg-blue-50 border border-blue-200 rounded">
        📊 예산 총액: {{ formatCurrency(totalBudget) }} 원
      </div>
      <div class="p-3 bg-red-50 border border-red-200 rounded">
        💸 지출 총액: {{ formatCurrency(totalExpense) }} 원
      </div>
      <div
        class="p-3 border rounded"
        :class="remainingBudget < 0 ? 'bg-red-100 border-red-300 text-red-600' : 'bg-green-50 border-green-200 text-green-700'"
      >
        💰 잔액: {{ formatCurrency(remainingBudget) }} 원
      </div>
    </div>

    <!-- 항목 카드 -->
    <div
      v-for="(item, idx) in formattedItems"
      :key="idx"
      class="border rounded-lg p-4 bg-white shadow-sm space-y-3 relative"
    >
      <!-- 선택 체크박스 -->
      <div class="absolute top-2 right-2">
        <input
          type="checkbox"
          :checked="item.selected"
          @change="updateField(idx, 'selected', $event.target.checked)"
        />
      </div>

      <!-- 관/항/목/세목 -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-600">관</label>
        <select
          :value="item.gwan"
          @change="onSelect(idx, 'gwan', $event.target.value)"
          class="w-full p-2 border rounded text-sm"
        >
          <option disabled value="">선택</option>
          <option v-for="g in getGwans" :key="g">{{ g }}</option>
        </select>

        <label class="block text-sm font-semibold text-gray-600">항</label>
        <select
          :value="item.hang"
          @change="onSelect(idx, 'hang', $event.target.value)"
          class="w-full p-2 border rounded text-sm"
        >
          <option disabled value="">선택</option>
          <option v-for="h in getHangs(item)" :key="h">{{ h }}</option>
        </select>

        <label class="block text-sm font-semibold text-gray-600">목</label>
        <template v-if="item.mok === '__custom__'">
          <input type="text" :value="item.customMok || ''" @input="updateField(idx, 'customMok', $event.target.value)" placeholder="목 직접 입력" class="w-full p-2 border rounded text-sm" />
        </template>
        <template v-else>
          <select :value="item.mok" @change="onSelect(idx, 'mok', $event.target.value)" class="w-full p-2 border rounded text-sm">
            <option disabled value="">선택</option>
            <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
            <option value="__custom__">직접입력</option>
          </select>
        </template>

        <label class="block text-sm font-semibold text-gray-600">세목</label>
        <template v-if="item.mok === '__custom__' || item.semok === '__custom__'">
          <input type="text" :value="item.customSemok || ''" @input="updateField(idx, 'customSemok', $event.target.value)" placeholder="세목 직접 입력" class="w-full p-2 border rounded text-sm" />
        </template>
        <template v-else>
          <select :value="item.semok" @change="onSelect(idx, 'semok', $event.target.value)" class="w-full p-2 border rounded text-sm">
            <option disabled value="">선택</option>
            <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
            <option value="__custom__">직접입력</option>
          </select>
        </template>
      </div>

      <!-- 지출내역 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600">지출내역</label>
        <template v-if="item.mok === '__custom__' || item.semok === '__custom__' || item.detail === '__custom__'">
          <input type="text" :value="item.customDetail || ''" @input="updateField(idx, 'customDetail', $event.target.value)" placeholder="지출내역 직접 입력" class="w-full p-2 border rounded text-sm" />
        </template>
        <template v-else>
          <select :value="item.detail" @change="updateField(idx, 'detail', $event.target.value)" class="w-full p-2 border rounded text-sm">
            <option disabled value="">선택</option>
            <option v-for="d in getDetails(item)" :key="d">{{ d }}</option>
            <option value="__custom__">직접입력</option>
          </select>
        </template>
      </div>

      <!-- 금액 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600">금액</label>
        <input
          type="text"
          :value="item.formattedAmount"
          @input="updateAmount($event, idx)"
          inputmode="numeric"
          pattern="[0-9]*"
          class="w-full p-2 text-right rounded border text-sm"
        />
      </div>
    </div>

    <!-- 합계 -->
    <div class="bg-purple-100 p-4 rounded-lg text-right font-bold text-gray-700">
      합계: {{ totalAmount.toLocaleString() }} 원
    </div>

    <!-- 버튼 -->
    <div class="flex flex-col gap-3 mt-6">
      <div class="flex gap-2">
        <button
          @click="addItem"
          class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg shadow-md transition text-sm"
        >
          ＋ 행 추가
        </button>
        <button
          @click="deleteItems"
          class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg shadow-md transition text-sm"
        >
          － 행 삭제
        </button>
      </div>

      <div class="flex gap-2">
        <button
          @click="$emit('prev')"
          class="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg shadow-md transition text-sm"
        >
          ← 이전
        </button>
        <button
          @click="handleNext"
          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md transition text-sm"
        >
          다음 →
        </button>
      </div>
    </div>

    <!-- 📌 예산 초과 알림 모달 -->
    <ModalAlert
      :visible="showAlert"
      title="알림"
      :message="alertMessage"
      @close="showAlert = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";
import axios from "axios";
import ModalAlert from "../ModalAlert.vue"; // ✅ 모달 추가

const props = defineProps(["items", "deptData"]);
const emits = defineEmits(["update:items", "prev", "next"]);

const { user } = storeToRefs(useUserStore());
const userDeptId = computed(() => user.value?.deptId || null);
const userDept = computed(() => user.value?.deptName || "");

// ✅ 합계
const totalAmount = computed(() =>
  props.items.reduce((sum, i) => sum + (i.amount || 0), 0)
);

// ✅ 금액 표시용 (포맷된 값)
const formattedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    formattedAmount: item.amount ? Number(item.amount).toLocaleString() : "",
  }))
);


// ✅ 예산/지출/잔액
const totalBudget = ref(0);
const serverExpense = ref(0);
const totalExpense = ref(0);
const currentYear = new Date().getFullYear();
const remainingBudget = computed(() => totalBudget.value - totalExpense.value);

// ✅ totalAmount 변경 → 서버 지출 합계 + 입력값 반영
watch(totalAmount, (newAmount) => {
  const baseExpense = Number(serverExpense.value) || 0;
  const addExpense = Number(newAmount) || 0;
  totalExpense.value = baseExpense + addExpense;
});

// ✅ 부서 변경 시 예산/지출 조회
watch(userDept, async (newDept) => {
  if (!newDept) return;
  try {
    const { data: summaryRes } = await axios.get(`/api/expenses/summary`, {
      params: { deptId: userDeptId.value, year: currentYear },
    });
    totalBudget.value = summaryRes.totalBudget || 0;
    serverExpense.value = summaryRes.totalExpense || 0;
    totalExpense.value = serverExpense.value;
  } catch (err) {
    console.error("❌ 예산/지출 조회 실패:", err);
  }
}, { immediate: true });


// ✅ account_categories 기반 계층 탐색
const deptCategories = computed(() => props.deptData[userDept.value] || []);

// "관" 목록
const getGwans = computed(() =>
  deptCategories.value.filter(c => c.level === "관").map(c => c.category_name)
);

// "항"
const getHangs = (item) => {
  if (!item.gwan) return [];
  const gwan = deptCategories.value.find(c => c.level === "관" && c.category_name === item.gwan);
  return gwan ? deptCategories.value.filter(c => c.parent_id === gwan.id && c.level === "항").map(c => c.category_name) : [];
};

// "목"
const getMoks = (item) => {
  if (!item.hang) return [];
  const hang = deptCategories.value.find(c => c.level === "항" && c.category_name === item.hang);
  return hang ? deptCategories.value.filter(c => c.parent_id === hang.id && c.level === "목").map(c => c.category_name) : [];
};

// "세목"
const getSemoks = (item) => {
  if (!item.mok) return [];
  const mok = deptCategories.value.find(c => c.level === "목" && c.category_name === item.mok);
  return mok ? deptCategories.value.filter(c => c.parent_id === mok.id && c.level === "세목").map(c => c.category_name) : [];
};

// "지출내역" (세목명과 동일하게)
const getDetails = (item) => {
  if (!item.semok) return [];
  return [item.semok]; // 기본적으로 세목명 사용
};

// ✅ 값 업데이트
const updateField = (idx, field, value) => {
  const newItems = [...props.items];
  newItems[idx] = { ...newItems[idx], [field]: value };
  emits("update:items", newItems);
};

// ✅ 단계 변경 시 하위 필드 초기화
const onSelect = (idx, level, value) => {
  const item = { ...props.items[idx], [level]: value };

  if (level === "mok") {
    if (value === "__custom__") {
      item.semok = "__custom__";
      item.detail = "__custom__";
    } else {
      item.semok = "";
      item.detail = "";
    }
  }

  if (level === "semok") {
    if (value === "__custom__") {
      item.detail = "__custom__";
    } else {
      item.detail = "";
    }
  }

  const newItems = [...props.items];
  newItems[idx] = item;
  emits("update:items", newItems);
};

// ✅ 금액 입력 처리
const formatCurrency = (value) => (value ? Number(value).toLocaleString() : "");
const updateAmount = (event, idx) => {
  const rawValue = event.target.value.replace(/[^0-9]/g, "");
  const amount = rawValue ? parseInt(rawValue, 10) : 0;
  const newItems = [...props.items];
  newItems[idx] = { ...newItems[idx], amount };
  emits("update:items", newItems);
};

// ✅ 행 추가/삭제
const addItem = () => {
  const newItems = [
    ...props.items,
    {
      selected: false,
      gwan: "",
      hang: "",
      mok: "",
      semok: "",
      detail: "",
      amount: 0,
      customMok: "",
      customSemok: "",
      customDetail: "",
    },
  ];
  emits("update:items", newItems);
};
const deleteItems = () => {
  const newItems = props.items.filter((i) => !i.selected);
  emits("update:items", newItems);
};

// ✅ "다음" 버튼 → 예산 초과 차단
const showAlert = ref(false);
const alertMessage = ref("");

const handleNext = () => {
  if (remainingBudget.value < 0) {
    alertMessage.value = "허용된 예산을 초과하였습니다.";
    showAlert.value = true;
  } else {
    emits("next");
  }
};

</script>