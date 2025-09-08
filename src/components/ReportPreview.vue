<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-nanum">
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
        class="page report-content leading-relaxed"
        ref="reportContent"
        :style="pageStyle"
      >
        <h2 class="title-lg text-center mb-6 text-gray-800 mt-4">{{ report.documentType }}</h2>

        <!-- ✅ 결재 서명란 -->
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
                  class="border cursor-pointer relative"
                  @click="openApproval(role)"
                >
                  <!-- ✅ 서명 이미지 -->
                  <div class="flex flex-col items-center justify-center">
                    <img
                      v-if="getSignature(role)"
                      :src="getSignatureUrl(role)"
                      class="w-20 h-20 object-contain rounded"
                    />
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
      <div class="flex justify-end gap-4 mt-6 mb-10 pr-6 no-print">
        <button @click="downloadPDF" class="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-lg shadow-md">📄 PDF 다운로드</button>
        <button @click="printReport" class="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white px-5 py-2 rounded-lg shadow-md">🖨️ 프린터 출력</button>
      </div>
    </div>

    <!-- ✅ 결재 팝업 -->
    <ApprovalPopup v-if="showPopup" :report="report" @close="closePopup" @approved="handleApproved" />

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
    scaleValue.value = screenWidth / pageWidth; // 화면에 맞춰 축소
  }
});

// (기존 승인/반려 로직, PDF/프린트 함수, 데이터 포맷터 등은 그대로 유지)
const approverRoles = ["회계", "부장", "위원장", "당회장"];
const showPopup = ref(false);
const showModal = ref(false);
const approvalHistory = ref(props.report?.approvalHistory || []);
const visibleCommentRole = ref(null);
const selectedRole = ref(null);

const openApproval = (role) => { selectedRole.value = role; showPopup.value = true; };
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
const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString("ko-KR", { hour12: false }) : "";

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

const downloadPDF = async () => {
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
  pdf.save(`${props.report.documentType}_${userDept.value}_${props.report.date}.pdf`);
};
const printReport = async () => {
  const pages = document.querySelectorAll(".page");
  const imgs = [];
  for (let p of pages) {
    const canvas = await html2canvas(p, { scale: 2 });
    imgs.push(canvas.toDataURL("image/png"));
  }
  const win = window.open("", "", "width=800,height=600");
  win.document.write("<html><head><title>Print</title></head><body>");
  imgs.forEach(src => win.document.write(`<img src="${src}" style="width:100%; page-break-after:always;" />`));
  win.document.write("</body></html>");
  win.document.close();
};
</script>

<style>
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 10px auto;
  padding: 10mm;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 0 10px rgba(0,0,0,0.15);
  box-sizing: border-box;
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
