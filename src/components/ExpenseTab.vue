<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">💸 지출내역 입력</h2>

    <table class="w-full border text-sm bg-white rounded-lg overflow-hidden mt-3">
      <thead class="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800">
        <tr>
          <th class="border p-3">선택</th>
          <th class="border p-3">관</th>
          <th class="border p-3">항</th>
          <th class="border p-3">목</th>
          <th class="border p-3">세목</th>
          <th class="border p-3">지출내역</th>
          <th class="border p-3">금액</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="idx">
          <!-- 선택 체크박스 -->
          <td class="border p-2 text-center">
            <input
              type="checkbox"
              :checked="item.selected"
              @change="updateField(idx, 'selected', $event.target.checked)"
            />
          </td>

          <!-- 관 -->
          <td class="border p-2">
            <select
              :value="item.gwan"
              @change="onSelect(idx, 'gwan', $event.target.value)"
              class="w-full p-2 border rounded"
            >
              <option disabled value="">선택</option>
              <option v-for="g in getGwans" :key="g">{{ g }}</option>
            </select>
          </td>

          <!-- 항 -->
          <td class="border p-2">
            <select
              :value="item.hang"
              @change="onSelect(idx, 'hang', $event.target.value)"
              class="w-full p-2 border rounded"
            >
              <option disabled value="">선택</option>
              <option v-for="h in getHangs(item)" :key="h">{{ h }}</option>
            </select>
          </td>

          <!-- 목 -->
          <td class="border p-2">
            <select
              :value="item.mok"
              @change="onSelect(idx, 'mok', $event.target.value)"
              class="w-full p-2 border rounded"
            >
              <option disabled value="">선택</option>
              <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
            </select>
          </td>

          <!-- 세목 -->
          <td class="border p-2">
            <select
              :value="item.semok"
              @change="onSelect(idx, 'semok', $event.target.value)"
              class="w-full p-2 border rounded"
            >
              <option disabled value="">선택</option>
              <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
            </select>
          </td>

          <!-- 지출내역 -->
          <td class="border p-2">
            <select
              :value="item.detail"
              @change="updateField(idx, 'detail', $event.target.value)"
              class="w-full p-2 border rounded"
            >
              <option disabled value="">선택</option>
              <option v-for="d in getDetails(item)" :key="d">{{ d }}</option>
            </select>
          </td>

          <!-- 금액 -->
          <td class="border p-2 text-right">
            <input
              type="text"
              :value="formatCurrency(item.amount)"
              @input="updateAmount($event, idx)"
              class="w-full p-2 text-right rounded border"
            />
          </td>
        </tr>

        <!-- 합계 -->
        <tr class="bg-purple-50 font-bold">
          <td class="border p-3 text-center" colspan="6">합계</td>
          <td class="border p-3 text-right">
            {{ totalAmount.toLocaleString() }} 원
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 버튼 -->
    <div class="flex justify-between mt-6">
      <div>
        <button
          @click="addItem"
          class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow-md transition"
        >
          ＋ 행 추가
        </button>
        <button
          @click="deleteItems"
          class="ml-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow-md transition"
        >
          － 행 삭제
        </button>
      </div>
      <div class="flex gap-3">
        <button
          @click="$emit('prev')"
          class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition"
        >
          ← 이전
        </button>
        <button
          @click="$emit('next')"
          class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
        >
          다음 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useUserStore } from "../store/userStore";
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
