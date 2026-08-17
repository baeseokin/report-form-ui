<template>
  <div class="space-y-4 font-nanum" data-testid="tab-file">
    <h2 class="text-lg font-bold text-gray-800">📎 파일 첨부</h2>

    <!-- ✅ 안내 문구 -->
    <div class="text-xs text-gray-600">
      <div>
        현재 총 용량: <span class="font-semibold">{{ totalBytesLabel }}</span><br/>
        (파일당 최대: {{ maxFileSizeMB }}MB · 총합 최대: {{ maxTotalSizeMB }}MB)
      </div>
      <div class="text-[11px] text-blue-600 mt-1">
        💡 사진/이미지 파일은 업로드 속도 향상을 위해 자동으로 최적화(압축)됩니다.
      </div>
    </div>

    <!-- ✅ 파일 선택 UI (모바일 호환: input 숨김 + label 버튼 + 선택상태 표시) -->
    <div class="bg-white border rounded-xl shadow-sm p-3 space-y-2">
      <div class="flex items-center justify-between gap-3">
        <label
          class="inline-flex items-center justify-center px-3 py-2 border rounded-lg text-sm bg-white active:scale-[0.99] cursor-pointer"
          :class="{ 'opacity-50 pointer-events-none': isCompressing }"
        >
          {{ isCompressing ? "최적화 중..." : "파일 선택" }}
          <input
            ref="fileInput"
            type="file"
            data-testid="file-upload-input"
            class="hidden"
            multiple
            :disabled="isCompressing"
            @change="onFileChange"
          />
        </label>

        <div class="text-xs text-gray-600 text-right">
          <div v-if="modelValue.length === 0">선택된 파일 없음</div>
          <div v-else>선택된 파일 {{ modelValue.length }}개</div>
        </div>
      </div>

      <!-- 이미지 압축 진행 상태 알림 -->
      <div v-if="isCompressing" class="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
        <svg class="animate-spin h-4 w-4 text-blue-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span class="truncate">{{ compressStatusText }}</span>
      </div>

      <!-- (선택) 최근 선택 파일명 미리보기: UX 용 -->
      <div v-if="lastPickedNames.length && !isCompressing" class="text-[11px] text-gray-500">
        방금 추가: <span class="font-medium">{{ lastPickedNames.join(", ") }}</span>
      </div>
    </div>

    <!-- 경고/오류 메시지 -->
    <div v-if="warnMsg" class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-2 rounded">
      <pre class="whitespace-pre-wrap text-xs">{{ warnMsg }}</pre>
    </div>

    <!-- 파일 목록 (모바일: 줄바꿈/말줄임 최적화) -->
    <ul v-if="modelValue.length > 0" class="space-y-2">
      <li v-for="(f, idx) in modelValue" :key="fileKey(f, idx)" class="flex items-center gap-2">
        <!-- 파일명 -->
        <span class="text-gray-700 truncate max-w-[9rem]" :title="f.name">{{ f.name }}</span>

        <!-- 별칭 -->
        <input
          type="text"
          v-model="f.aliasName" 
          :placeholder="'별칭입력'"
          class="mobile-form-control max-w-[7rem] w-full"
        />


        <!-- 크기 -->
        <span class="text-[11px] text-gray-500 shrink-0">({{ bytesToStr(f.size) }})</span>

        <!-- 삭제 -->
        <button @click="removeFile(idx)" class="text-red-500 hover:text-red-700 text-base shrink-0">✖</button>
      </li>
    </ul>

    <p v-else class="text-gray-500 text-sm">첨부된 파일이 없습니다.</p>

    <!-- 네비게이션 버튼 -->
    <div class="flex justify-between gap-2 pt-2">
      <button
        @click="$emit('prev')"
        class="w-full py-3 rounded bg-gray-100 hover:bg-gray-200"
      >
        이전
      </button>
      <button
        @click="$emit('next')"
        data-testid="btn-next"
        class="w-full py-3 rounded bg-blue-600 text-white hover:bg-blue-700"
        :disabled="totalBytes > maxTotalBytes || isCompressing"
        :class="{ 'opacity-60 cursor-not-allowed': totalBytes > maxTotalBytes || isCompressing }"
        title="총 용량이 제한을 초과하면 다음 단계로 진행할 수 없습니다."
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { compressFilesSequentially } from "@/utils/imageCompressor";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  // ✅ 데스크톱과 동일한 한도 props
  maxFileSizeMB: { type: Number, default: 10 }, // 파일당 최대 (MB)
  maxTotalSizeMB: { type: Number, default: 50 }, // 총합 최대 (MB)
});

const emit = defineEmits(["update:modelValue", "prev", "next", "invalid"]);

const warnMsg = ref("");
const fileInput = ref(null);
const isCompressing = ref(false);
const compressStatusText = ref("");

// ✅ 최근 선택 파일명 표시용(브라우저 기본 UI 대신 우리 UI로 보여줌)
const lastPickedNames = ref([]);

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

/**
 * ✅ key 안정화
 * idx를 그대로 써도 되지만, 모바일 리렌더/정렬/삭제시 UX를 위해 가능한 안정적인 키를 제공합니다.
 * (uuid가 있다면 uuid 사용, 없으면 name+size 기반)
 */
const fileKey = (f, idx) => f.uuid || `${f.name || "file"}::${f.size || 0}::${idx}`;

const onFileChange = async (e) => {
  warnMsg.value = "";

  const input = e.target;
  const rawFiles = input.files ? Array.from(input.files) : [];
  if (rawFiles.length === 0) return;

  isCompressing.value = true;
  compressStatusText.value = `이미지 최적화 준비 중...`;

  try {
    // 저사양 폰 안전 순차 압축 (1장씩 압축)
    const optimizedFiles = await compressFilesSequentially(
      rawFiles,
      { maxWidth: 1600, maxHeight: 1600, quality: 0.8 },
      (current, total, currentName) => {
        compressStatusText.value = `이미지 최적화 중... (${current}/${total}) ${currentName}`;
      }
    );

    // ✅ 선택 파일명 미리보기
    lastPickedNames.value = optimizedFiles.map((x) => x.name).slice(0, 5);

    const picked = optimizedFiles.map((f) => ({
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
      const nextTotal = current.reduce((s, x) => s + (x.size ?? 0), 0) + f.size;
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
      emit("invalid", {
        duplicates,
        skipped,
        limit: { perFileMB: props.maxFileSizeMB, totalMB: props.maxTotalSizeMB },
      });
    }
  } catch (err) {
    console.error("파일 처리 중 오류:", err);
    warnMsg.value = "파일을 처리하는 도중 문제가 발생했습니다.";
  } finally {
    isCompressing.value = false;
    compressStatusText.value = "";
    // ✅ iOS 포함: 같은 파일 다시 선택해도 change가 발생하도록 초기화
    input.value = "";
  }
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

