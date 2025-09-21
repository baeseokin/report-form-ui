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
        :key="f.name + '-' + f.size"
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

/* ✅ 파일 첨부 */
const onFileChange = (e) => {
  console.log("📂 [onFileChange] 파일 선택 이벤트 발생", e);

  const files = Array.from(e.target.files).map((f) => ({
    file: f,
    name: f.name,
    size: f.size,
    aliasName: "",
  }));

  console.log("📂 선택된 파일 목록:", files);

  const updated = [...props.modelValue];
  files.forEach((f) => {
    if (!updated.some((uf) => uf.name === f.name && uf.size === f.size)) {
      updated.push(f);
      console.log("➕ 파일 추가됨:", f.name, f.size);
    } else {
      console.log("⚠️ 중복 파일 무시:", f.name, f.size);
    }
  });

  emit("update:modelValue", updated);
  console.log("📤 emit 완료 → modelValue:", updated);

  // input 초기화 (같은 파일 다시 선택 가능하게)
  console.log("🧹 input 초기화 실행 전 value:", e.target.value);
  e.target.value = "";
  console.log("🧹 input 초기화 실행 후 value:", e.target.value);
};

/* ✅ 파일 삭제 */
const removeFile = (index) => {
  console.log("🗑 [removeFile] 파일 삭제 요청, index:", index);

  const updated = [...props.modelValue];
  const removed = updated.splice(index, 1);

  console.log("🗑 삭제된 파일:", removed);
  emit("update:modelValue", updated);
  console.log("📤 emit 완료 → modelValue:", updated);
};
</script>
