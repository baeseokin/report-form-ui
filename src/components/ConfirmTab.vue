<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner grid grid-cols-4 gap-y-2 text-gm">
      <p><strong>청구 유형:</strong> {{ documentType }}</p>
      <p><strong>부서명:</strong> {{ props.selectedDept?.trim() || user?.deptName || '—' }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>영수인:</strong> {{ payee }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>계정명:</strong> {{ gwanName }} / {{ hangName }}</p>
      <p><strong>청구총액:</strong> ₩{{ Number(totalAmount || 0).toLocaleString() }}</p>
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
          data-testid="comment-textarea"
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
            data-testid="signature-canvas"
            :class="['border rounded w-[240px] h-[240px] touch-none bg-white', { 'cursor-not-allowed': isImageLoaded }]"
          ></canvas>
          <button
            @click="clearCanvas(false)"
            class="absolute top-1 right-1 text-gray-500 hover:text-red-600 bg-white rounded-full px-1"
            aria-label="서명 지우기"
            title="서명 지우기"
          >
            ✕
          </button>
        </div>
        <!-- ✅ 안내 메시지 -->
        <p class="text-xs text-gray-500 mt-2">
          <span class="px-1">✕</span>를 눌러 지우고 다시 서명할 수 있으며, <strong>기본서명</strong>으로 저장됩니다. 
        </p>
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
          type="button"
          :disabled="isSubmitting"
          @click="sendApprovalRequest"
          data-testid="btn-submit"
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          {{ isSubmitting ? "처리 중..." : "📤 결재요청" }}
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
import { useRoute, useRouter } from "vue-router";
import ModalAlert from "@/components/ModalAlert.vue";

const route = useRoute();

const props = defineProps([
  "documentType",
  "author",
  "payee",
  "date",
  "totalAmount",
  "comment",
  "items",
  "aliasName",
  "attachedFiles",
  "selectedDept",
  "selectedGwan",
  "selectedHang"
]);

const emits = defineEmits(["update:comment", "prev", "generate"]);
const { user } = storeToRefs(useUserStore());
// 재정부 등이 다른 부서를 선택한 경우 선택한 부서 사용, 아니면 로그인 사용자 부서
const userDept = computed(() => props.selectedDept || user.value?.deptName || "");
const router = useRouter();

// ✅ 계정명 표시를 위한 데이터 조회
const categories = ref([]);
const gwanName = computed(() => {
  const c = categories.value.find(cat => cat.category_id === props.selectedGwan);
  return c ? c.category_name : props.selectedGwan;
});
const hangName = computed(() => {
  const c = categories.value.find(cat => cat.category_id === props.selectedHang);
  return c ? c.category_name : props.selectedHang;
});

onMounted(async () => {
  const res = await axios.get("/api/accountCategories");
  categories.value = res.data.categories || [];
});

const generatePreview = () => {
  const normalizeItems = (items) => {
    return (items || []).map((i) => ({
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
    deptName: userDept.value,
    author: props.author,
    payee: props.payee,
    date: props.date,
    totalAmount: props.totalAmount,
    comment: props.comment,
    aliasName: props.aliasName,
    items: normalizeItems(props.items),
    attachedFiles: props.attachedFiles || [],
  };

  emits("generate", previewData);
};

/* =========================
   ✍️ 서명 캔버스 & 기본서명
   ========================= */
const canvas = ref(null);
let ctx;
let drawing = false;
const wasCleared = ref(false);   // ✕ 눌러 지웠는지
const hasNotified = ref(false);  // 재서명 안내 1회만 표시
const didRedrawAfterClear = ref(false); // ✕ 이후 실제로 다시 그렸는지 (저장 트리거)
const isImageLoaded = ref(false); // 이미지가 로드된 상태인지 (기본 서명 로드 시 true)

// 기본서명 불러오기 (서버 → 없으면 패스)
async function loadDefaultSignature() {
  try {
    const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
    const url = data?.signature; // 서버는 URL을 반환 (없으면 null)
    if (url) {
      await drawImageToCanvas(url);
      return;
    }
  } catch (e) {
    // 서버 미구현/오류는 무시
  }
  // 기본서명 없으면 캔버스 클리어
  clearCanvas(true);
}

// 캔버스에 이미지 로드
function drawImageToCanvas(src) {
  return new Promise((resolve, reject) => {
    if (!canvas.value) return resolve();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height);
      isImageLoaded.value = true;
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

// dataURL 추출
function getSignatureDataURL() {
  if (!canvas.value) return null;
  return canvas.value.toDataURL("image/png");
}

// 기본서명 저장 (PUT dataURL)
async function saveDefaultSignature() {
  const dataURL = getSignatureDataURL();
  console.log("dataURL :", dataURL);
  if (!dataURL) return;
  try {
    await axios.put(
      "/api/users/me/signature",
      { signature: dataURL },
      { withCredentials: true }
    );
  } catch (e) {
    // 저장 실패 시에도 본 제출 흐름은 막지 않음
    console.warn("기본서명 저장 실패:", e?.message || e);
  }
}

/* ===== 드로잉 이벤트 바인딩 ===== */
onMounted(async () => {
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // 기본서명 자동 로드
  await loadDefaultSignature();

  // 마우스 이벤트
  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);
  canvas.value.addEventListener("mouseleave", stopDraw);

  // 터치 이벤트
  canvas.value.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.value.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.value.addEventListener("touchend", stopDraw);
});

// 🖱 마우스 이벤트
const startDraw = (e) => {
  if (isImageLoaded.value) return; // 이미지가 로드된 경우 드로잉 방지

  // 재서명 안내 (✕ 후 첫 드로잉 시작 시 1회)
  if (wasCleared.value && !hasNotified.value) {
    //alert("변경된 서명이 기본서명에 저장됩니다.");
    hasNotified.value = true;
  }
  // ✕ 후에 다시 그리기 시작한 경우에만 저장 대상으로 표시
  if (wasCleared.value) {
    didRedrawAfterClear.value = true;
  }
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
  if (isImageLoaded.value) return; // 이미지가 로드된 경우 드로잉 방지

  e.preventDefault(); // 스크롤 방지
  if (wasCleared.value && !hasNotified.value) {
    //alert("변경된 서명이 기본서명에 저장됩니다.");
    hasNotified.value = true;
  }
  if (wasCleared.value) {
    didRedrawAfterClear.value = true;
  }  
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

const clearCanvas = (skipMark = false) => {
  if (canvas.value && ctx) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
  isImageLoaded.value = false;
  
  if (!skipMark) {
    wasCleared.value = true;
    hasNotified.value = false;
    // 지운 직후에는 아직 다시 그리지 않았으므로 false로 초기화
    didRedrawAfterClear.value = false;
  }
  console.log("clearCanvas-!skipMark :", !skipMark);
  console.log("clearCanvas-wasCleared.value :", wasCleared.value);
  console.log("clearCanvas-didRedrawAfterClear.value :", didRedrawAfterClear.value);
    

};

/* ✅ 모달 상태 */
const showPopup = ref(false);
/* ✅ 결재요청 중복 방지 */
const isSubmitting = ref(false);

/* ✅ 결재요청 */
const sendApprovalRequest = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    // 선택한 부서 기준으로 결재선 존재 여부 확인 (재정부 등이 다른 부서 선택 시 해당 부서 결재선 사용)
    const deptNameForLines = (props.selectedDept && props.selectedDept.trim()) ? props.selectedDept.trim() : userDept.value;
    if (deptNameForLines) {
      const lineRes = await axios.get("/api/approval-lines", {
        params: { deptName: deptNameForLines },
        withCredentials: true,
      });
      const lines = Array.isArray(lineRes.data) ? lineRes.data : [];
      if (lines.length === 0) {
        alert("해당 부서의 결재선 정보가 없습니다. 등록 후 진행하세요.");
        isSubmitting.value = false;
        return;
      }
    }

    const normalizeItems = (items) => {
      return (items || []).map((i) => ({
        gwan: i.gwan,
        hang: i.hang,
        mok: i.mok === "__custom__" ? i.customMok : i.mok,
        semok: i.semok === "__custom__" ? i.customSemok : i.semok,
        detail: i.detail === "__custom__" ? i.customDetail : i.detail,
        amount: i.amount,
      }));
    };

    // API에는 반드시 선택한 부서명 사용 (재정부 등이 다른 부서 선택 시)
    const payloadDeptName = (props.selectedDept && props.selectedDept.trim()) ? props.selectedDept.trim() : userDept.value;
    const isEdit = route.query.mode === 'edit';
    const data = {
      id: isEdit ? route.params.id : null,
      documentType: props.documentType,
      deptName: payloadDeptName,
      dept_name: payloadDeptName,
      author: props.author,
      payee: props.payee,
      userId: user.value.userId,
      date: props.date,
      totalAmount: props.totalAmount,
      comment: props.comment,
      aliasName: props.aliasName,
      items: normalizeItems(props.items),
      selectedGwan : props.selectedGwan,
      selectedHang : props.selectedHang,
    };

    // 1) 결재요청 저장 (선택 부서명을 명시적으로 JSON으로 전달)
    const res = await axios.post("/api/approval", data, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    if (!res.data.success) throw new Error("서버 저장 실패");
    const requestId = res.data.id;

    // 2) 첨부파일 업로드 및 관리
    const newFiles = (props.attachedFiles || []).filter(f => !f.isExisting);
    const existingFileIds = (props.attachedFiles || []).filter(f => f.isExisting).map(f => f.id);

    if (newFiles.length > 0 || isEdit) {
      const formData = new FormData();
      const aliasNames = [];
      newFiles.forEach((f) => {
        formData.append("files", f.file);
        aliasNames.push(f.aliasName || f.name);
      });
      formData.append("aliasNames", JSON.stringify(aliasNames));
      formData.append("existingFileIds", JSON.stringify(existingFileIds));
      formData.append("isEdit", isEdit ? "true" : "false");

      await axios.post(`/api/approval/${requestId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
    }

    // 3) 결재 이력 + 서명 이미지 업로드 (신규일 때만 또는 이력이 없을 때?)
    // 수정 시에는 기존 이력을 그대로 두거나 업데이트할 수 있는데, 여기서는 신규로 작성자 이력을 남기지 않음 (이미 있으므로)
    if (user.value && !isEdit) {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("approver_role", user.value.roles?.[0]?.role_name || "작성자");
      formData.append("approver_user_id", user.value.userId);
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

    // 4) 현재 서명을 기본서명으로 저장 (서버 PUT)
    //    ▶ 조회한 기본서명을 수정 없이 그대로 사용하는 경우에는 저장(신규 입력)하지 않음
    //    ▶ 반드시 X로 지운 뒤 다시 그린 경우에만 저장
    console.log("wasCleared.value :", wasCleared.value);
    console.log("didRedrawAfterClear.value :", didRedrawAfterClear.value);
    if (wasCleared.value && didRedrawAfterClear.value) {
      await saveDefaultSignature();
    }

    showPopup.value = true;
  } catch (err) {
    console.error("❌ 결재요청 중 오류:", err);
    alert("❌ 결재요청 실패");
  } finally {
    isSubmitting.value = false;
  }
};

// ✅ 팝업 닫기
const closePopup = () => {
  showPopup.value = false;
  router.push("/approvalList");
};
</script>
