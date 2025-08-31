<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📎 파일 첨부</h2>
    <input type="file" multiple @change="onFileChange" class="mb-4" />

    <ul v-if="modelValue.length > 0" class="space-y-2">
      <li
        v-for="(f, idx) in modelValue"
        :key="idx"
        class="flex items-center gap-4"
      >
        <!-- 파일명 -->
        <span class="text-gray-700">{{ f.name }}</span>

        <!-- 별칭 입력 -->
        <input
          type="text"
          v-model="f.aliasName"
          :placeholder="f.name"
          class="flex-1 border rounded p-2 shadow-sm focus:ring-2 focus:ring-purple-400"
        />

        <!-- 크기 표시 -->
        <span class="text-sm text-gray-500">
          ({{ (f.size / 1024).toFixed(1) }} KB)
        </span>
      </li>
    </ul>

    <p v-else class="text-gray-500">첨부된 파일이 없습니다.</p>

    <!-- 네비게이션 버튼 -->
    <div class="flex justify-between mt-6">
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
</template>

<script setup>
const props = defineProps(["modelValue"]); // 부모에서 내려받음
const emit = defineEmits(["update:modelValue", "prev", "next"]);

const onFileChange = (e) => {
  const newFiles = Array.from(e.target.files).map((f) => ({
    file: f,
    name: f.name,
    size: f.size,
    aliasName: f.aliasName || "", // 유지 가능
  }));
  emit("update:modelValue", newFiles); // 부모에 전달
};
</script>
