<template>
  <div class="fixed flex items-center justify-center inset-0 bg-black bg-opacity-50 z-50 font-nanum">
    <!-- 닫기 버튼 -->
    <button
      @click="$emit('close')"
      class="fixed top-4 right-4 z-50 text-gray-500 hover:text-black text-2xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
    >
      ✕
    </button>
    <div
      class="bg-white rounded-2xl w-full sm:max-w-[52rem] h-screen p-0 relative overflow-y-auto border-t-8 border-purple-500
            transform sm:scale-100 origin-top"
    >
      <!-- 보고서 -->
      <div
        v-if="report"
        class="page report-content break-before-page"
        ref="reportContent"
        :style="pageStyle"
      >
        <h2 class="title-lg text-center mb-6 text-gray-800 mt-4">{{ report.documentType }}</h2>

        <!-- ✅ 결재 서명란 (조회 전용) -->
        <div class="flex justify-between mb-6">
          <table class="w-2/5 border text-center table-fixed">
            <thead class="bg-purple-100 text-gray-700">
              <tr>
                <th v-for="role in approverRoles" :key="role" class="border">
                  {{ role === "회계" ? "담당" : role }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="h-24">
                <td
                  v-for="role in approverRoles"
                  :key="role"
                  class="border relative"
                >
                  <div class="flex flex-col items-center justify-center">
                    <!-- ✅ 서명 이미지 -->
                    <img
                      v-if="getSignature(role)"
                      :src="getSignatureUrl(role)"
                      class="w-20 h-20 object-contain rounded"
                    />
                    <!-- ✅ 상태 뱃지 -->
                    <span
                      v-if="getStatus(role)"
                      :class="[
                        'mt-2 px-2 py-1 rounded-full text-xs font-bold',
                        getStatus(role) === '승인'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-red-100 text-red-700 border border-red-300'
                      ]"
                    >
                      {{ getStatus(role) }}
                    </span>
                    <!-- ✅ 결재 시간 -->
                    <small v-if="getApprovedAt(role)" class="text-gray-500 text-xs mt-1">
                      {{ formatDateTime(getApprovedAt(role)) }}
                    </small>
                  </div>

                  <!-- 말풍선 -->
                  <div
                    v-if="visibleCommentRole === role"
                    class="absolute top-6 right-0 bg-white border border-gray-300 shadow-lg rounded p-2 text-sm w-40 z-50 no-print"
                  >
                    {{ getComment(role) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 오른쪽 결재란 -->
          <table class="w-2/5 border text-center table-fixed">
            <thead class="bg-purple-100 text-gray-700">
              <tr>
                <th class="border w-1/4">담당</th>
                <th class="border w-1/4">부장</th>
                <th class="border w-1/4">위원장</th>
                <th class="border w-1/4">당회장</th>
              </tr>
            </thead>
            <tbody>
              <tr class="h-24">
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ✅ 부서명 -->
        <table class="w-full border text-center mb-4">
          <tbody>
            <tr>
              <td class="border w-64 bg-blue-100 font-bold">부서명</td>
              <td class="border">{{ userDept }}</td>
            </tr>
          </tbody>
        </table>

        <!-- ✅ 지출내역 -->
        <h3 class="title-md flex items-center mb-4">💸 <span class="ml-2">지출내역</span></h3>
        <table class="w-full border my-4 text-center">
          <thead class="bg-blue-100 text-gray-800">
            <tr>
              <th class="border">관</th>
              <th class="border">항</th>
              <th class="border">목</th>
              <th class="border">세목</th>
              <th class="border">지출내역</th>
              <th class="border">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in paddedItems" :key="idx">
              <td class="border">{{ item.gwan }}</td>
              <td class="border">{{ item.hang }}</td>
              <td class="border">{{ item.mok }}</td>
              <td class="border">{{ item.semok }}</td>
              <td class="border">{{ item.detail }}</td>
              <td class="border text-right">
                <span v-if="item.amount">{{ formatAmount(item.amount) }} 원</span>
              </td>
            </tr>
            <tr class="bg-blue-100 font-bold">
              <td colspan="5" class="border text-center">합 계</td>
              <td class="border text-right">{{ formatAmount(report.totalAmount) }} 원</td>
            </tr>
          </tbody>
        </table>

        <!-- ✅ 영수 문구 -->
        <div class="mt-10 text-right text-xl leading-loose">
          위의 금액을 정히 영수합니다.<br />
          {{ formatDate(report.date) }}<br />
          영수인 성명 : {{ userName }} (인)
        </div>
      </div>

      <!-- ✅ 첨부파일 -->
      <template v-for="(pageFiles, pageIdx) in chunkedFiles" :key="'page-'+pageIdx">
        <div class="page report-content mt-10 break-before-page" :style="pageStyle">
          <h2 class="title-lg text-center mb-6 text-gray-800">
            📎 첨부파일 ({{ pageIdx + 1 }} / {{ chunkedFiles.length }})
          </h2>
          <ul class="space-y-6">
            <li v-for="(f, idx) in pageFiles" :key="'file-'+pageIdx+'-'+idx" class="space-y-2">
              <p class="text-gray-700 font-medium">{{ getFileAlias(f) }}</p>
              <img
                v-if="isImage(f)"
                :src="getFileUrl(f)"
                class="border rounded-lg shadow-md max-h-[500px] mx-auto"
              />
              <p v-else class="text-sm text-gray-500 italic">(이미지 미리보기를 지원하지 않는 파일 형식입니다)</p>
            </li>
          </ul>
        </div>
      </template>

      <!-- ✅ PDF & 프린터 버튼 -->
      <!-- <div class="flex justify-end gap-4 mt-6 mb-20 pr-6 no-print">
        <button @click="downloadPDF" class="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-lg shadow-md">📄 PDF 다운로드</button>
        <button @click="printReport" class="hidden sm:flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white px-5 py-2 rounded-lg shadow-md">🖨️ 프린터 출력</button>
      </div> -->
    </div>

<!-- ✅ 하단 고정 Float Bar -->
<div
  class="fixed bottom-0 left-0 w-full bg-gradient-to-r from-purple-100 via-pink-100 to-sky-100 border-t border-gray-200 shadow-inner z-50 no-print"
>
  <!-- PC 레이아웃 -->
  <div class="hidden sm:flex justify-center items-center gap-x-5 py-3 px-6">
    <button
      v-if="isApprovalPage"
      @click="openApproval('approve')"
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
  </div>

  <!-- 모바일 레이아웃 -->
  <div class="flex sm:hidden flex-col gap-3 px-6 py-4">
    <div class="flex justify-around gap-4" v-if="isApprovalPage">
      <button
        @click="openApproval('approve')"
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
    </div>
  </div>
</div>


    <!-- ✅ 결재 팝업 -->
    <ApprovalPopup v-if="showPopup" :report="report" :mode="popupMode" @close="closePopup" @approved="handleApproved" />

    <!-- ✅ 결재 완료 알림 -->
    <ModalAlert :visible="showModal" title="알림" message="정상적으로 결재되었습니다." @close="handleModalClose" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
}
  
);


const props = defineProps(["report"]);
const emit = defineEmits(["close"]);

const { user } = storeToRefs(useUserStore());
const userDept = computed(() => user.value?.deptName || props.report?.deptName || "");
const userName = computed(() => user.value?.userName || props.report?.author || "");

// ✅ 모바일 scale 비율 동적 계산
const scaleValue = ref(1);
const pageStyle = computed(() => ({
  transform: `scale(${scaleValue.value})`,
  transformOrigin: "top center",
  width: "210mm",
  minHeight: "297mm"
}));

onMounted(() => {
  const pageWidth = 794; // 210mm ≈ 794px
  const screenWidth = window.innerWidth;
  if (screenWidth < 768) {
    scaleValue.value = 1;
  } else {
    scaleValue.value = screenWidth < pageWidth ? screenWidth / pageWidth : 1;
  }
});

// (승인/반려 로직)
const approverRoles = ["회계", "부장", "위원장", "당회장"];
const showPopup = ref(false);
const showModal = ref(false);
const approvalHistory = ref(props.report?.approvalHistory || []);
const visibleCommentRole = ref(null);
const popupMode = ref(null);

const openApproval = (mode) => { popupMode.value = mode; showPopup.value = true; };
const closePopup = () => { showPopup.value = false; };

const refreshApprovalData = async () => {
  if (!props.report?.id) return;
  try {
    const res = await axios.get(`/api/approval/detail/${props.report.id}`, { withCredentials: true });
    approvalHistory.value = res.data.approvalHistory || [];
  } catch (err) { console.error("❌ 결재 이력 갱신 실패:", err); }
};
const handleApproved = async () => { await refreshApprovalData(); showPopup.value = false; showModal.value = true; };
const handleModalClose = () => { showModal.value = false; emit("close"); };

const formatAmount = (val) => (!val && val !== 0 ? "" : Number(val).toLocaleString("ko-KR"));
const getSignature = (role) => approvalHistory.value.find(h => h.approver_role === role)?.signature_path || null;
const getComment = (role) => approvalHistory.value.find(h => h.approver_role === role)?.comment || null;
const getSignatureUrl = (role) => {
  const signaturePath = getSignature(role);
  return signaturePath ? `/api/files/${signaturePath}` : "";
};
const getApprovedAt = (role) => approvalHistory.value.find(h => h.approver_role === role)?.approved_at || null;
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
  if (role === "회계") return "기안";
  return approvalHistory.value.find(h => h.approver_role === role)?.status || null;
};

const paddedItems = computed(() => {
  const items = props.report?.items || [];
  return items.length >= 8 ? items : [...items, ...Array(8 - items.length).fill({ gwan: "", hang: "", mok: "", semok: "", detail: "", amount: null })];
});

const filesToPreview = computed(() => props.report?.attachedFiles?.length ? props.report.attachedFiles : props.report?.files || []);
const chunkedFiles = computed(() => {
  const files = filesToPreview.value;
  const pages = [];
  let currentPage = [], currentHeight = 0, maxHeight = 1500;
  files.forEach((f) => {
    const estHeight = isImage(f) ? 800 : 200;
    if (currentHeight + estHeight > maxHeight) { pages.push(currentPage); currentPage = [f]; currentHeight = estHeight; }
    else { currentPage.push(f); currentHeight += estHeight; }
  });
  if (currentPage.length) pages.push(currentPage);
  return pages;
});
const getFileAlias = (f) => f.aliasName || f.name || f.file_name || "첨부파일";
const isImage = (f) => (f.type?.startsWith("image/") || /\.(png|jpe?g|gif)$/i.test(f.name || f.file_name || ""));
const getFileUrl = (f) => f.file ? URL.createObjectURL(f.file) : f.file_name ? `/api/files/${f.file_name}` : "";

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

const generatePDF = async () => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pages = document.querySelectorAll(".page");
  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
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
  border: 1px solid #ccc;
  box-shadow: 0 0 10px rgba(0,0,0,0.15);
  box-sizing: border-box;
  transform-origin: top center;
}
@media (max-width: 768px) {
  .page { margin-top: 1rem !important; }
}
@media print {
  .no-print { display: none !important; }
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
table td, table th {
  height: 3rem;
  vertical-align: middle !important;
  text-align: center;
  padding: 0 10px;
}
</style>
