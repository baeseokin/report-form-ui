<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-lg w-[600px] max-w-full p-6 relative">
      <h3 class="text-lg font-bold mb-4">결재 처리</h3>

      <div class="flex flex-col md:flex-row gap-6">
        <!-- ✅ 코멘트 -->
        <div class="flex-1">
          <label class="block font-medium mb-1">코멘트</label>
          <textarea
            v-model="comment"
            class="border p-2 w-full rounded resize-none h-60"
            placeholder="코멘트를 입력하세요"
          ></textarea>
        </div>

        <!-- ✅ 서명 -->
        <div class="flex flex-col items-center relative">
          <label class="block font-medium mb-1">서명</label>
          <div class="relative">
            <canvas
              ref="canvas"
              width="240"
              height="240"
              class="border rounded shadow touch-none"
            ></canvas>
            <button
              @click="clearCanvas"
              class="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded hover:bg-red-600"
              title="지우기"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 버튼 -->
      <div class="flex justify-end space-x-2 mt-6">
        <button @click="$emit('close')" class="px-4 py-2 bg-gray-300 rounded">
          닫기
        </button>
        <button
          @click="reject"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          반려
        </button>
        <button
          @click="approve"
          class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          승인
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  report: { type: Object, required: true },
});
const emit = defineEmits(["close", "approved", "rejected"]);

const canvas = ref(null);
let ctx;
let drawing = false;
const comment = ref("");

// ✅ 캔버스 초기화 & 이벤트 등록
onMounted(() => {
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  // 마우스 이벤트
  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);
  canvas.value.addEventListener("mouseleave", stopDraw);

  // 터치 이벤트 (모바일/태블릿)
  canvas.value.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.value.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.value.addEventListener("touchend", stopDraw);
});

// 🖱 마우스
const startDraw = (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
};
const draw = (e) => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
};
const stopDraw = () => { drawing = false; };

// 📱 터치
const startDrawTouch = (e) => {
  e.preventDefault();
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
};
const drawTouch = (e) => {
  e.preventDefault();
  if (!drawing) return;
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
};

// ✅ 승인 처리
const approve = async () => {
  canvas.value.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("requestId", props.report.id);
    formData.append("comment", comment.value);
    formData.append("signature", blob, "signature.png");

    try {
      const res = await fetch("/api/approval/approve", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        emit("approved"); // ✅ 팝업 대신 이벤트
        emit("close");
      } else {
        alert("승인 실패: " + data.message);
      }
    } catch (err) {
      console.error("승인 오류:", err);
      alert("승인 오류 발생");
    }
  });
};

// ✅ 반려 처리
const reject = async () => {
  canvas.value.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("requestId", props.report.id);
    formData.append("comment", comment.value);
    formData.append("signature", blob, "signature.png");

    try {
      const res = await fetch("/api/approval/reject", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        emit("rejected"); // ✅ 팝업 대신 이벤트
        emit("close");
      } else {
        alert("반려 실패: " + data.message);
      }
    } catch (err) {
      console.error("반려 오류:", err);
      alert("반려 오류 발생");
    }
  });
};
</script>
