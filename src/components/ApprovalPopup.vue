<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-lg w-[600px] max-w-full p-6 relative">
      <h3 class="text-lg font-bold mb-4">결재 승인</h3>

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
              class="border rounded shadow"
            ></canvas>
            <!-- ❌ 지우기 버튼 (우측 상단 X) -->
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

const emit = defineEmits(["close"]);
const canvas = ref(null);
let ctx;
let drawing = false;
const comment = ref("");

onMounted(() => {
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);
  canvas.value.addEventListener("mouseleave", stopDraw);
});

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
const stopDraw = () => {
  drawing = false;
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
};

const approve = async () => {
  canvas.value.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("requestId", props.report.id);
    formData.append("comment", comment.value);
    formData.append("signature", blob, "signature.png");

    const res = await fetch("/api/approval/approve", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      alert("결재 완료!");
      emit("close");
    } else {
      alert("결재 실패: " + data.message);
    }
  });
};
</script>
