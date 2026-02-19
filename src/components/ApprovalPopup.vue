<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/40 z-50 font-nanum">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fadeIn">
      <!-- 제목 -->
      <h2 class="text-xl font-bold mb-4 flex items-center justify-between">
        <span>결재 처리 ({{ modeLabel }})</span>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-black text-2xl leading-none"
        >
          ✕
        </button>
      </h2>

      <!-- 서명란 -->
      <div class="mb-4">
        <span class="text-gray-700 font-medium block mb-2">서명</span>
        <canvas
          ref="signaturePad"
          data-testid="signature-canvas-popup"
          class="border rounded-lg w-full h-40 bg-gray-50"
        ></canvas>
        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
          <p class="pr-4">
            <span class="px-1">지우기</span>버튼을 눌러 서명을 다시 할 수 있습니다.  
          </p>
          <button
            @click="clearSignature(false)"
            class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            지우기
          </button>
        </div>
      </div>

      <!-- 결재 의견 -->
      <div class="mb-4">
        <label class="block">
          <span class="text-gray-700 font-medium">결재 의견</span>
          <textarea
            v-model="comment"
            class="w-full mt-2 border rounded-lg p-2 focus:ring-2 focus:ring-purple-400 focus:outline-none"
            rows="3"
            placeholder="의견을 입력하세요..."
          ></textarea>
        </label>
      </div>

      <!-- 버튼 영역 -->
      <div class="flex justify-end gap-3 mt-6">
        <button
          @click="$emit('close')"
          class="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
        >
          취소
        </button>
        <button
          @click="submitApproval"
          data-testid="btn-submit-approval"
          class="px-5 py-2 rounded-lg text-white font-semibold shadow-md transition"
          :class="mode === 'approve'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'"
        >
          처리
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const props = defineProps({
  report: Object,
  mode: { type: String, required: true } // 'approve' | 'reject'
});
const emit = defineEmits(["close", "approved"]);

const comment = ref("");
const signaturePad = ref(null);
let ctx = null;
let drawing = false;

// ✍️ ConfirmTab와 동일한 플래그 로직
const wasCleared = ref(false);          // '지우기' 버튼을 눌렀는지
const hasNotified = ref(false);         // 재서명 시작 안내 1회만
const didRedrawAfterClear = ref(false); // 지운 후 실제로 다시 그렸는지(저장 조건)


/** 기본서명 로드 (서버 URL → 캔버스에 드로우) */
async function loadDefaultSignature() {
  try {
    const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
    const url = data?.signature;
    if (url) {
      await drawImageToCanvas(url);
      return;
    }
  } catch (_) {
    // 미구현/에러 시 무시
  }
  // 없으면 클리어 (플래그는 건드리지 않음)
  clearSignature(true);
}

/** 이미지 URL을 캔버스에 맞춰 그리기 (고해상도 스케일 고려) */
function drawImageToCanvas(src) {
  return new Promise((resolve, reject) => {
    const canvasEl = signaturePad.value;
    if (!canvasEl || !ctx) return resolve();
    const cssW = canvasEl.getBoundingClientRect().width;
    const cssH = canvasEl.getBoundingClientRect().height;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // ctx는 ratio로 scale되어 있으므로 CSS 크기로 그리면 맞음
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(img, 0, 0, cssW, cssH);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** 현재 서명을 dataURL로 얻기 */
function getSignatureDataURL() {
  const canvasEl = signaturePad.value;
  if (!canvasEl) return null;
  // 고해상도라도 toDataURL은 내부 버퍼를 기준으로 추출 → 그대로 사용
  return canvasEl.toDataURL("image/png");
}

/** 기본서명 저장 (지운 후 다시 그렸을 때만 호출) */
async function saveDefaultSignature() {
  const dataURL = getSignatureDataURL();
  if (!dataURL) return;
  try {
    await axios.put(
      "/api/users/me/signature",
      { signature: dataURL },
      { withCredentials: true }
    );
  } catch (e) {
    console.warn("기본서명 저장 실패:", e?.message || e);
  }
}

/** 좌표 계산 (마우스/터치 공용) */
function getPos(e) {
  const canvasEl = signaturePad.value;
  const rect = canvasEl.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** 드로잉 핸들러 */
const startDraw = (e) => {
  e.preventDefault?.();
  // 재서명 안내: 지운 뒤 처음 그릴 때 1회
  if (wasCleared.value && !hasNotified.value) {
    //alert("변경된 서명이 기본서명에 저장됩니다.");
    hasNotified.value = true;
  }
  if (wasCleared.value) {
    didRedrawAfterClear.value = true;
  }
  drawing = true;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
};
const draw = (e) => {
  if (!drawing) return;
  e.preventDefault?.();
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};
const endDraw = () => { drawing = false; };

/** 서명 지우기 */
const clearSignature = (skipMark = false) => {
  const canvasEl = signaturePad.value;
  if (!canvasEl || !ctx) return;
  // ctx가 ratio로 scale되어 있으므로 CSS 크기로 clearRect
  const rect = canvasEl.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (!skipMark) {
    wasCleared.value = true;
    hasNotified.value = false;
    didRedrawAfterClear.value = false;
  }
};

onMounted(async () => {
  const canvasEl = signaturePad.value;
  if (!canvasEl) return;

  // 고해상도 캔버스 세팅
  const rect = canvasEl.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvasEl.width = Math.round(rect.width * ratio);
  canvasEl.height = Math.round(rect.height * ratio);
  ctx = canvasEl.getContext("2d");
  ctx.scale(ratio, ratio);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // 기본서명 자동 로드
  await loadDefaultSignature();

  // 이벤트 바인딩
  canvasEl.addEventListener("mousedown", startDraw);
  canvasEl.addEventListener("mousemove", draw);
  canvasEl.addEventListener("mouseup", endDraw);
  canvasEl.addEventListener("mouseleave", endDraw);

  canvasEl.addEventListener("touchstart", startDraw, { passive: false });
  canvasEl.addEventListener("touchmove", draw, { passive: false });
  canvasEl.addEventListener("touchend", endDraw);
  canvasEl.addEventListener("touchcancel", endDraw);
});

const modeLabel = computed(() =>
  props.mode === "approve" ? "결재승인" : "결재반려"
);

const submitApproval = async () => {
  const canvasEl = signaturePad.value;
  if (!canvasEl || !ctx) {
    alert("서명 캔버스가 초기화되지 않았습니다.");
    return;
  }

  // 비어있는 서명 방지 (CSS 크기 기준으로 검사)
  const rect = canvasEl.getBoundingClientRect();
  const imgData = ctx.getImageData(0, 0, rect.width, rect.height).data;
  const isEmpty = !imgData.some((v) => v !== 0);
  if (isEmpty) {
    alert("서명을 입력해주세요.");
    return;
  }

  canvasEl.toBlob(async (blob) => {
    if (!blob) {
      alert("서명 데이터가 비어 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("requestId", props.report.id);
    formData.append("comment", comment.value);
    formData.append("signature", blob, "signature.png");

    const url = props.mode === "approve" ? "/api/approval/approve" : "/api/approval/reject";

    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        // 기본서명 저장: 조회한 기본서명을 그대로 쓴 경우는 저장하지 않음
        // ✕로 지운 뒤 실제로 다시 그린 경우에만 저장
        if (wasCleared.value && didRedrawAfterClear.value) {
          await saveDefaultSignature();
        }

        emit("approved");  // 승인/반려 공통
        emit("close");
      } else {
        alert(`${modeLabel.value} 실패: ${data.message || ""}`);
      }
    } catch (err) {
      console.error(`${modeLabel.value} 오류:`, err);
      alert(`${modeLabel.value} 오류 발생`);
    }
  }, "image/png");
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out;
}
</style>
