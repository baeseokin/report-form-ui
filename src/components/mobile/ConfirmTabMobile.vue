<template>
  <div class="space-y-6 font-nanum px-3" data-testid="tab-confirm">
    <h2 class="text-lg font-bold text-gray-800">📄 최종 확인</h2>

    <!-- 기본 정보 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow space-y-2 text-sm">
      <p><strong>청구 유형:</strong> {{ documentType }}</p>
      <p><strong>부서명:</strong> {{ userDept }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>영수인:</strong> {{ payee }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>계정명:</strong> {{ gwanName }} / {{ hangName }}</p>
      <p><strong>청구총액:</strong> ₩{{ Number(totalAmount || 0).toLocaleString() }}</p>
      <p><strong>청구요청 별칭:</strong> {{ aliasName }}</p>
    </div>

    <!-- 결재선 선택 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow space-y-3">
      <h3 class="text-base font-bold text-gray-800 flex items-center gap-2">
        <span class="text-lg">🛤️</span> 결재선
      </h3>
      
      <div class="space-y-3">
        <!-- 1안: 기안자 부서 -->
        <div 
          @click="selectedOption = 'dept'"
          :class="[
            'cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden',
            selectedOption === 'dept' 
              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-sm' 
              : 'border-gray-200 bg-white hover:border-indigo-200'
          ]"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-bold" :class="selectedOption === 'dept' ? 'text-indigo-700' : 'text-gray-600'">
              1안: {{ userDept }}
            </span>
            <div v-if="selectedOption === 'dept'" class="bg-indigo-500 text-white rounded-full p-0.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div class="flex flex-col gap-1">
            <template v-if="displayLines1.length > 0">
              <div v-for="(line, idx) in displayLines1" :key="idx" class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span class="text-xs text-gray-700">
                    <span class="font-bold">{{ line.approver_role }}:</span> {{ line.approver_user_name }}
                  </span>
                </div>
                <div v-if="idx < displayLines1.length - 1" class="ml-[3px] my-0.5 border-l border-dashed border-indigo-200 h-2"></div>
              </div>
            </template>
            <p v-else class="text-xs text-gray-400 italic">결재선 정보가 없습니다.</p>
          </div>
        </div>

        <!-- 2안: Owner 부서 (존재할 때만 표시) -->
        <div 
          v-if="ownerDeptName && ownerDeptName !== userDept"
          @click="selectedOption = 'owner'"
          :class="[
            'cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden',
            selectedOption === 'owner' 
              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-md' 
              : 'border-gray-200 bg-white hover:border-purple-200'
          ]"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-bold" :class="selectedOption === 'owner' ? 'text-purple-700' : 'text-gray-600'">
              2안: {{ ownerDeptName }}
            </span>
            <div v-if="selectedOption === 'owner'" class="bg-purple-500 text-white rounded-full p-0.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div class="flex flex-col gap-1">
            <template v-if="displayLines2.length > 0">
              <div v-for="(line, idx) in displayLines2" :key="idx" class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span class="text-xs text-gray-700">
                    <span class="font-bold">{{ line.approver_role }}:</span> {{ line.approver_user_name }}
                  </span>
                </div>
                <div v-if="idx < displayLines2.length - 1" class="ml-[3px] my-0.5 border-l border-dashed border-purple-200 h-2"></div>
              </div>
            </template>
            <p v-else class="text-xs text-gray-400 italic">결재선 정보가 없습니다.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 의견 + 서명 -->
    <div class="space-y-6">
      <!-- 의견 -->
      <div>
        <h2 class="text-base font-bold text-gray-800">📌 추가 의견</h2>
        <textarea
          :value="comment"
          data-testid="comment-textarea"
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

      <!-- 서명 (추가의견란과 동일 가로폭, 정사각형) -->
      <div>
        <h2 class="text-base font-bold text-gray-800">✍️ 서명</h2>
        <div ref="canvasWrap" class="relative w-full aspect-square">
          <canvas
            ref="canvas"
            data-testid="signature-canvas"
            :class="['absolute inset-0 w-full h-full border rounded-lg touch-none bg-white', { 'cursor-not-allowed': isImageLoaded }]"
          ></canvas>
          <button
            @click="clearCanvas(false)"
            class="absolute top-1 right-1 text-gray-500 hover:text-red-600 bg-white rounded-full px-1 text-sm"
            aria-label="서명 지우기"
            title="서명 지우기"
          >
            ✕
          </button>
        </div>
        <!-- 안내 메시지 -->
        <p class="text-[11px] text-gray-500 mt-2">
          <span class="px-1">✕</span>를 눌러 지우고 다시 서명할 수 있으며, <strong>기본서명</strong>으로 저장됩니다.
        </p>
      </div>
    </div>

    <div class="flex justify-between gap-2 pt-2">
      <button
        @click="$emit('prev')"
        class="w-full py-3 rounded bg-gray-100 hover:bg-gray-200"
      >
        이전
      </button>
      <button
        type="button"
        :disabled="isSubmitting"
        @click="sendApprovalRequest"
        data-testid="btn-submit"
        class="w-full py-3 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? "처리 중..." : "결재요청" }}
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
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useUserStore } from "@/store/userStore";
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
  "selectedHang",
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

// ✅ 부서 및 결재선 정보
const departments = ref([]);
const approvalLines1 = ref([]); // 기안자 부서 결재선
const approvalLines2 = ref([]); // Owner 부서 결재선
const selectedOption = ref("dept"); // 'dept' or 'owner'

const ownerDeptName = computed(() => {
  if (!props.selectedHang || categories.value.length === 0 || departments.value.length === 0) return null;
  const hangCategory = categories.value.find(c => c.category_id === props.selectedHang);
  if (!hangCategory || !hangCategory.owner_dept_id) return null;
  
  const dept = departments.value.find(d => d.id === hangCategory.owner_dept_id);
  return dept ? dept.dept_name : null;
});

const displayLines1 = computed(() => {
  const myLine = approvalLines1.value.find(line => line.approver_user_id === user.value?.userId);
  if (myLine) {
    return approvalLines1.value.filter(line => line.order_no > myLine.order_no);
  }
  return approvalLines1.value.filter(line => line.approver_user_id !== user.value?.userId);
});

const displayLines2 = computed(() => {
  if (ownerDeptName.value && ownerDeptName.value !== userDept.value) {
    return approvalLines2.value.filter(line => line.approver_role === "위원장");
  }
  const myLine = approvalLines2.value.find(line => line.approver_user_id === user.value?.userId);
  if (myLine) {
    return approvalLines2.value.filter(line => line.order_no > myLine.order_no);
  }
  return approvalLines2.value.filter(line => line.approver_user_id !== user.value?.userId);
});

const fetchApprovalLines = async (deptName, targetRef) => {
  if (!deptName) return;
  try {
    const res = await axios.get("/api/approval-lines", {
      params: { deptName },
      withCredentials: true,
    });
    targetRef.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(`❌ ${deptName} 결재선 조회 실패:`, err);
  }
};

onMounted(async () => {
  const [catRes, deptRes] = await Promise.all([
    axios.get("/api/accountCategories"),
    axios.get("/api/departments")
  ]);
  categories.value = catRes.data.categories || [];
  departments.value = deptRes.data || [];

  if (userDept.value) {
    await fetchApprovalLines(userDept.value, approvalLines1);
  }
});

watch(ownerDeptName, async (newVal) => {
  if (newVal && newVal !== userDept.value) {
    await fetchApprovalLines(newVal, approvalLines2);
  } else {
    approvalLines2.value = [];
    if (selectedOption.value === 'owner') {
      selectedOption.value = 'dept';
    }
  }
}, { immediate: true });

/* ✅ 미리보기 데이터 생성 */
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

  console.log("📄 [ConfirmTabMobile] Preview Data:", previewData);
  emits("generate", previewData);
};

/* =========================
   ✍️ 서명 캔버스 & 기본서명
   ========================= */
const canvas = ref(null);
const canvasWrap = ref(null);
let ctx;

function resizeCanvas() {
  const wrap = canvasWrap.value;
  const el = canvas.value;
  if (!wrap || !el) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (w > 0 && h > 0) {
    el.width = w;
    el.height = h;
  }
}
let drawing = false;
const wasCleared = ref(false);          // ✕ 눌러 지웠는지
const hasNotified = ref(false);         // 재서명 안내 1회만 표시
const didRedrawAfterClear = ref(false); // ✕ 후 실제로 다시 그렸는지 (저장 조건)
const isImageLoaded = ref(false);       // 이미지가 로드된 상태인지 (기본 서명 로드 시 true)

/* 기본서명 불러오기 (서버 → 없으면 패스) */
async function loadDefaultSignature() {
  try {
    const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
    const url = data?.signature; // 서버는 URL 반환 (없으면 null)
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

/* 캔버스에 이미지 로드 */
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

/* dataURL 추출 */
function getSignatureDataURL() {
  if (!canvas.value) return null;
  return canvas.value.toDataURL("image/png");
}

/* 기본서명 저장 (PUT dataURL) — 반드시 ✕ 후 재서명했을 때만 호출 */
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

/* ===== 드로잉 이벤트 바인딩 ===== */
onMounted(async () => {
  await nextTick();
  resizeCanvas();
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

/* 마우스 이벤트 */
const startDraw = (e) => {
  if (isImageLoaded.value) return; // 이미지가 로드된 경우 드로잉 방지

  if (wasCleared.value && !hasNotified.value) {
    //alert("변경된 서명이 기본서명에 저장됩니다.");
    hasNotified.value = true;
  }
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

/* 터치 이벤트 */
const startDrawTouch = (e) => {
  if (isImageLoaded.value) return; // 이미지가 로드된 경우 드로잉 방지

  e.preventDefault();
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

/* ✕ 버튼: 서명 초기화 */
const clearCanvas = (skipMark = false) => {
  if (canvas.value && ctx) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
  isImageLoaded.value = false;

  if (!skipMark) {
    wasCleared.value = true;
    hasNotified.value = false;
    didRedrawAfterClear.value = false;
  }
};

/* =========================
   결재 요청
   ========================= */
const showPopup = ref(false);
const isSubmitting = ref(false);

const sendApprovalRequest = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    // 선택한 결재선 옵션에 따른 부서 결정
    const deptNameForLines = selectedOption.value === 'owner' ? ownerDeptName.value : userDept.value;
    
    if (deptNameForLines) {
      const lineRes = await axios.get("/api/approval-lines", {
        params: { deptName: deptNameForLines },
        withCredentials: true,
      });
      const lines = Array.isArray(lineRes.data) ? lineRes.data : [];
      if (lines.length === 0) {
        alert(`${deptNameForLines} 부서의 결재선 정보가 없습니다. 등록 후 진행하세요.`);
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

    // API에는 반드시 선택한 부서명 사용 (결재선 선택 기준)
    const payloadDeptName = selectedOption.value === 'owner' ? ownerDeptName.value : userDept.value;
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
      selectedGwan: props.selectedGwan,
      selectedHang: props.selectedHang,
      selectedChoice: selectedOption.value, // 'dept' or 'owner'
    };

    const res = await axios.post("/api/approval", data, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    if (!res.data.success) throw new Error("서버 저장 실패");
    const requestId = res.data.id;

    // 첨부파일 업로드 및 관리
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

    // 결재이력 저장 (신규일 때만)
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

    // 현재 서명을 기본서명으로 저장
    // ▶ 조회한 기본서명을 그대로 쓴 경우에는 저장하지 않음
    // ▶ ✕로 지운 뒤 실제로 다시 그린 경우에만 저장
    if (wasCleared.value && didRedrawAfterClear.value) {
      await saveDefaultSignature();
    }

    showPopup.value = true;
  } catch (err) {
    console.error("❌ 결재요청 오류:", err);
    alert("❌ 결재요청 실패");
  } finally {
    isSubmitting.value = false;
  }
};

// 팝업 닫기
const closePopup = () => {
  showPopup.value = false;
  router.push("/approvalList");
};
</script>
