<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
      <p><strong>문서 종류:</strong> {{ documentType }}</p>
      <p><strong>부서명:</strong> {{ userDept }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>청구총액:</strong> ₩{{ totalAmount.toLocaleString() }}</p>
      <p><strong>청구요청 별칭:</strong> {{ aliasName }}</p>
    </div>

    <!-- ✅ 첨부파일 목록 표시 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
      <h3 class="text-lg font-semibold text-gray-800">📎 첨부파일</h3>
      <ul v-if="attachedFiles && attachedFiles.length > 0" class="list-disc ml-6 mt-2">
        <li v-for="(f, idx) in attachedFiles" :key="idx">
          <span class="font-semibold text-purple-700">{{ f.aliasName || f.name }}</span>
          <span class="text-gray-700 ml-2">/ {{ f.name }}</span>
          <span class="text-sm text-gray-500 ml-2">
            ({{ (f.size / 1024).toFixed(1) }} KB)
          </span>
        </li>
      </ul>
      <p v-else class="text-gray-500">첨부된 파일이 없습니다.</p>
    </div>

    <div class="flex gap-6 items-start">
      <!-- 코멘트 -->
      <div class="flex-1">
        <h2 class="text-xl font-bold text-gray-800">📌 추가 의견</h2>
        <textarea
          :value="comment"
          @input="$emit('update:comment', $event.target.value)"
          rows="6"
          maxlength="500"
          placeholder="여기에 코멘트를 입력하세요..."
          class="w-full h-60 border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-purple-400 resize-y"
        ></textarea>
        <p class="text-right text-sm text-gray-500 mt-1">
          {{ comment?.length || 0 }}/500
        </p>
      </div>

      <!-- 서명 -->
      <div class="w-[260px]">
        <h2 class="text-xl font-bold text-gray-800">✍️ 서명</h2>
        <div class="relative inline-block">
          <canvas
            ref="canvas"
            width="240"
            height="240"
            class="border rounded w-[240px] h-[240px] touch-none"
          ></canvas>
          <button
            @click="clearCanvas"
            class="absolute top-1 right-1 text-gray-500 hover:text-red-600 bg-white rounded-full px-1"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="flex justify-between">
      <button
        @click="$emit('prev')"
        class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition"
      >
        ← 이전
      </button>

      <div class="flex gap-3">
        <button
          @click="sendApprovalRequest"
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          📤 결재요청
        </button>
      </div>
    </div>

    <!-- ✅ 모달 알림 -->
    <ModalAlert
      :visible="showPopup"
      title="알림"
      message="결재요청이 완료되었습니다."
      @close="closePopup"
    />
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, onMounted, computed } from "vue";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import ModalAlert from "@/components/ModalAlert.vue";

const props = defineProps([
  "documentType",
  "author",
  "date",
  "totalAmount",
  "comment",
  "items",
  "aliasName",
  "attachedFiles",
]);

const emits = defineEmits(["update:comment", "prev", "generate"]);
const { user } = storeToRefs(useUserStore());
const userDept = computed(() => user.value?.deptName || "");
const router = useRouter();

const generatePreview = () => {
  const normalizeItems = (items) => {
    return items.map((i) => ({
      gwan: i.gwan,
      hang: i.hang,
      mok: i.mok === "__custom__" ? i.customMok : i.mok,
      semok: i.semok === "__custom__" ? i.customSemok : i.semok,
      detail: i.detail === "__custom__" ? i.customDetail : i.detail,
      amount: i.amount,
    }));
  };

  const previewData = {
    documentType: props.documentType,
    deptName: userDept.value,   // ✅ 반드시 포함
    author: props.author,
    date: props.date,
    totalAmount: props.totalAmount,
    comment: props.comment,
    aliasName: props.aliasName,
    items: normalizeItems(props.items) || [],
    attachedFiles: props.attachedFiles || [],
  };

  console.log("📤 generate previewData:", previewData); // ✅ 로깅 추가
  emits("generate", previewData);
};

// ✅ 서명 캔버스
const canvas = ref(null);
let ctx;
let drawing = false;

onMounted(() => {
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  // ✅ 마우스 이벤트
  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);
  canvas.value.addEventListener("mouseleave", stopDraw);

  // ✅ 터치 이벤트
  canvas.value.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.value.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.value.addEventListener("touchend", stopDraw);
});

// 🖱 마우스 이벤트
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

// 📱 터치 이벤트
const startDrawTouch = (e) => {
  e.preventDefault(); // 스크롤 방지
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

// ✅ 모달 상태
const showPopup = ref(false);

/* ✅ 결재요청 */
const sendApprovalRequest = async () => {
  try {
    const normalizeItems = (items) => {
      return items.map((i) => ({
          gwan: i.gwan,
          hang: i.hang,
          mok: i.mok === "__custom__" ? i.customMok : i.mok,
          semok: i.semok === "__custom__" ? i.customSemok : i.semok,
          detail: i.detail === "__custom__" ? i.customDetail : i.detail,
          amount: i.amount,
        }));
    };

    const data = {
      documentType: props.documentType,
      deptName: userDept.value,
      author: props.author,
      userId: user.value.userId,
      date: props.date,
      totalAmount: props.totalAmount,
      comment: props.comment,
      aliasName: props.aliasName,
      items: normalizeItems(props.items) || [],
    };

    const res = await axios.post("/api/approval", data, { withCredentials: true });
    if (!res.data.success) throw new Error("서버 저장 실패");
    const requestId = res.data.id;

    if (props.attachedFiles?.length > 0) {
      const formData = new FormData();
      const aliasNames = [];
      props.attachedFiles.forEach((f) => {
        formData.append("files", f.file);
        aliasNames.push(f.aliasName || f.name);
      });
      formData.append("aliasNames", JSON.stringify(aliasNames));

      await axios.post(`/api/approval/${requestId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
    }

    if (user.value) {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("approver_role", user.value.roles[0]?.role_name || "작성자");
      formData.append("approver_user_id", user.value.userId);
      formData.append("comment", props.comment || "");

      // ✅ 서명 이미지 추가
      if (canvas.value) {
        const blob = await new Promise((resolve) => canvas.value.toBlob(resolve, "image/png"));
        if (blob) formData.append("signature", blob, "signature.png");
      }

      await axios.post("/api/approval/history", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
    }

    showPopup.value = true;
  } catch (err) {
    console.error("❌ 결재요청 중 오류:", err);
    alert("❌ 결재요청 실패");
  }
};

// ✅ 팝업 닫기
const closePopup = () => {
  showPopup.value = false;
  router.push("/approvalList");
};
</script>
