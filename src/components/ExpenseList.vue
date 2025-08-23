<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-800">💸 지출내역 입력</h2>
    <table class="w-full border text-sm bg-white rounded-lg overflow-hidden mt-3">
      <thead>
        <tr class="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800">
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
        <tr v-for="(item, idx) in localItems" :key="idx">
          <td class="border p-2 text-center"><input type="checkbox" v-model="item.selected" /></td>
          <td class="border p-2">
            <template v-if="getGwans.length">
              <select v-model="item.gwan" @change="resetLower(item, 'gwan')" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="g in getGwans" :key="g">{{ g }}</option>
              </select>
            </template>
            <template v-else>
              <input v-model="item.gwan" class="w-full p-2 border rounded" />
            </template>
          </td>
          <td class="border p-2">
            <template v-if="getHangs(item).length">
              <select v-model="item.hang" @change="resetLower(item, 'hang')" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="h in getHangs(item)" :key="h">{{ h }}</option>
              </select>
            </template>
            <template v-else>
              <input v-model="item.hang" class="w-full p-2 border rounded" />
            </template>
          </td>
          <td class="border p-2">
            <template v-if="getMoks(item).length">
              <select v-model="item.mok" @change="resetLower(item, 'mok')" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
              </select>
            </template>
            <template v-else>
              <input v-model="item.mok" class="w-full p-2 border rounded" />
            </template>
          </td>
          <td class="border p-2">
            <template v-if="getSemoks(item).length">
              <select v-model="item.semok" @change="resetLower(item, 'semok')" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
              </select>
            </template>
            <template v-else>
              <input v-model="item.semok" class="w-full p-2 border rounded" />
            </template>
          </td>
          <td class="border p-2">
            <template v-if="getDetails(item).length">
              <select v-model="item.detail" class="w-full p-2 border rounded">
                <option disabled value="">선택</option>
                <option v-for="d in getDetails(item)" :key="d">{{ d }}</option>
              </select>
            </template>
            <template v-else>
              <input v-model="item.detail" class="w-full p-2 border rounded" />
            </template>
          </td>
          <td class="border p-2 text-right">
            <input type="text" :value="formatCurrency(item.amount)" @input="updateAmount($event, idx)" class="w-full p-2 text-right rounded border" />
          </td>
        </tr>
        <tr class="bg-purple-50 font-bold">
          <td class="border p-3 text-center" colspan="6">합계</td>
          <td class="border p-3 text-right">{{ totalAmount.toLocaleString() }} 원</td>
        </tr>
      </tbody>
    </table>

    <div class="flex justify-between mt-6 gap-3">
      <div>
        <button @click="addItem" class="bg-green-500 text-white px-5 py-2 rounded-lg shadow-md">＋ 행 추가</button>
        <button @click="deleteItems" class="ml-2 bg-red-500 text-white px-5 py-2 rounded-lg shadow-md">－ 행 삭제</button>
      </div>
      <div class="flex gap-3">
        <button @click="$emit('prev')" class="bg-gray-400 text-white px-6 py-2 rounded-lg shadow-md">← 이전</button>
        <button @click="$emit('next')" class="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md">다음 →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps(["items", "deptData", "selectedDept", "totalAmount"]);
const emit = defineEmits(["update", "prev", "next"]);

const localItems = ref(JSON.parse(JSON.stringify(props.items)));
watch(localItems, () => emit("update", { items: localItems.value }), { deep: true });

const getGwans = computed(() => (props.selectedDept ? Object.keys(props.deptData[props.selectedDept] || {}) : []));
const getHangs = (item) => item.gwan && props.deptData[props.selectedDept]?.[item.gwan] ? Object.keys(props.deptData[props.selectedDept][item.gwan] || {}) : [];
const getMoks = (item) => item.hang && props.deptData[props.selectedDept]?.[item.gwan]?.[item.hang] ? Object.keys(props.deptData[props.selectedDept][item.gwan][item.hang] || {}) : [];
const getSemoks = (item) => item.mok && props.deptData[props.selectedDept]?.[item.gwan]?.[item.hang]?.[item.mok] ? Object.keys(props.deptData[props.selectedDept][item.gwan][item.hang][item.mok] || {}) : [];
const getDetails = (item) => item.semok && props.deptData[props.selectedDept]?.[item.gwan]?.[item.hang]?.[item.mok]?.[item.semok] ? props.deptData[props.selectedDept][item.gwan][item.hang][item.mok][item.semok] : [];

const resetLower = (item, level) => {
  if (level === "gwan") item.hang = item.mok = item.semok = item.detail = "";
  else if (level === "hang") item.mok = item.semok = item.detail = "";
  else if (level === "mok") item.semok = item.detail = "";
  else if (level === "semok") item.detail = "";
};

const addItem = () => localItems.value.push({ selected: false, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 });
const deleteItems = () => (localItems.value = localItems.value.filter((i) => !i.selected));

const formatCurrency = (value) => (value ? Number(value).toLocaleString() : "");
const updateAmount = (event, idx) => {
  const raw = event.target.value.replace(/[^0-9]/g, "");
  localItems.value[idx].amount = raw ? parseInt(raw, 10) : 0;
  event.target.value = formatCurrency(localItems.value[idx].amount);
};
</script>
