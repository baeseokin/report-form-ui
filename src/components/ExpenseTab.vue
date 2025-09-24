<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">💸 지출내역 입력</h2>

    <table class="w-full border text-sm bg-white rounded-lg overflow-hidden mt-3 table-fixed">
      <thead class="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800">
        <tr>
          <th class="border p-3 w-14">선택</th>
          <th class="border p-3 w-28">관</th>
          <th class="border p-3 w-28">항</th>
          <th class="border p-3 w-36">목</th>
          <th class="border p-3 w-36">세목</th>
          <th class="border p-3 w-44">지출내역</th>
          <th class="border p-3 w-32">금액</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="idx">
          <!-- 선택 -->
          <td class="border p-2 text-center">
            <input type="checkbox" :checked="item.selected" @change="updateField(idx, 'selected', $event.target.checked)" />
          </td>

          <!-- 관 -->
          <td class="border p-2">
            <select :value="item.gwan" @change="onSelect(idx, 'gwan', $event.target.value)" class="w-full p-2 border rounded">
              <option disabled value="">선택</option>
              <option v-for="g in getGwans" :key="g">{{ g }}</option>
            </select>
          </td>

          <!-- 항 -->
          <td class="border p-2">
            <select :value="item.hang" @change="onSelect(idx, 'hang', $event.target.value)" class="w-full p-2 border rounded">
              <option disabled value="">선택</option>
              <option v-for="h in getHangs(item)" :key="h">{{ h }}</option>
            </select>
          </td>

          <!-- 목 -->
          <td class="border p-2">
            <template v-if="item.mok === '__custom__'">
              <input type="text" :value="item.customMok || ''" @input="updateField(idx, 'customMok', $event.target.value)" placeholder="목 직접 입력" class="w-full p-2 border rounded" />
            </template>
            <template v-else>
              <select :value="item.mok" @change="onSelect(idx, 'mok', $event.target.value)" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
                <option value="__custom__">직접입력</option>
              </select>
            </template>
          </td>

          <!-- 세목 -->
          <td class="border p-2">
            <template v-if="item.mok === '__custom__' || item.semok === '__custom__'">
              <input type="text" :value="item.customSemok || ''" @input="updateField(idx, 'customSemok', $event.target.value)" placeholder="세목 직접 입력" class="w-full p-2 border rounded" />
            </template>
            <template v-else>
              <select :value="item.semok" @change="onSelect(idx, 'semok', $event.target.value)" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
                <option value="__custom__">직접입력</option>
              </select>
            </template>
          </td>

          <!-- 지출내역 -->
          <td class="border p-2">
            <template v-if="item.mok === '__custom__' || item.semok === '__custom__' || item.detail === '__custom__'">
              <input type="text" :value="item.customDetail || ''" @input="updateField(idx, 'customDetail', $event.target.value)" placeholder="지출내역 직접 입력" class="w-full p-2 border rounded" />
            </template>
            <template v-else>
              <select :value="item.detail" @change="updateField(idx, 'detail', $event.target.value)" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="d in getDetails(item)" :key="d">{{ d }}</option>
                <option value="__custom__">직접입력</option>
              </select>
            </template>
          </td>

          <!-- 금액 -->
          <td class="border p-2 text-right">
            <input type="text" :value="formatCurrency(item.amount)" @input="updateAmount($event, idx)" class="w-full p-2 text-right rounded border" />
          </td>
        </tr>

        <!-- 합계 -->
        <tr class="bg-purple-50 font-bold">
          <td class="border p-3 text-center" colspan="6">합계</td>
          <td class="border p-3 text-right">{{ totalAmount.toLocaleString() }} 원</td>
        </tr>
      </tbody>
    </table>

    <!-- 버튼 -->
    <div class="flex justify-between mt-6">
      <div>
        <button @click="addItem" class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow-md transition">＋ 행 추가</button>
        <button @click="deleteItems" class="ml-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow-md transition">－ 행 삭제</button>
      </div>
      <div class="flex gap-3">
        <button @click="$emit('prev')" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition">← 이전</button>
        <button @click="$emit('next')" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition">다음 →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";

const props = defineProps(["items", "deptData", "selectedDept"]);
const emits = defineEmits(["update:items", "prev", "next"]);

const { user } = storeToRefs(useUserStore());
const userDept = computed(() => props.selectedDept || user.value?.deptName || "");

// ✅ 합계
const totalAmount = computed(() =>
  props.items.reduce((sum, i) => sum + (i.amount || 0), 0)
);

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

  if (level === "gwan") {
    item.hang = "";
    item.mok = "";
    item.semok = "";
    item.detail = "";
  }
  if (level === "hang") {
    item.mok = "";
    item.semok = "";
    item.detail = "";
  }
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
  event.target.value = formatCurrency(amount);
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
</script>
