<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📌 기본 정보 입력</h2>
    <div class="grid grid-cols-3 gap-4">
      <!-- 부서명 선택 (JSON 기반) -->
      <select
        :value="selectedDept"
        @change="$emit('update:selectedDept', $event.target.value)"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      >
        <option disabled value="">부서명 선택</option>
        <option v-for="(data, dept) in deptData" :key="dept" :value="dept">{{ dept }}</option>
      </select>

      <!-- 작성자 -->
      <input
        type="text"
        :value="author"
        @input="$emit('update:author', $event.target.value)"
        placeholder="작성자"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      />

      <!-- 제출일자 -->
      <input
        type="date"
        :value="date"
        @input="$emit('update:date', $event.target.value)"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      />
    </div>

    <div class="flex justify-end mt-6">
      <button
        @click="$emit('next')"
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["selectedDept", "author", "date", "deptData"]);
const emits = defineEmits(["update:selectedDept", "update:author", "update:date", "next"]);
</script>
