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
          class="border rounded-lg w-full h-40 bg-gray-50"
        ></canvas>
        <div class="flex justify-end mt-2">
          <button
            @click="clearSignature"
            class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            서명 지우기
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";

const props = defineProps({
  report: Object,
  mode: { type: String, required: true } // 'approve' | 'reject'
});
const emit = defineEmits(["close", "approved"]);

const comment = ref("");
const signaturePad = ref(null);
let canvas = null;  // ✅ 전역 변수 추가
let ctx = null;
let drawing = false;

onMounted(() => {
  const canvas = signaturePad.value;
  const rect = canvas.getBoundingClientRect();

  // ✅ 고해상도 캔버스 세팅
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left),
        y: (e.touches[0].clientY - rect.top),
      };
    } else {
      return {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top),
      };
    }
  };

  // 이벤트 바인딩 (PC + Mobile)
  const startDraw = (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };
  const endDraw = () => { drawing = false; };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
  canvas.addEventListener("touchcancel", endDraw);
});


const clearSignature = () => {
  ctx.clearRect(0, 0, signaturePad.value.width, signaturePad.value.height);
};

const modeLabel = computed(() =>
  props.mode === "approve" ? "승인" : "반려"
);

const submitApproval = async () => {
  // ✅ 안전하게 참조
  const canvasEl = signaturePad.value;
  if (!canvasEl) {
    alert("서명 캔버스가 초기화되지 않았습니다.");
    return;
  }

  // ✅ 비어 있는 서명 방지
  if (ctx) {
    const empty = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height).data
      .every((v) => v === 0);
    if (empty) {
      alert("서명을 입력해주세요.");
      return;
    }
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
        emit("approved");  // ✅ 승인/반려 모두 동일 이벤트
        emit("close");
      } else {
        alert(`${modeLabel.value} 실패: ${data.message || ""}`);
      }
    } catch (err) {
      console.error(`${modeLabel.value} 오류:`, err);
      alert(`${modeLabel.value} 오류 발생`);
    }
  });
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
