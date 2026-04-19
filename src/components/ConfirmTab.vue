<template>
  <div class="space-y-6 font-nanum">
    <!-- 상단: 최종확인 (7) : 결재선 (3) -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- 1사면: 최종확인 (기본정보 + 첨부파일) -->
      <div class="w-full md:w-[70%] space-y-6">
        <div class="space-y-2">
          <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>
          <div class="p-4 bg-gray-50 rounded-lg shadow-inner grid grid-cols-2 lg:grid-cols-3 gap-y-2 text-sm">
            <p><strong>청구 유형:</strong> {{ documentType }}</p>
            <p><strong>부서명:</strong> {{ props.selectedDept?.trim() || user?.deptName || '—' }}</p>
            <p><strong>작성자:</strong> {{ author }}</p>
            <p><strong>영수인:</strong> {{ payee }}</p>
            <p><strong>제출일자:</strong> {{ date }}</p>
            <p><strong>계정명:</strong> {{ gwanName }} / {{ hangName }}</p>
            <p><strong>청구총액:</strong> ₩{{ Number(totalAmount || 0).toLocaleString() }}</p>
            <p><strong>청구요청 별칭:</strong> {{ aliasName }}</p>
          </div>
        </div>

        <!-- ✅ 첨부파일 목록 표시 -->
        <div class="p-5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-3">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span class="text-xl">📎</span> 첨부파일
          </h3>
          <div class="min-h-[100px] max-h-[180px] overflow-y-auto pr-2">
            <ul v-if="attachedFiles && attachedFiles.length > 0" class="space-y-2">
              <li v-for="(f, idx) in attachedFiles" :key="idx" class="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-indigo-700 truncate mr-2">{{ f.aliasName || f.name }}</span>
                  <span class="text-xs text-gray-400 whitespace-nowrap">({{ (f.size / 1024).toFixed(1) }} KB)</span>
                </div>
                <span class="text-xs text-gray-500 truncate">{{ f.name }}</span>
              </li>
            </ul>
            <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 py-6">
              <span class="text-2xl mb-1">📁</span>
              <p class="text-sm">첨부된 파일이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 2사면: 결재선 선택 영역 (30%) -->
      <div class="w-full md:w-[30%] space-y-2">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span class="text-xl">🛤️</span> 결재선
        </h2>
        <div class="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div class="flex flex-col gap-3">
            <!-- 1안: 기안자 부서 -->
            <div 
              @click="selectedOption = 'dept'"
              :class="[
                'cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden',
                selectedOption === 'dept' 
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-md' 
                  : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
              ]"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold" :class="selectedOption === 'dept' ? 'text-indigo-700' : 'text-gray-600'">
                  1안: {{ userDept }}
                </span>
                <div v-if="selectedOption === 'dept'" class="bg-indigo-500 text-white rounded-full p-1 shadow-sm">
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
                  : 'border-gray-100 bg-gray-50 hover:border-purple-200'
              ]"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold" :class="selectedOption === 'owner' ? 'text-purple-700' : 'text-gray-600'">
                  2안: {{ ownerDeptName }}
                </span>
                <div v-if="selectedOption === 'owner'" class="bg-purple-500 text-white rounded-full p-1 shadow-sm">
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
      </div>
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
import { ref, onMounted, computed, watch } from "vue";
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
  // 기안자 본인을 찾음
  const myLine = approvalLines1.value.find(line => line.approver_user_id === user.value?.userId);
  if (myLine) {
    // 본인보다 뒷 순번(order_no가 더 큰)만 필터링
    return approvalLines1.value.filter(line => line.order_no > myLine.order_no);
  }
  // 만약 결재선에 본인이 없다면 (예: 재정부가 타부서 기안 시) 전체 표시하거나 기존처럼 처리
  return approvalLines1.value.filter(line => line.approver_user_id !== user.value?.userId);
});

const displayLines2 = computed(() => {
  if (ownerDeptName.value && ownerDeptName.value !== userDept.value) {
    // Owner 부서가 다른 경우: "위원장"만 표시
    return approvalLines2.value.filter(line => line.approver_role === "위원장");
  }
  
  // Owner 부서가 같거나 혹은 그 외의 경우 (기본 부서 결재라인 규칙 동일 적용)
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

  // 기안자 부서 결재선 로드
  if (userDept.value) {
    await fetchApprovalLines(userDept.value, approvalLines1);
  }
});

// Owner 부서가 변경될 때마다 결재선 로드
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
      selectedGwan : props.selectedGwan,
      selectedHang : props.selectedHang,
      selectedChoice: selectedOption.value, // 'dept' or 'owner'
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
