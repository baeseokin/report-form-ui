<template>
  <div class="space-y-6 font-nanum px-3">
    <h2 class="text-lg font-bold text-gray-800">📄 최종 확인</h2>

    <!-- 기본 정보 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow space-y-2 text-sm">
      <p><strong>문서 종류:</strong> {{ documentType }}</p>
      <p><strong>부서명:</strong> {{ userDept }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>청구총액:</strong> ₩{{ totalAmount.toLocaleString() }}</p>
      <p><strong>청구요청 별칭:</strong> {{ aliasName }}</p>
    </div>

    <!-- 첨부파일 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow">
      <h3 class="text-base font-semibold text-gray-800 mb-2">📎 첨부파일</h3>
      <div v-if="attachedFiles && attachedFiles.length > 0" class="space-y-3">
        <div
          v-for="(f, idx) in attachedFiles"
          :key="idx"
          class="p-3 border rounded-lg bg-white shadow-sm"
        >
          <p class="text-purple-700 font-medium">{{ f.aliasName || f.name }}</p>
          <p class="text-gray-600 text-xs">{{ f.name }}</p>
          <p class="text-gray-400 text-xs">{{ (f.size / 1024).toFixed(1) }} KB</p>
        </div>
      </div>
      <p v-else class="text-gray-500 text-sm">첨부된 파일이 없습니다.</p>
    </div>

    <!-- 의견 + 서명 -->
    <div class="space-y-6">
      <!-- 의견 -->
      <div>
        <h2 class="text-base font-bold text-gray-800">📌 추가 의견</h2>
        <textarea
          :value="comment"
          @input="$emit('update:comment', $event.target.value)"
          rows="5"
          maxlength="500"
          placeholder="여기에 코멘트를 입력하세요..."
          class="w-full border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-purple-400 text-sm"
        ></textarea>
        <p class="text-right text-xs text-gray-500 mt-1">
          {{ comment?.length || 0 }}/500
        </p>
      </div>

      <!-- 서명 -->
      <div>
        <h2 class="text-base font-bold text-gray-800">✍️ 서명</h2>
        <div class="relative inline-block">
          <canvas
            ref="canvas"
            width="200"
            height="200"
            class="border rounded w-[200px] h-[200px] touch-none max-[480px]:w-[180px] max-[480px]:h-[180px]"
          ></canvas>
          <button
            @click="clearCanvas"
            class="absolute top-1 right-1 text-gray-500 hover:text-red-600 bg-white rounded-full px-1 text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 버튼 -->
    <div class="space-y-3 mt-6">
      <button
        @click="$emit('prev')"
        class="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg shadow-md transition"
      >
        ← 이전
      </button>
      <button
        @click="generatePreview"
        class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-md transition"
      >
        🔍 미리보기
      </button>
      <button
        @click="sendApprovalRequest"
        class="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg shadow-md transition"
      >
        📤 결재요청
      </button>
    </div>

    <!-- 알림 모달 -->
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
import { useUserStore } from "@/store/userStore";
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

/* ✅ 미리보기 데이터 생성 */
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
    deptName: userDept.value,   // ✅ 부서명 포함
    author: props.author,
    date: props.date,
    totalAmount: props.totalAmount,
    comment: props.comment,
    aliasName: props.aliasName,
    items: normalizeItems(props.items) || [],
    attachedFiles: props.attachedFiles || [],
  };

  console.log("📄 [ConfirmTabMobile] Preview Data:", previewData);
  emits("generate", previewData);
};

// =========================
// 서명 캔버스
// =========================
const canvas = ref(null);
let ctx;
let drawing = false;

onMounted(() => {
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);
  canvas.value.addEventListener("mouseleave", stopDraw);

  canvas.value.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.value.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.value.addEventListener("touchend", stopDraw);
});

// 마우스 이벤트
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

// 터치 이벤트
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

// =========================
// 결재 요청
// =========================
const showPopup = ref(false);

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
      date: props.date,
      totalAmount: props.totalAmount,
      comment: props.comment,
      aliasName: props.aliasName,
      items: normalizeItems(props.items) || [],
    };

    const res = await axios.post("/api/approval", data, { withCredentials: true });
    if (!res.data.success) throw new Error("서버 저장 실패");
    const requestId = res.data.id;

    // 첨부파일 업로드
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

    // 결재이력 저장
    if (user.value) {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("approver_role", user.value.roles[0]?.role_name || "작성자");
      formData.append("approver_name", user.value.userName);
      formData.append("comment", props.comment || "");

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
    console.error("❌ 결재요청 오류:", err);
    alert("❌ 결재요청 실패");
  }
};

// 팝업 닫기
const closePopup = () => {
  showPopup.value = false;
  router.push("/approvalList");
};
</script>
