<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📎 파일 첨부</h2>

    <!-- 제한 안내 & 현재 총 용량 -->
    <div class="text-sm text-gray-600">
      <div>현재 총 용량: <span class="font-semibold">{{ bytesToStr(totalBytes) }}</span> <br/>
           (파일당 최대: {{ maxFileSizeMB }}MB · 총합 최대: {{ maxTotalSizeMB }}MB)
      </div>
    </div>

    <div class="flex items-center gap-3">
      <label
          class="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
        > 파일선택
        
      <input ref="fileInput" type="file" multiple @change="onFileChange" class="hidden"/>
      </label>
      <span class="text-sm text-gray-600">
        {{ modelValue.length ? `선택된 파일 ${modelValue.length}개` : "선택된 파일 없음" }}
      </span>
    </div>


    <!-- 경고/오류 메시지 -->
    <div v-if="warnMsg" class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded">
      <pre class="whitespace-pre-wrap text-sm">{{ warnMsg }}</pre>
    </div>

    <ul v-if="modelValue.length > 0" class="space-y-2">
      <li v-for="(f, idx) in modelValue" :key="idx" class="flex items-center gap-4">
        <span class="text-gray-700 truncate max-w-[16rem]" :title="f.name">{{ f.name }}</span>
          <input
            type="text"
            v-model="f.aliasName"
            placeholder="별칭입력"
            class="w-80 border rounded p-2 text-sm shadow-sm focus:ring-2 focus:ring-purple-400"
          />
        <span class="text-sm text-gray-500">({{ bytesToStr(f.size) }})</span>

        <button @click="removeFile(idx)" class="text-red-500 hover:text-red-700">✖</button>
      </li>
    </ul>

    <p v-else class="text-gray-500">첨부된 파일이 없습니다.</p>

    <div class="flex justify-between mt-6">
      <button @click="$emit('prev')" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition">
        ← 이전
      </button>
      <button
        @click="$emit('next')"
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
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
  // ✅ 필요 시 화면마다 손쉽게 조정 가능
  maxFileSizeMB: { type: Number, default: 5 },   // 파일당 최대 (MB)
  maxTotalSizeMB: { type: Number, default: 20 },  // 총합 최대 (MB)
});

const emit = defineEmits(["update:modelValue", "prev", "next", "invalid"]);

const warnMsg = ref("");
const fileInput = ref(null);

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
  // B일 땐 소수점 없이, 그 외엔 소수 1자리
  return `${i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

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
    // 상위 단계에서 별도 처리하고 싶다면 이벤트 발행
    emit("invalid", { duplicates, skipped, limit: { perFileMB: props.maxFileSizeMB, totalMB: props.maxTotalSizeMB } });
  }

  // 같은 파일 다시 선택 가능하도록 초기화
  e.target.value = "";
};

const removeFile = (index) => {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit("update:modelValue", updated);
};

// 외부에서도 쓸 수 있게 export (선택)
defineExpose({ bytesToStr, totalBytes });
</script>
