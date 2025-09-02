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

        <!-- 삭제 버튼 -->
        <button
          @click="removeFile(idx)"
          class="text-red-500 hover:text-red-700"
        >
          ✖
        </button>
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
import { ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "prev", "next"]);

const onFileChange = (e) => {
  const files = Array.from(e.target.files).map((f) => ({
    file: f,
    name: f.name,
    size: f.size,
    aliasName: "",
  }));

  // 기존 파일에 새 파일 추가 (중복 제외)
  const updated = [...props.modelValue];
  files.forEach((f) => {
    if (!updated.some((uf) => uf.name === f.name && uf.size === f.size)) {
      updated.push(f);
    }
  });

  emit("update:modelValue", updated);

  // input 초기화 (같은 파일 다시 선택할 수 있도록)
  e.target.value = "";
};

const removeFile = (index) => {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit("update:modelValue", updated);
};
</script>
