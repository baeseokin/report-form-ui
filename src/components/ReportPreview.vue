<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-nanum">
    <div class="bg-white rounded-2xl w-full max-w-4xl h-screen p-10 relative overflow-y-auto border-t-8 border-purple-500">
      <!-- 닫기 버튼 -->
      <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">✕</button>

      <!-- 보고서 첫번째 페이지 -->
      <div v-if="report" class="page report-content leading-relaxed" ref="reportContent">
        <h2 class="title-lg text-center mb-6 text-gray-800 mt-4">{{ report.documentType }}</h2>

        <!-- 결재 서명란 -->
        <div class="flex justify-between mb-6">
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
                <td class="border w-1/4"></td>
                <td class="border w-1/4"></td>
                <td class="border w-1/4"></td>
                <td class="border w-1/4"></td>
              </tr>
            </tbody>
          </table>

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
                <td class="border w-1/4"></td>
                <td class="border w-1/4"></td>
                <td class="border w-1/4"></td>
                <td class="border w-1/4"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 부서명 -->
        <table class="w-full border text-center mb-4">
          <tbody>
            <tr>
              <td class="border w-64 bg-blue-100 font-bold">부서명</td>
              <td class="border">{{ report.deptName }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 지출내역 -->
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
                <span v-if="item.amount">{{ item.amount.toLocaleString() }} 원</span>
              </td>
            </tr>
            <tr class="bg-blue-100 font-bold">
              <td class="border text-center" colspan="5">합 계</td>
              <td class="border text-right">{{ report.totalAmount.toLocaleString() }} 원</td>
            </tr>
          </tbody>
        </table>

        <!-- 영수 문구 -->
        <div class="mt-10 text-right text-xl leading-loose">
          위의 금액을 정히 영수합니다.<br />
          {{ formatDate(report.date) }}<br />
          영수인 성명 : {{ report.author }} (인)
        </div>
      </div>

      <!-- 첨부파일 페이지 -->
      <div v-if="filesToPreview.length > 0" class="page report-content mt-10 break-before-page">
        <h2 class="title-lg text-center mb-6 text-gray-800">📎 첨부파일</h2>
        <ul class="space-y-6">
          <li v-for="(f, idx) in filesToPreview" :key="'file-'+idx" class="space-y-2">
            <!-- 파일명 -->
            <p class="text-gray-700 font-medium">
              {{ idx + 1 }}. {{ getFileAlias(f) }}
            </p>
            <!-- 이미지 미리보기 -->
            <img
              v-if="isImage(f)"
              :src="getFileUrl(f)"
              :alt="getFileAlias(f)"
              class="border rounded-lg shadow-md max-h-[500px] mx-auto"
            />
            <!-- 이미지가 아닌 경우 안내 -->
            <p v-else class="text-sm text-gray-500 italic">
              (이미지 미리보기를 지원하지 않는 파일 형식입니다)
            </p>
          </li>
        </ul>
      </div>

      <!-- PDF & 프린터 버튼 -->
      <div class="flex justify-end gap-4 mt-6 no-print">
        <button @click="downloadPDF" class="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-lg shadow-md">📄 PDF 다운로드</button>
        <button @click="printReport" class="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white px-5 py-2 rounded-lg shadow-md">🖨️ 프린터 출력</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const props = defineProps(["report"]);
const expanded = ref(false);

// 지출내역 테이블 패딩
const paddedItems = computed(() => {
  const items = props.report?.items || [];
  if (items.length >= 8) return items;
  return items.concat(Array.from({ length: 8 - items.length }, () => ({
    gwan: "", hang: "", mok: "", semok: "", detail: "", amount: null
  })));
});

// 첨부파일 데이터
const filesToPreview = computed(() => {
  if (!props.report) return [];
  if (props.report.attachedFiles?.length > 0) return props.report.attachedFiles;
  if (props.report.files?.length > 0) return props.report.files;
  return [];
});

const getFileAlias = (f) =>
  f.aliasName || f.alias_name || f.name || f.file_name || "첨부파일";

const isImage = (f) => {
  if (!f) return false;
  const type = f.type || f.mime_type || f.mimeType || "";
  return (
    type.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif)$/i.test(f.name || f.file_name || "")
  );
};

const getFileUrl = (f) => {
  if (!f) return "";
  if (f instanceof File) return URL.createObjectURL(f);
  if (f.file) return URL.createObjectURL(f.file);

  // DB에 저장된 경우
  if (f.file_name) return `/api/files/${f.file_name}`;
  if (f.file_path) {
    // uploads/ 제거
    const filename = f.file_path.split("/").pop();
    return `/api/files/${filename}`;
  }
  return "";
};


const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// PDF 다운로드
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
  pdf.save(`${props.report.documentType}_${props.report.deptName}_${props.report.date}.pdf`);
};

// 프린트 출력
const printReport = async () => {
  const pages = document.querySelectorAll(".page");
  const imgs = [];
  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2 });
    imgs.push(canvas.toDataURL("image/png"));
  }
  const win = window.open("", "", "width=800,height=600");
  win.document.write("<html><head><title>Print</title></head><body>");
  imgs.forEach((src) => {
    win.document.write(`<img src="${src}" style="width:100%; page-break-after:always;" />`);
  });
  win.document.write("</body></html>");
  win.document.close();
};
</script>

<style>
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 10px auto;
  padding: 20mm;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 0 10px rgba(0,0,0,0.15);
  box-sizing: border-box;
}
@media print {
  .page {
    border: none;
    box-shadow: none;
    page-break-after: always;
  }
}
.report-content { font-size: 14pt; }
.title-lg { font-size: 20pt; font-weight: 800; }
.title-md { font-size: 16pt; font-weight: 700; }
table td, table th { height: 3rem; vertical-align: middle !important; text-align: center; }
</style>
