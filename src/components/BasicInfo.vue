<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-800">📌 기본 정보 입력</h2>
    <div class="grid grid-cols-3 gap-4">
      <select v-model="localDept" class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400">
        <option disabled value="">부서명 선택</option>
        <option v-for="(data, dept) in deptData" :key="dept" :value="dept">{{ dept }}</option>
      </select>
      <input type="text" v-model="localAuthor" placeholder="작성자" class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400" />
      <input type="date" v-model="localDate" class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400" />
    </div>
    <div class="flex justify-end mt-6">
      <button @click="goNext" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition">
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps(["selectedDept", "author", "date", "deptData"]);
const emit = defineEmits(["update", "next"]);

const localDept = ref(props.selectedDept);
const localAuthor = ref(props.author);
const localDate = ref(props.date);

watch([localDept, localAuthor, localDate], () => {
  emit("update", { selectedDept: localDept.value, author: localAuthor.value, date: localDate.value });
});

const goNext = () => emit("next");
</script>
