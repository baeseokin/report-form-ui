<template>
  <div class="space-y-6 font-nanum px-2">
    <h2 class="text-lg font-bold text-gray-800">💸 지출내역 입력</h2>

    <!-- 항목 카드 -->
    <div
      v-for="(item, idx) in items"
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
        <select
          :value="item.mok"
          @change="onSelect(idx, 'mok', $event.target.value)"
          class="w-full p-2 border rounded text-sm"
        >
          <option disabled value="">선택</option>
          <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
        </select>

        <label class="block text-sm font-semibold text-gray-600">세목</label>
        <select
          :value="item.semok"
          @change="onSelect(idx, 'semok', $event.target.value)"
          class="w-full p-2 border rounded text-sm"
        >
          <option disabled value="">선택</option>
          <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
        </select>
      </div>

      <!-- 지출내역 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600">지출내역</label>
        <select
          :value="item.detail"
          @change="updateField(idx, 'detail', $event.target.value)"
          class="w-full p-2 border rounded text-sm"
        >
          <option disabled value="">선택</option>
          <option v-for="d in getDetails(item)" :key="d">{{ d }}</option>
        </select>
      </div>

      <!-- 금액 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600">금액</label>
        <input
          type="text"
          :value="formatCurrency(item.amount)"
          @input="updateAmount($event, idx)"
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
          @click="$emit('next')"
          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md transition text-sm"
        >
          다음 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";

const props = defineProps(["items", "deptData"]);
const emits = defineEmits(["update:items", "prev", "next"]);

const { user } = storeToRefs(useUserStore());
const userDept = computed(() => user.value?.deptName || "");

// ✅ 합계
const totalAmount = computed(() =>
  props.items.reduce((sum, i) => sum + (i.amount || 0), 0)
);

// ✅ JSON 기반 셀렉트 박스
const getGwans = computed(() =>
  userDept.value ? Object.keys(props.deptData[userDept.value] || {}) : []
);
const getHangs = (item) =>
  item.gwan && props.deptData[userDept.value]?.[item.gwan]
    ? Object.keys(props.deptData[userDept.value][item.gwan] || {})
    : [];
const getMoks = (item) =>
  item.hang && props.deptData[userDept.value]?.[item.gwan]?.[item.hang]
    ? Object.keys(props.deptData[userDept.value][item.gwan][item.hang] || {})
    : [];
const getSemoks = (item) =>
  item.mok && props.deptData[userDept.value]?.[item.gwan]?.[item.hang]?.[item.mok]
    ? Object.keys(props.deptData[userDept.value][item.gwan][item.hang][item.mok] || {})
    : [];
const getDetails = (item) =>
  item.semok &&
  props.deptData[userDept.value]?.[item.gwan]?.[item.hang]?.[item.mok]?.[item.semok]
    ? props.deptData[userDept.value][item.gwan][item.hang][item.mok][item.semok]
    : [];

// ✅ 값 업데이트
const updateField = (idx, field, value) => {
  const newItems = [...props.items];
  newItems[idx] = { ...newItems[idx], [field]: value };
  emits("update:items", newItems);
};

// ✅ 단계 변경 시 하위 필드 초기화
const onSelect = (idx, level, value) => {
  const item = { ...props.items[idx], [level]: value };
  if (level === "gwan") item.hang = item.mok = item.semok = item.detail = "";
  if (level === "hang") item.mok = item.semok = item.detail = "";
  if (level === "mok") item.semok = item.detail = "";
  if (level === "semok") item.detail = "";

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
    { selected: false, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 },
  ];
  emits("update:items", newItems);
};
const deleteItems = () => {
  const newItems = props.items.filter((i) => !i.selected);
  emits("update:items", newItems);
};
</script>
