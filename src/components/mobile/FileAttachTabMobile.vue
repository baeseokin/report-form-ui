<template>
  <div class="space-y-4 font-nanum">
    <h2 class="text-lg font-bold text-gray-800">📎 파일 첨부</h2>

    <!-- 제한 안내 & 현재 총 용량 -->
    <div class="text-xs text-gray-600">
      <div>파일당 최대: {{ maxFileSizeMB }}MB · 총합 최대: {{ maxTotalSizeMB }}MB</div>
      <div>현재 총 용량: <span class="font-semibold">{{ totalBytesLabel }}</span></div>
    </div>

    <input type="file" multiple @change="onFileChange" class="mb-1" />

    <!-- 경고/오류 메시지 -->
    <div v-if="warnMsg" class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-2 rounded">
      <pre class="whitespace-pre-wrap text-xs">{{ warnMsg }}</pre>
    </div>

    <!-- 파일 목록 (모바일: 줄바꿈/말줄임 최적화) -->
    <ul v-if="modelValue.length > 0" class="space-y-2">
      <li v-for="(f, idx) in modelValue" :key="idx" class="flex items-center gap-2">
        <!-- 파일명 -->
        <span class="text-gray-700 truncate max-w-[9rem]" :title="f.name">{{ f.name }}</span>

        <!-- 별칭 (모바일 폭 고려해 줄임) -->
        <input
          type="text"
          v-model="f.aliasName"
          :placeholder="f.name"
          class="flex-1 border rounded p-2 text-sm shadow-sm focus:ring-2 focus:ring-purple-400"
        />

        <!-- 크기 -->
        <span class="text-[11px] text-gray-500 shrink-0">({{ bytesToStr(f.size) }})</span>

        <!-- 삭제 -->
        <button @click="removeFile(idx)" class="text-red-500 hover:text-red-700 text-base shrink-0">✖</button>
      </li>
    </ul>

    <p v-else class="text-gray-500 text-sm">첨부된 파일이 없습니다.</p>

    <!-- 네비게이션 버튼 (모바일 간격 축소) -->
    <div class="flex justify-between mt-4">
      <button
        @click="$emit('prev')"
        class="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg shadow-md transition text-sm"
      >
        ← 이전
      </button>
      <button
        @click="$emit('next')"
        class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md transition text-sm"
        :disabled="totalBytes > maxTotalBytes"
        :class="{'opacity-60 cursor-not-allowed': totalBytes > maxTotalBytes}"
        title="총 용량이 제한을 초과하면 다음 단계로 진행할 수 없습니다."
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  // ✅ 데스크톱과 동일한 한도 props
  maxFileSizeMB: { type: Number, default: 10 },   // 파일당 최대 (MB)
  maxTotalSizeMB: { type: Number, default: 30 },  // 총합 최대 (MB)
});

const emit = defineEmits(["update:modelValue", "prev", "next", "invalid"]);

const warnMsg = ref("");

const maxFileSizeBytes = computed(() => props.maxFileSizeMB * 1024 * 1024);
const maxTotalBytes = computed(() => props.maxTotalSizeMB * 1024 * 1024);

const totalBytes = computed(() =>
  props.modelValue.reduce((sum, f) => sum + (f.size ?? f.file?.size ?? 0), 0)
);

const bytesToStr = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log(n) / Math.log(k))));
  const value = n / Math.pow(k, i);
  return `${i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

const totalBytesLabel = computed(() => bytesToStr(totalBytes.value));

const onFileChange = (e) => {
  warnMsg.value = "";
  const picked = Array.from(e.target.files).map((f) => ({
    file: f,
    name: f.name,
    size: f.size,
    aliasName: "",
  }));

  const current = [...props.modelValue];
  const skipped = [];
  const duplicates = [];

  // 중복 제외 + 파일당 용량 체크 + 총합 체크
  for (const f of picked) {
    // 중복 체크(이름/크기 기준)
    if (current.some((uf) => uf.name === f.name && uf.size === f.size)) {
      duplicates.push(`- ${f.name} (중복)`);
      continue;
    }

    // 파일당 용량 제한
    if (f.size > maxFileSizeBytes.value) {
      skipped.push(`- ${f.name} (${bytesToStr(f.size)}): 파일당 ${props.maxFileSizeMB}MB 초과`);
      continue;
    }

    // 총합 제한(미리 검증)
    const nextTotal = current.reduce((s, x) => s + x.size, 0) + f.size;
    if (nextTotal > maxTotalBytes.value) {
      skipped.push(`- ${f.name} (${bytesToStr(f.size)}): 총합 ${props.maxTotalSizeMB}MB 초과`);
      continue;
    }

    current.push(f);
  }

  // 결과 반영
  emit("update:modelValue", current);

  // 안내 메시지
  const msgs = [];
  if (duplicates.length) msgs.push(`다음 파일은 중복으로 제외되었습니다:\n${duplicates.join("\n")}`);
  if (skipped.length) msgs.push(`용량 제한으로 제외된 파일:\n${skipped.join("\n")}`);
  if (msgs.length) {
    warnMsg.value = msgs.join("\n\n");
    // 상위 컴포넌트에서 별도 UX가 필요하면 이벤트로 통지
    emit("invalid", {
      duplicates,
      skipped,
      limit: { perFileMB: props.maxFileSizeMB, totalMB: props.maxTotalSizeMB },
    });
  }

  // 같은 파일 다시 선택할 수 있도록 초기화
  e.target.value = "";
};

const removeFile = (index) => {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit("update:modelValue", updated);
};

// 외부 사용을 위해 노출(선택)
defineExpose({ bytesToStr, totalBytes, totalBytesLabel });
</script>

<style scoped>
/* 모바일 환경에서 입력/버튼 터치 영역 확보 */
input[type="text"] {
  min-height: 2.25rem;
}
button {
  min-height: 2.25rem;
}
</style>
