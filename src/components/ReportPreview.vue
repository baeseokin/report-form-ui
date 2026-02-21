<template>
  <div class="fixed flex items-center justify-center inset-0 bg-black bg-opacity-50 z-50 font-nanum">
    <!-- 닫기 버튼 -->
    <button
      @click="$emit('close')"
      class="fixed top-4 right-4 z-50 text-gray-500 hover:text-black text-2xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
    >
      ✕
    </button>
    <!-- 확대/축소 (드래그하여 위치 이동 가능) -->
    <div
      ref="zoomBarEl"
      class="fixed z-50 flex items-center gap-1 bg-white/95 rounded-lg shadow-lg border border-gray-200 px-2 py-1.5 no-print select-none touch-none cursor-grab active:cursor-grabbing"
      :style="{ top: zoomBarPos.top + 'px', left: zoomBarPos.left + 'px' }"
      @pointerdown="onZoomBarPointerDown"
    >
      <button
        type="button"
        aria-label="축소"
        @click="zoomOut"
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none pointer-events-auto"
      >−</button>
      <span class="text-xs font-medium text-gray-600 min-w-[3rem] text-center">{{ Math.round(scaleValue * 100) }}%</span>
      <button
        type="button"
        aria-label="확대"
        @click="zoomIn"
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none pointer-events-auto"
      >+</button>
      <button
        type="button"
        aria-label="가로 맞춤"
        @click="fitToWidth"
        class="ml-1 px-2 py-1 text-xs font-medium rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 pointer-events-auto"
      >맞춤</button>
    </div>
    <div
      class="bg-white rounded-2xl w-full sm:max-w-[52rem] h-screen p-0 relative overflow-y-auto overflow-x-hidden border-t-8 border-purple-500 flex justify-center"
    >
      <!-- 보고서: 한 번에 scale → 페이지 간격이 확대/축소에 따라 변하지 않음 -->
      <div class="flex flex-col items-center min-h-full w-full">
        <div
          ref="reportPanEl"
          :style="scaleWrapperStyle"
          class="flex flex-col items-center report-pan-wrapper"
          :class="{ 'report-pan-dragging': reportPanDrag.active }"
          @pointerdown="onReportPanDown"
        >
        <div
          v-if="report"
          class="page report-content break-before-page shrink-0"
          ref="reportContent"
          :style="pageContentStyle"
        >
        <h2 class="title-lg text-center mb-6 text-gray-800 mt-4">{{ report.documentType }}</h2>

        <!-- ✅ 결재 서명란 (조회 전용) -->
        <div class="flex justify-between mb-6">
          <!-- 좌측 결재란: 결재선 개수만큼 td, 각 td 폭(11% of container) -->
          <table
            class="border text-center table-fixed approval-table approval-table-left"
            :style="{ '--left-col-count': leftTableColumns.length || 4 }"
          >
            <thead class="bg-purple-100 text-gray-700">
              <tr>
                <th
                  v-for="line in leftTableColumns"
                  :key="`h-${line.id || line.approver_role}`"
                  class="border"
                >
                  {{ line.approver_role === "회계" ? "담당" : line.approver_role }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="sign-row">
                <td
                  v-for="line in leftTableColumns"
                  :key="`c-${line.id || line.approver_role}`"
                  class="border relative"
                >
                  <div class="flex flex-col items-center justify-center">
                    <!-- ✅ 서명 이미지 -->
                    <img
                      v-if="getSignature(line.approver_role)"
                      :src="getSignatureUrl(line.approver_role)"
                      class="signature-img"
                    />
                    <!-- ✅ 상태 뱃지 -->
                    <div class="inline-flex items-center mt-2">
                      <span
                        v-if="getStatus(line.approver_role)"
                        :class="[
                          'status-badge no-print inline-flex items-center justify-center',
                          getStatus(line.approver_role) === '이관' ? 'status-badge-transfer' : ''
                        ]"
                      >
                        <img
                          v-if="getStatus(line.approver_role) === '기안'"
                          src="/icons/draft.svg"
                          alt="Draft"
                          class="h-6 w-auto"
                        />
                        <span
                          v-else-if="getStatus(line.approver_role) === '이관'"
                          class="inline-flex items-center justify-center text-xs font-semibold leading-none"
                        >이관</span>
                        <img
                          v-else-if="getStatus(line.approver_role) === '승인'"
                          src="/icons/approved.svg"
                          alt="Approved"
                          class="h-6 w-auto"
                        />
                        <img
                          v-else-if="getStatus(line.approver_role) === '반려'"
                          src="/icons/rejected.svg"
                          alt="Rejected"
                          class="h-6 w-auto"
                        />
                      </span>
                    </div>
                    <!-- ✅ 결재 시간 (PDF/프린트 시 숨김) -->
                    <small v-if="getApprovedAt(line.approver_role)" class="no-print text-gray-500 text-[10px] mt-1">
                      {{ formatDateTime(getApprovedAt(line.approver_role)) }}
                    </small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 오른쪽 결재란 -->
          <table class="w-2/5 border text-center table-fixed approval-table approval-table-right">
            <thead class="bg-purple-100 text-gray-700">
              <tr>
                <th class="border w-1/4">담당</th>
                <th class="border w-1/4">부장</th>
                <th class="border w-1/4">위원장</th>
                <th class="border w-1/4">당회장</th>
              </tr>
            </thead>
            <tbody>
              <tr class="sign-row">
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ✅ 부서명 + 관/항 -->
        <table class="w-full border text-center mb-4">
          <tbody>
            <tr>
              <td class="border w-64 bg-blue-100 font-bold">부서명</td>
              <td class="border">{{ report.deptName }}</td>
            </tr>
            <tr>
              <td class="border w-64 bg-blue-100 font-bold">관/항</td>
              <td class="border">{{ gwanHangLabel }}</td>
            </tr>
          </tbody>
        </table>

        <!-- ✅ 지출내역 (관/항은 부서명 영역에 표시) -->
        <h3 class="title-md flex items-center mb-4">💸 <span class="ml-2">지출내역</span></h3>
        <table class="w-full border my-4 text-center expense-table">
          <thead class="bg-blue-100 text-gray-800">
            <tr>
              <th class="border">목</th>
              <th class="border">세목</th>
              <th class="border expense-col-detail">지출내역</th>
              <th class="border">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in paddedItems" :key="idx">
              <td class="border">{{ item.mok }}</td>
              <td class="border">{{ item.semok }}</td>
              <td
                class="border text-left expense-col-detail cursor-pointer select-none hover:bg-purple-50 active:bg-purple-100 transition-colors"
                @pointerdown.stop
                @click.stop="(e) => copyDetailToClipboard(item.detail ?? e.target?.textContent?.trim())"
                @pointerup.stop="(e) => { if (e.pointerType !== 'mouse') copyDetailToClipboard(item.detail ?? e.target?.textContent?.trim()); }"
              >
                {{ item.detail }}
              </td>
              <td class="border text-right">
                <span v-if="item.amount">{{ formatAmount(item.amount) }} 원</span>
              </td>
            </tr>
            <tr class="bg-blue-100 font-bold">
              <td colspan="3" class="border text-center">합 계</td>
              <td class="border text-right">{{ formatAmount(report.totalAmount) }} 원</td>
            </tr>
          </tbody>
        </table>

        <!-- ✅ 영수 문구 -->
        <div class="mt-10 text-right text-xl leading-loose">
          위의 금액을 정히 영수합니다.<br />
          {{ formatDate(report.date) }}<br />
          영수인 성명 : {{ report.author }}
        </div>
      </div>

        <!-- 페이지 사이 고정 간격 (scale과 함께 줄어들어 비율 유지) -->
        <div v-if="report && chunkedFiles.length" class="report-page-gap shrink-0" aria-hidden="true" />

      <!-- ✅ 첨부파일 -->
      <template v-for="(page, pageIdx) in chunkedFiles" :key="'page-'+pageIdx">
        <div class="page report-content break-before-page shrink-0" :style="pageContentStyle">
          <h2 class="title-lg text-center mb-6 text-gray-800">
            📎 첨부파일 ({{ pageIdx + 1 }} / {{ chunkedFiles.length }})
          </h2>

          <div v-for="(row, rowIdx) in page" :key="'row-'+rowIdx" class="flex justify-center gap-6 mt-8">
            <div
              v-for="(f, idx) in row"
              :key="'file-'+pageIdx+'-'+rowIdx+'-'+idx"
              class="flex flex-col items-center"
              :style="getImageWrapperStyle(row.length)"
            >
              <p class="text-gray-700 font-medium mb-2 text-center break-words">{{ getFileAlias(f) }}</p>
              <img
                v-if="isImage(f)"
                :src="getFileUrl(f)"
                :style="getImageStyle(f, row.length, row)"
                class="border rounded-lg shadow-md object-contain"
              />
              <p v-else class="text-sm text-gray-500 italic text-center">(이미지 미리보기를 지원하지 않는 파일 형식입니다)</p>
            </div>
          </div>
        </div>
        <!-- 다음 페이지와의 간격 -->
        <div v-if="pageIdx < chunkedFiles.length - 1" class="report-page-gap shrink-0" aria-hidden="true" />
      </template>
        </div>
      </div>
    </div>

<!-- ✅ 하단 고정 Float Bar (기본 숨김, 활동 시 표시) -->
<div
  class="fixed bottom-0 left-0 w-full bg-gradient-to-r from-purple-100 via-pink-100 to-sky-100 border-t border-gray-200 shadow-inner z-50 no-print transition-opacity duration-500"
  :class="{ 'opacity-0 pointer-events-none': !showActionBar, 'opacity-100': showActionBar }"
>
  <!-- PC 레이아웃 -->
  <div class="hidden sm:flex justify-center items-center gap-x-5 py-3 px-6">
    <button
      v-if="isApprovalPage"
      @click="openApproval('approve')"
      data-testid="btn-approve"
      class="px-4 py-2 rounded-lg bg-white/80 text-green-700 font-semibold shadow hover:bg-green-100 transition"
    >
      ✅ 승인
    </button>
    <button
      v-if="isApprovalPage"
      @click="openApproval('reject')"
      class="px-4 py-2 rounded-lg bg-white/80 text-red-700 font-semibold shadow hover:bg-red-100 transition"
    >
      ❌ 반려
    </button>
    <button
      @click="downloadPDF"
      class="px-4 py-2 rounded-lg bg-white/80 text-gray-700 font-semibold shadow hover:bg-gray-100 transition"
    >
      📄 PDF
    </button>
    <button
      @click="printReport"
      class="hidden sm:flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white px-5 py-2 rounded-lg shadow-md"
    >
      🖨️ 프린트
    </button>
    <button
      @click="openCommentList"
      data-testid="btn-comment-list"
      class="px-4 py-2 rounded-lg bg-white/80 text-gray-700 font-semibold shadow hover:bg-gray-100 transition"
    >
      💬 결재의견
    </button>
  </div>

  <!-- 모바일 레이아웃 -->
  <div class="flex sm:hidden flex-col gap-3 px-6 py-4">
    <div class="flex justify-around gap-4" v-if="isApprovalPage">
      <button
        @click="openApproval('approve')"
        data-testid="btn-approve"
        class="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold shadow hover:bg-green-600 active:scale-95 transition"
      >
        ✅ 승인
      </button>
      <button
        @click="openApproval('reject')"
        class="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold shadow hover:bg-red-600 active:scale-95 transition"
      >
        ❌ 반려
      </button>
    </div>
    <div class="flex justify-around gap-4">
      <button
        @click="downloadPDF"
        class="flex-1 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold shadow hover:bg-gray-200 active:scale-95"
      >
        📄 PDF
      </button>
      <button
        @click="openCommentList"
        data-testid="btn-comment-list"
        class="flex-1 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold shadow hover:bg-gray-200 active:scale-95"
      >
        💬 결재의견
      </button>
    </div>
  </div>
</div>


    <!-- ✅ 결재 팝업 -->
    <ApprovalPopup v-if="showPopup" :report="report" :mode="popupMode" @close="closePopup" @approved="handleApproved" />

    <!-- ✅ 결재 완료 알림 -->
    <ModalAlert :visible="showModal" title="알림" message="정상적으로 결재되었습니다." @close="handleModalClose" />

    <!-- ✅ 결재의견 목록 팝업 -->
    <div
      v-if="showCommentListPopup"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      @click.self="closeCommentList"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-800">💬 결재의견</h3>
          <button
            type="button"
            class="p-2 text-gray-500 hover:text-gray-800 rounded-lg"
            aria-label="닫기"
            @click="closeCommentList"
          >
            ✕
          </button>
        </div>
        <div class="overflow-y-auto flex-1 p-4">
          <p v-if="sortedApprovalHistory.length === 0" class="text-gray-500 text-center py-8">결재 이력이 없습니다.</p>
          <ul v-else class="space-y-3">
            <li
              v-for="(h, idx) in sortedApprovalHistory"
              :key="idx"
              class="border border-gray-200 rounded-lg p-3 bg-gray-50/50"
            >
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span class="font-mono text-gray-600">{{ formatDateTime(h.approved_at) }}</span>
                <span class="font-semibold text-gray-800">{{ h.approver_role || '-' }}</span>
                <span v-if="h.approver_user_name || h.approver_user_id" class="text-gray-700">{{ h.approver_user_name }}{{ h.approver_user_id ? `(${h.approver_user_id})` : '' }}</span>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': isFirstApplicantInHistory(h, idx),
                    'bg-green-500 text-white': !isFirstApplicantInHistory(h, idx) && isApprovedStatus(h.status),
                    'bg-red-500 text-white': isRejectedStatus(h.status),
                    'bg-gray-400 text-white': !isFirstApplicantInHistory(h, idx) && !isApprovedStatus(h.status) && !isRejectedStatus(h.status)
                  }"
                >
                  {{ isFirstApplicantInHistory(h, idx) ? '기안' : (isApprovedStatus(h.status) ? '승인' : isRejectedStatus(h.status) ? '반려' : (h.status || '-')) }}
                </span>
              </div>
              <p class="mt-2 text-gray-700 text-sm whitespace-pre-wrap border-t border-gray-100 pt-2">{{ h.comment || '의견 없음' }}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <!-- 클립보드 복사 말풍선 (body에 렌더링해 항상 맨 위에 표시) -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="copyToastShow"
          class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium shadow-lg whitespace-nowrap"
        >
          클립보드에 복사되었습니다.
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
// dynamic import
// import html2canvas from "html2canvas";
// dynamic import
// import jsPDF from "jspdf";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import ApprovalPopup from "./ApprovalPopup.vue";
import ModalAlert from "./ModalAlert.vue";
import axios from "axios";
import { useRoute } from "vue-router";
const route = useRoute();
const isApprovalPage = computed(() => {
  const result = route.path.startsWith("/approvalStatus");
  console.log("isApprovalPage:", result, "route:", route.path);
  return result;
});
// ✅ 공통 설정
const A4_WIDTH = 650;   // 가로
const A4_HEIGHT = 1500; // 세로

const props = defineProps(["report"]);
const emit = defineEmits(["close", "refreshList"]);

const { user } = storeToRefs(useUserStore());
const userDept = computed(() => user.value?.deptName || props.report?.deptName || "");
const userName = computed(() => user.value?.userName || props.report?.author || "");

// ✅ 계정과목 매핑용
const categories = ref([]);
const fetchCategories = async () => {
  try {
    const res = await axios.get("/api/accountCategories");
    categories.value = res.data.categories || [];
  } catch (e) {
    console.error("계정과목 로드 실패", e);
  }
};
const getCategoryName = (code) => {
  const found = categories.value.find(c => c.category_id === code);
  return found ? found.category_name : code || "";
};

// ✅ 부서명 테이블용 관/항 라벨 (동일 값이므로 한 줄로 표시)
const gwanHangLabel = computed(() => {
  const g = props.report?.selectedGwan ?? props.report?.items?.[0]?.gwan;
  const h = props.report?.selectedHang ?? props.report?.items?.[0]?.hang;
  if (!g && !h) return "—";
  const gName = getCategoryName(g);
  const hName = getCategoryName(h);
  return [gName, hName].filter(Boolean).join(" / ");
});

// ✅ 모바일/PC 확대·축소 (가로 맞춤 + 사용자 조절)
const PAGE_WIDTH_PX = 794; // 210mm ≈ 794px
const SCALE_MIN = 0.25;
const SCALE_MAX = 2;
const SCALE_STEP = 0.15;

const scaleValue = ref(1);
const panX = ref(0);
const panY = ref(0);
const scaleWrapperStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scaleValue.value})`,
  transformOrigin: "top center",
}));
const pageContentStyle = { width: "210mm", minHeight: "297mm" };

const reportPanEl = ref(null);
const reportPanDrag = ref({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

function onReportPanDown(e) {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  e.preventDefault();
  reportPanDrag.value = {
    active: true,
    startX: e.clientX,
    startY: e.clientY,
    startPanX: panX.value,
    startPanY: panY.value,
  };
  if (reportPanEl.value?.setPointerCapture) reportPanEl.value.setPointerCapture(e.pointerId);
  window.addEventListener("pointermove", onReportPanMove, { passive: false });
  window.addEventListener("pointerup", onReportPanUp);
  window.addEventListener("pointercancel", onReportPanUp);
}

function onReportPanMove(e) {
  if (!reportPanDrag.value.active) return;
  e.preventDefault();
  const dx = e.clientX - reportPanDrag.value.startX;
  const dy = e.clientY - reportPanDrag.value.startY;
  panX.value = reportPanDrag.value.startPanX + dx;
  panY.value = reportPanDrag.value.startPanY + dy;
}

function onReportPanUp() {
  reportPanDrag.value.active = false;
  window.removeEventListener("pointermove", onReportPanMove);
  window.removeEventListener("pointerup", onReportPanUp);
  window.removeEventListener("pointercancel", onReportPanUp);
}

function getFitToWidthScale() {
  const screenWidth = window.innerWidth;
  const padding = 24;
  const w = Math.max(screenWidth - padding, 200);
  return Math.min(1, w / PAGE_WIDTH_PX);
}

/** 처음 오픈했을 때와 동일한 배율 계산 */
function getInitialScale() {
  const screenWidth = window.innerWidth;
  if (screenWidth < 768) {
    return Math.max(SCALE_MIN, Math.min(1, getFitToWidthScale()));
  }
  return screenWidth < PAGE_WIDTH_PX ? screenWidth / PAGE_WIDTH_PX : 1;
}

function fitToWidth() {
  scaleValue.value = Math.max(SCALE_MIN, Math.min(SCALE_MAX, getInitialScale()));
  panX.value = 0;
  panY.value = 0;
}

function zoomIn() {
  scaleValue.value = Math.min(SCALE_MAX, scaleValue.value + SCALE_STEP);
}

function zoomOut() {
  scaleValue.value = Math.max(SCALE_MIN, scaleValue.value - SCALE_STEP);
}

// ✅ 확대/축소 바 드래그로 위치 이동
const ZOOM_BAR_STORAGE_KEY = "report-preview:zoomBarPos";
const zoomBarEl = ref(null);
const zoomBarPos = ref(
  (() => {
    try {
      const s = localStorage.getItem(ZOOM_BAR_STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (typeof p?.top === "number" && typeof p?.left === "number") return p;
      }
    } catch (_) {}
    return { top: 16, left: 16 };
  })()
);
const zoomBarDrag = ref({ active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

function clampZoomBarPosition(pos) {
  const el = zoomBarEl.value;
  const w = el ? el.offsetWidth : 200;
  const h = el ? el.offsetHeight : 56;
  return {
    top: Math.max(0, Math.min(window.innerHeight - h, pos.top)),
    left: Math.max(0, Math.min(window.innerWidth - w, pos.left)),
  };
}

function onZoomBarPointerDown(e) {
  if (e.target.closest("button")) return;
  e.preventDefault();
  zoomBarDrag.value = {
    active: true,
    startX: e.clientX,
    startY: e.clientY,
    startLeft: zoomBarPos.value.left,
    startTop: zoomBarPos.value.top,
  };
  if (zoomBarEl.value?.setPointerCapture) zoomBarEl.value.setPointerCapture(e.pointerId);
  window.addEventListener("pointermove", onZoomBarPointerMove, { passive: false });
  window.addEventListener("pointerup", onZoomBarPointerUp);
  window.addEventListener("pointercancel", onZoomBarPointerUp);
}

function onZoomBarPointerMove(e) {
  if (!zoomBarDrag.value.active) return;
  e.preventDefault();
  const dx = e.clientX - zoomBarDrag.value.startX;
  const dy = e.clientY - zoomBarDrag.value.startY;
  zoomBarPos.value = clampZoomBarPosition({
    top: zoomBarDrag.value.startTop + dy,
    left: zoomBarDrag.value.startLeft + dx,
  });
}

function onZoomBarPointerUp() {
  if (zoomBarDrag.value.active) {
    try {
      localStorage.setItem(ZOOM_BAR_STORAGE_KEY, JSON.stringify(zoomBarPos.value));
    } catch (_) {}
  }
  zoomBarDrag.value = { active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };
  window.removeEventListener("pointermove", onZoomBarPointerMove);
  window.removeEventListener("pointerup", onZoomBarPointerUp);
  window.removeEventListener("pointercancel", onZoomBarPointerUp);
}

onMounted(async () => {
  await fetchCategories();
  scaleValue.value = getInitialScale();
  refreshApprovalData();

  // ✅ 사용자 활동(마우스/터치) 시 하단 바 표시
  const handler = () => {
    if (hideTimerId.value) clearTimeout(hideTimerId.value);
    showActionBar.value = true;
    hideTimerId.value = setTimeout(() => { showActionBar.value = false; }, 1000);
  };
  activityHandler.value = handler;
  window.addEventListener("mousemove", handler, { passive: true });
  window.addEventListener("touchstart", handler, { passive: true });
});

onBeforeUnmount(() => {
  if (activityHandler.value) {
    window.removeEventListener("mousemove", activityHandler.value);
    window.removeEventListener("touchstart", activityHandler.value);
  }
  if (hideTimerId.value) clearTimeout(hideTimerId.value);
  if (zoomBarDrag.value.active) {
    window.removeEventListener("pointermove", onZoomBarPointerMove);
    window.removeEventListener("pointerup", onZoomBarPointerUp);
    window.removeEventListener("pointercancel", onZoomBarPointerUp);
  }
  if (reportPanDrag.value.active) {
    window.removeEventListener("pointermove", onReportPanMove);
    window.removeEventListener("pointerup", onReportPanUp);
    window.removeEventListener("pointercancel", onReportPanUp);
  }
});

// (승인/반려 로직)
const showPopup = ref(false);
const showModal = ref(false);
const approvalHistory = ref(props.report?.approvalHistory || []);
const approvalLines = ref(props.report?.approvalLine || []);
const showCommentListPopup = ref(false);
const popupMode = ref(null);

const copyToastShow = ref(false);
let copyToastTimer = null;
const showCopyToast = () => {
  copyToastShow.value = true;
  if (copyToastTimer) clearTimeout(copyToastTimer);
  copyToastTimer = setTimeout(() => {
    copyToastShow.value = false;
    copyToastTimer = null;
  }, 1000);
};
const copyDetailToClipboard = async (text) => {
  const str = text != null ? String(text).trim() : "";
  if (!str) return;
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(str);
      copied = true;
    }
  } catch (e) {
    console.warn("클립보드 API 실패:", e);
  }
  if (!copied) {
    try {
      const ta = document.createElement("textarea");
      ta.value = str;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, str.length);
      copied = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e2) {
      console.warn("execCommand 복사 실패:", e2);
    }
  }
  if (copied) showCopyToast();
};

const openApproval = (mode) => { popupMode.value = mode; showPopup.value = true; };
const closePopup = () => { showPopup.value = false; };

const refreshApprovalData = async () => {
  if (!props.report?.id) return;
  try {
    const res = await axios.get(`/api/approval/detail/${props.report.id}`, { withCredentials: true });
    approvalHistory.value = res.data.approvalHistory || [];
    approvalLines.value = res.data.approvalLine || [];
  } catch (err) { console.error("❌ 결재 이력 갱신 실패:", err); }
};
const handleApproved = async () => { await refreshApprovalData(); showPopup.value = false; showModal.value = true; emit("refreshList"); };
const handleModalClose = () => { showModal.value = false; emit("close"); };

const openCommentList = () => { showCommentListPopup.value = true; };
const closeCommentList = () => { showCommentListPopup.value = false; };

const sortedApprovalHistory = computed(() => {
  const list = [...(approvalHistory.value || [])];
  return list.sort((a, b) => {
    const ta = a.approved_at ? new Date(a.approved_at).getTime() : 0;
    const tb = b.approved_at ? new Date(b.approved_at).getTime() : 0;
    return ta - tb;
  });
});

// ✅ "기안" 뱃지는 시간순 첫 번째 결재(기안자 역할)일 때만 표시
const firstApplicantIndexInSorted = computed(() =>
  sortedApprovalHistory.value.findIndex((h) => APPLICANT_ROLES.includes(h.approver_role))
);
const isFirstApplicantInHistory = (h, idx) =>
  APPLICANT_ROLES.includes(h.approver_role) && idx === firstApplicantIndexInSorted.value;

const formatAmount = (val) => (!val && val !== 0 ? "" : Number(val).toLocaleString("ko-KR"));

// ✅ 좌측 결재 테이블 컬럼: 재정부 이력이 있으면 결재선 맨 마지막에 "재정부" 컬럼 추가
const leftTableColumns = computed(() => {
  const lines = approvalLines.value || [];
  const history = approvalHistory.value || [];
  const hasRevenueInHistory = history.some((h) => h.approver_role === "재정부");
  const alreadyHasRevenue = lines.some((l) => l.approver_role === "재정부");
  if (!hasRevenueInHistory || alreadyHasRevenue) return lines;
  return [...lines, { approver_role: "재정부", id: "revenue-dept" }];
});

// ✅ 기안(첫 번째 칸)은 결재선 역할(담당 등)이 아니라 "재정부"/"작성자"/"회계"로 저장될 수 있음 → 첫 번째 역할일 때 해당 이력도 매칭
const APPLICANT_ROLES = ["재정부", "작성자", "회계"];
const isApprovedStatus = (s) => s && (String(s).toLowerCase() === "approved" || s === "승인");
const isRejectedStatus = (s) => s && (String(s).toLowerCase() === "rejected" || s === "반려");
const getHistoryRecord = (role) => {
  const history = [...approvalHistory.value].reverse();
  const firstLineRole = approvalLines.value[0]?.approver_role;
  const result = history.find((h) => {
    if (h.approver_role === role) return true;
    if (firstLineRole === role && APPLICANT_ROLES.includes(h.approver_role)) return true;
    return false;
  }) || null;
  // ✅ 재정부 열에는 첫 번째 결재 데이터(기안)를 표시하지 않음
  if (role === "재정부" && result) {
    const firstIdx = firstApplicantIndexInSorted.value;
    if (firstIdx >= 0) {
      const firstApplicant = sortedApprovalHistory.value[firstIdx];
      const isSameRecord =
        firstApplicant &&
        firstApplicant.approved_at === result.approved_at &&
        firstApplicant.approver_user_id === result.approver_user_id;
      if (isSameRecord) return null;
    }
  }
  return result;
};
const getSignature = (role) => getHistoryRecord(role)?.signature_path || null;
const getComment = (role) => getHistoryRecord(role)?.comment || null;
const getSignatureUrl = (role) => {
  const p = getSignature(role);
  if (!p) return "";
  let rel = p;
  try { rel = decodeURIComponent(p); } catch {}
  return `/api/files/${encodeURIComponent(rel)}`;
};
const getApprovedAt = (role) => getHistoryRecord(role)?.approved_at || null;
const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);

  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yy}/${mm}/${dd} ${hh}:${min}`;
};

const getStatus = (role) => {
  const record = getHistoryRecord(role);
  if (!record) return null;

  // ✅ 기안: 첫 번째 결재 칸이고, 해당 이력의 approver_role이 재정부/작성자/회계일 때만
  const isFirstLine = approvalLines.value[0]?.approver_role === role;
  if (isFirstLine && APPLICANT_ROLES.includes(record.approver_role)) return "기안";

  // ✅ 재정부 열에서 승인인 경우 → "이관"으로 표시
  if (role === "재정부" && isApprovedStatus(record.status)) return "이관";

  return record.status || null;
};

const paddedItems = computed(() => {
  const items = (props.report?.items || []).map((i) => ({
    gwan: getCategoryName(i.gwan),
    hang: getCategoryName(i.hang),
    mok: i.mok === "__custom__" ? i.customMok : getCategoryName(i.mok),
    semok: i.semok === "__custom__" ? i.customSemok : getCategoryName(i.semok),
    detail: i.detail === "__custom__" ? i.customDetail : i.detail,
    amount: i.amount,
  }));

  return items.length >= 8
    ? items
    : [...items, ...Array(8 - items.length).fill({ gwan: "", hang: "", mok: "", semok: "", detail: "", amount: null })];
});


const filesToPreview = computed(() => props.report?.attachedFiles?.length ? props.report.attachedFiles : props.report?.files || []);
// ✅ 페이지 분리 + 행(row) 배치
const chunkedFiles = computed(() => {
  const files = filesToPreview.value;
  const pages = [];
  let currentPage = [];
  let currentHeight = 0;
  let currentRow = [];
  let currentRowWidth = 0;
  const rowHeight = 800;

  const flushRow = () => {
    if (currentRow.length) {
      currentPage.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
      currentHeight += rowHeight;
    }
  };

  const flushPage = () => {
    if (currentPage.length) {
      pages.push(currentPage);
      currentPage = [];
      currentHeight = 0;
    }
  };

  files.forEach((f) => {
    const isPortrait = (f.height || 1000) > (f.width || 600);
    const estWidth = isPortrait ? 300 : 700;
    const estHeight = isImage(f) ? rowHeight : 200;

    if (currentHeight + estHeight > A4_HEIGHT) {
      flushRow();
      flushPage();
    }

    if (currentRowWidth + estWidth > A4_WIDTH) {
      flushRow();
    }

    currentRow.push(f);
    currentRowWidth += estWidth;
  });

  if (currentRow.length) flushRow();
  if (currentPage.length) flushPage();

  return pages;
});
const getFileAlias = (f) => {
  const alias = f.alias_name || f.file_name || f.name || "첨부파일";
  return alias.length > 20 ? alias.slice(0, 17) + "..." : alias;
};


const isImage = (f) => (f.type?.startsWith("image/") || /\.(png|jpe?g|gif)$/i.test(f.name || f.file_name || ""));

const getFileUrl = (f) => {
  if (f.file) {
    return URL.createObjectURL(f.file);
  } else if (f.file_path) {
    // 안전한 파일명(file_path)만 URL에 사용
    return `/api/files/${encodeURIComponent(f.file_path)}`;
  }
  return "";
};


const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

// ✅ 이미지 스타일
const getImageStyle = (file, rowLength, siblings = []) => {
  if (rowLength === 1) {
    const width = file.width || 800;
    const scale = Math.min(1, A4_WIDTH / width);
    return { maxWidth: `${width * scale}px`, maxHeight: "1000px", objectFit: "contain" };
  } else if (rowLength === 2 && siblings.length === 2) {
    const w1 = siblings[0].width || 600;
    const w2 = siblings[1].width || 600;
    const sum = w1 + w2;
    const scale = Math.min(1, A4_WIDTH / sum);
    return { maxWidth: `${(file.width || 600) * scale}px`, maxHeight: "900px", objectFit: "contain" };
  }
  return {};
};

// ✅ Wrapper 스타일
const getImageWrapperStyle = (rowLength) =>
  rowLength === 1 ? { width: "100%", textAlign: "center" } : { width: "45%" };

// ReportPreview.vue
const generatePDF = async () => {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  try { if (document.fonts?.ready) await document.fonts.ready; } catch {}

  const ROW_PX = 45; // 원하는 행 높이(px): 52~60 사이로 조정해 보세요.
  const SIGN_ROW_PX = 160; // ✅ 서명행 화면용 높이
  const SIGN_ROW_PX_PDF = 100; // ✅ PDF/프린트 시 상태뱃지·말풍선 제외하여 세로 축소

  // ✅ 복제 DOM(캡처본)에만 적용될 PDF 전용 CSS
  const pdfOnlyCSS = `
    /* ✅ PDF 시 상태 뱃지·말풍선·결재시간 숨김 → 서명 이미지만 표시 */
    .report-content .no-print { display: none !important; }
    .report-content table { table-layout: fixed; border-collapse: collapse; }
    .report-content table th, .report-content table td {
      /* 테이블 자체 레이아웃 유지 */
      padding: 0;                  /* 셀 패딩은 제거하고 */
      height: ${ROW_PX}px;         /* 행 높이 통일 */
      min-height: ${ROW_PX}px;
      box-sizing: border-box;
      text-align: center;
      vertical-align: middle;      /* 백업용 */
    }
    /* ✅ 서명란 테이블: PDF 시 세로 축소(서명 이미지만) */
    .report-content table.approval-table tbody tr.sign-row th,
    .report-content table.approval-table tbody tr.sign-row td {
      height: ${SIGN_ROW_PX_PDF}px !important;
      min-height: ${SIGN_ROW_PX_PDF}px !important;
    }
    /* ✅ 좌측 결재란: 열 개수에 따라 td 폭 = 우측과 동일 */
    .report-content table.approval-table-left {
      width: calc(var(--left-col-count, 4) * 11%);
      min-width: calc(var(--left-col-count, 4) * 11%);
    }
    .report-content table.approval-table-left th,
    .report-content table.approval-table-left td {
      width: calc(100% / var(--left-col-count, 4));
      min-width: calc(100% / var(--left-col-count, 4));
      max-width: calc(100% / var(--left-col-count, 4));
      box-sizing: border-box;
    }

    /* 1단 래퍼: 셀과 동일 높이로 고정 */
    .report-content .vc {
      display: block;
      height: ${ROW_PX}px;
      min-height: ${ROW_PX}px;
      width: 100%;
      box-sizing: border-box;
      padding: 0 10px;             /* 좌우 여백은 여기서 */
      overflow: hidden;
    }
    /* 2단 래퍼: flex 100% 높이로 정확 중앙 */
    .report-content .vc-i {
      display: flex;
      align-items: center;         /* 세로 중앙 */
      justify-content: center;     /* 가로 중앙(필요 시 flex-start로 변경) */
      height: 100%;
      width: 100%;
      line-height: 1.3;            /* 폰트 메트릭 차이 완충 */
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      transform: translateY(-7px); /* ✅ 시각적 세로 중앙 보정 */
    }
    /* 여러 줄이 필요한 셀: 템플릿에서 td에 class="cell-multiline" */
    .report-content .vc.multiline .vc-i {
      white-space: normal;         /* 줄바꿈 허용 */
      justify-content: flex-start; /* 왼쪽 정렬 권장 */
      text-align: left;
      line-height: 1.4;
      padding-top: 6px;
      padding-bottom: 6px;
    }
    /* 숫자/금액 우측 정렬: 템플릿에서 td에 class="cell-right" */
    .report-content .vc.right .vc-i {
      justify-content: flex-end;
      text-align: right;
      white-space: nowrap;
    }
    /* ✅ 상태 뱃지 텍스트 보정 (PDF 전용) */
    .report-content .status-badge{
      display: inline-flex !important;      /* 라인박스 영향 제거 */
      align-items: center !important;       /* 수직 중앙 */
      justify-content: center !important;   /* 수평 중앙 */
      line-height: 1 !important;            /* 폰트 메트릭 차이 제거 */
      transform: translateY(1px) !important; /* 요청한 보정값 */
    }
    /* 서명행에서 vc-i의 transform을 끘 경우에도 균일 보정 */
    .report-content tr.sign-row .status-badge{
      transform: translateY(1px) !important;
    }      
    /* =======================
       ✅ 서명행 전용 보정 (PDF: no-print 제외 후 낮은 높이)
       ======================= */
    .report-content tr.sign-row .vc,
    .report-content tr.sign-row .vc-i {
      height: ${SIGN_ROW_PX_PDF}px !important;
      min-height: ${SIGN_ROW_PX_PDF}px !important;
      overflow: visible !important;
      transform: none !important;
      white-space: normal;
    }
    .report-content tr.sign-row img {
      max-height: ${SIGN_ROW_PX_PDF - 20}px !important;
      max-width: 80% !important;                   /* ✅ 폭 제한 (전체 셀의 80%) */
      height: auto !important;
      width: auto !important;                      /* tailwind w-20 무력화 */
      object-fit: contain !important;
      display: block !important;
      margin: 0 auto !important;
      padding: 0 !important;                       /* ✅ 내부 여백 제거 */
      transform: translateY(-4px);                 /* ✅ 세로 균형 약간 올림 */
    }      
    /* ✅ vc 래퍼 좌우 여백 제거 (PDF용 전용) */
    .report-content tr.sign-row .vc {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }      
    .signature-img {
      height: 80px;               /* ✅ 고정 높이 */
      width: auto;                /* 비율에 맞게 자동 조정 */
      object-fit: contain;        /* 이미지 비율 유지 */
      display: block;
      margin: 0 auto;
      border-radius: 8px;
    }
    /* ✅ 맨 끝에 두어 .status-badge(display:inline-flex)보다 우선 적용 → 상태 뱃지/말풍선/결재시간 완전 숨김 */
    .report-content tr.sign-row .status-badge.no-print,
    .report-content tr.sign-row small.no-print,
    .report-content .no-print { display: none !important; }
  `;

  const pdf = new jsPDF("p", "mm", "a4");
  const pages = document.querySelectorAll(".page");

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
      onclone: (doc) => {
        // 1) 스타일 주입
        const style = doc.createElement("style");
        style.textContent = pdfOnlyCSS;
        doc.head.appendChild(style);

        // 2) 모든 셀 내용을 2단 래퍼(.vc > .vc-i)로 감싸기
        const cells = doc.querySelectorAll(".report-content table th, .report-content table td");
        cells.forEach((cell) => {
          // 이미 감싼 경우 스킵
          const first = cell.firstElementChild;
          if (first && first.classList?.contains("vc")) {
            // 높이만 최신화
            first.style.height = `${ROW_PX}px`;
            first.style.minHeight = `${ROW_PX}px`;
            const inner = first.firstElementChild;
            if (inner && inner.classList?.contains("vc-i")) inner.style.height = "100%";
            return;
          }

          const vc = doc.createElement("div");
          vc.className = "vc";
          // 힌트 클래스 승계: 여러 줄, 우측정렬
          if (cell.classList?.contains("cell-multiline")) vc.classList.add("multiline");
          if (cell.classList?.contains("cell-right")) vc.classList.add("right");

          const vci = doc.createElement("div");
          vci.className = "vc-i";

          // 기존 노드들을 vci로 이동
          while (cell.firstChild) vci.appendChild(cell.firstChild);
          vc.appendChild(vci);
          cell.appendChild(vc);
        });
      },
    });

    const img = canvas.toDataURL("image/png");
    const pdfW = pdf.internal.pageSize.getWidth();
    const imgH = (canvas.height * pdfW) / canvas.width;

    if (i > 0) pdf.addPage();
    pdf.addImage(img, "PNG", 0, 0, pdfW, imgH);
  }

  return pdf;
};




const downloadPDF = async () => {
  const pdf = await generatePDF();
  pdf.save(`${props.report.documentType}_${userDept.value}_${props.report.date}.pdf`);
};

const printReport = async () => {
  const pdf = await generatePDF();
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);

  // ✅ 숨김 iframe 생성 (한 번만 만들고 계속 유지)
  let iframe = document.getElementById("pdfPrintFrame");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "pdfPrintFrame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }

  iframe.src = url;

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // ❌ 자동 제거 안 함 → PDF 미리보기 계속 유지
  };
};

// ✅ 하단 바 표시 제어 상태
const showActionBar = ref(false);
const hideTimerId = ref(null);
const activityHandler = ref(null);

</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 10mm;
  background: white;
  /*border: 1px solid #ccc; */
  box-shadow: 0 0 10px rgba(0,0,0,0.15); 
  box-sizing: border-box;
  transform-origin: top center;
}
/* 확대 후 터치/드래그로 좌우·상하 이동(패닝) */
.report-pan-wrapper {
  touch-action: none;
  cursor: grab;
  user-select: none;
}
.report-pan-wrapper.report-pan-dragging {
  cursor: grabbing;
}

/* 페이지 사이 고정 간격 (scale 래퍼 안에서 함께 축소되어 비율 유지) */
.report-page-gap {
  height: 24px;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .page { margin-top: 1rem !important; }
}
@media print {
  .no-print { display: none !important; }
  .report-page-gap { height: 0; }
  .page,
  .report-content,
  .report-content * {
    font-family: "Nanum Barun Gothic", "Malgun Gothic", "Apple SD Gothic Neo", "AppleGothic", "Noto Sans KR", sans-serif !important;
  }
  .page {
    border: none;
    box-shadow: none;
    page-break-after: always;
    padding: 20mm 10mm;
  }
}
.report-content { font-size: 14pt; }
.title-lg { font-size: 20pt; font-weight: 800; }
.title-md { font-size: 16pt; font-weight: 700; }
/* ✅ 보고서 테이블 선색: 셀 배경(보라/파랑)에서도 잘 보이도록 옅게 */
.report-content table,
.report-content table th,
.report-content table td {
  border-color: #d1d5db !important; /* gray-300 */
}
table td, table th {
  height: 3rem;
  vertical-align: middle !important;
  text-align: center;
  padding: 0 10px;
}
.signature-img {
  height: 80px;               /* ✅ 고정 높이 */
  width: auto;                /* 비율에 맞게 자동 조정 */
  object-fit: contain;        /* 이미지 비율 유지 */
  display: block;
  margin: 0 auto;
  border-radius: 8px;
}

/* ✅ 지출내역 테이블: 지출내역 열 가로 폭 확대, 폰트 한 단계 축소 */
.report-content table.expense-table {
  table-layout: fixed;
}
.report-content table.expense-table th,
.report-content table.expense-table td {
  font-size: 0.875em; /* 14pt 기준 한 단계 축소 */
}
.report-content table.expense-table th.expense-col-detail,
.report-content table.expense-table td.expense-col-detail {
  width: 45%;
  min-width: 0;
  word-break: break-word;
  padding-left: 12px;
  padding-right: 12px;
}
.report-content table.expense-table th.expense-col-detail {
  text-align: center;
}
.report-content table.expense-table td.expense-col-detail {
  text-align: left;
}
.report-content table.expense-table th:not(.expense-col-detail),
.report-content table.expense-table td:not(.expense-col-detail) {
  width: auto;
}

/* ✅ 재정부 열 '이관' 뱃지: 기안 뱃지와 동일한 모양(높이 h-6, 둥근 pill), blue 계열 */
.report-content .status-badge-transfer {
  background-color: #3b82f6;
  color: #fff;
  border-radius: 9999px;
  height: 1.5rem;
  min-width: 3.5rem;
  padding: 0 0.5rem;
}
.report-content .status-badge-transfer span {
  background: transparent;
  color: inherit;
}

/* ✅ 좌측 결재란: 열 개수에 따라 테이블 너비 = N×11%, 각 td = 11% of container */
.report-content table.approval-table-left {
  width: calc(var(--left-col-count, 4) * 11%);
  min-width: calc(var(--left-col-count, 4) * 11%);
}
.report-content table.approval-table-left th,
.report-content table.approval-table-left td {
  width: calc(100% / var(--left-col-count, 4));
  min-width: calc(100% / var(--left-col-count, 4));
  max-width: calc(100% / var(--left-col-count, 4));
  box-sizing: border-box;
}

/* ✅ 프린트 시: 서명란에서 상태 뱃지·결재시간 숨김, 서명 행 높이 축소 */
@media print {
  .report-content .no-print {
    display: none !important;
  }
  .report-content table.approval-table tbody tr.sign-row th,
  .report-content table.approval-table tbody tr.sign-row td {
    height: 100px !important;
    min-height: 100px !important;
  }
}

/* 클립보드 복사 말풍선 전환 */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

</style>
