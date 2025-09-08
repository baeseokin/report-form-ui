<template>
  <div class="space-y-6 font-nanum px-2">
    <h2 class="text-lg font-bold text-gray-800">📎 파일 첨부</h2>

    <!-- 파일 업로드 -->
    <input
      type="file"
      multiple
      @change="onFileChange"
      class="mb-4 w-full border p-2 rounded text-sm"
    />

    <!-- 파일 카드 리스트 -->
    <div v-if="modelValue.length > 0" class="space-y-4">
      <div
        v-for="(f, idx) in modelValue"
        :key="idx"
        class="border rounded-lg p-4 shadow-sm bg-white relative"
      >
        <!-- 파일명 -->
        <p class="text-gray-800 font-medium break-words">{{ f.name }}</p>

        <!-- 별칭 입력 -->
        <input
          type="text"
          v-model="f.aliasName"
          :placeholder="f.name"
          class="mt-2 w-full border rounded p-2 shadow-sm focus:ring-2 focus:ring-purple-400 text-sm"
        />

        <!-- 크기 + 삭제 -->
        <div class="flex justify-between items-center mt-3 text-sm text-gray-600">
          <span>{{ (f.size / 1024).toFixed(1) }} KB</span>
          <button
            @click="removeFile(idx)"
            class="text-red-500 hover:text-red-700 text-sm"
          >
            ✖ 삭제
          </button>
        </div>
      </div>
    </div>

    <!-- 파일 없을 때 -->
    <p v-else class="text-gray-500 text-sm">첨부된 파일이 없습니다.</p>

    <!-- 네비게이션 버튼 -->
    <div class="flex flex-col gap-3 mt-6">
      <button
        @click="$emit('prev')"
        class="bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg shadow-md transition text-sm"
      >
        ← 이전
      </button>
      <button
        @click="$emit('next')"
        class="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md transition text-sm"
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
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

  // 기존 파일 + 새 파일 (중복 제외)
  const updated = [...props.modelValue];
  files.forEach((f) => {
    if (!updated.some((uf) => uf.name === f.name && uf.size === f.size)) {
      updated.push(f);
    }
  });

  emit("update:modelValue", updated);

  // input 초기화 (같은 파일 다시 선택 가능하게)
  e.target.value = "";
};

const removeFile = (index) => {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit("update:modelValue", updated);
};
</script>
