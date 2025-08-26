<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-nanum">
    <div class="bg-white rounded-2xl w-full max-w-6xl h-screen p-10 relative overflow-y-auto border-t-8 border-purple-500">
      <!-- 닫기 버튼 -->
      <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">✕</button>

      <!-- 보고서 내용 -->
      <div ref="reportContent" class="report-content leading-relaxed">
        <br /><br /><br />
        <!-- ✅ 문서 종류 반영 -->
        <h2 class="title-lg text-center mb-6 text-gray-800">{{ report.documentType }}</h2>
        <br /><br /><br />

        <!-- 결재 서명란 -->
        <div class="flex justify-between mb-6">
          <table class="w-1/3 border text-center">
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

          <table class="w-1/3 border text-center">
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

        <br /><br />

        <!-- 부서명 -->
        <table class="w-full border text-center mb-4">
          <tbody>
            <tr>
              <td class="border w-64 bg-blue-100 text-gray-800 font-bold">부서명</td>
              <td class="border bg-white text-black">{{ report.deptName }}</td>
            </tr>
          </tbody>
        </table>

        <br />

        <!-- 지출내역 -->
        <h3 class="title-md flex items-center mb-4">
          💸 <span class="ml-2">지출내역</span>
        </h3>
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
              <td class="border">{{ item.gwan || '' }}</td>
              <td class="border">{{ item.hang || '' }}</td>
              <td class="border">{{ item.mok || '' }}</td>
              <td class="border">{{ item.semok || '' }}</td>
              <td class="border">{{ item.detail || '' }}</td>
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

        <br />

        <!-- 코멘트 -->
        <h3 class="title-md flex items-center mb-2">
          📝 <span class="ml-2">Comment</span>
        </h3>
        <table v-if="report.comment" class="w-full border text-left mb-6 table-fixed">
          <thead class="bg-gray-100">
            <tr>
              <th class="border w-[10%]">구분</th>
              <th class="border w-[20%]">성명</th>
              <th class="border w-[20%]">입력시간</th>
              <th class="border w-[50%]">Comment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border">기안</td>
              <td class="border">{{ report.author }}</td>
              <td class="border">
                {{ new Date(report.date).toLocaleString("ko-KR", { hour12: false }) }}
              </td>
              <td class="border">
                <span v-if="report.comment.length <= 100">{{ report.comment }}</span>
                <span v-else>
                  {{ expanded ? report.comment : report.comment.substring(0, 100) + '...' }}
                  <button @click="expanded = !expanded" class="text-blue-500 text-xs ml-2">
                    {{ expanded ? '접기' : '더보기' }}
                  </button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        <!-- 영수 문구 -->
        <div class="mt-10 text-right text-xl leading-loose">
          위의 금액을 정히 영수합니다.<br />
          {{ report.date }}<br />
          영수인 성명 : {{ report.author }} (인)
        </div>
      </div>

      <br />

      <!-- PDF & 프린터 버튼 -->
      <div class="flex justify-end gap-4 mt-6 no-print">
        <button
          @click="downloadPDF"
          class="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-5 py-2 rounded-lg shadow-md transition"
        >
          📄 PDF 다운로드
        </button>
        <button
          @click="printReport"
          class="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white px-5 py-2 rounded-lg shadow-md transition"
        >
          🖨️ 프린터 출력
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const props = defineProps(["report"]);
const reportContent = ref(null);
const expanded = ref(false);

/* ✅ 최소 10행 보장 */
const paddedItems = computed(() => {
  const items = props.report.items || [];
  if (items.length >= 8) return items;
  const emptyRows = Array.from({ length: 8 - items.length }, () => ({
    gwan: "",
    hang: "",
    mok: "",
    semok: "",
    detail: "",
    amount: null,
  }));
  return items.concat(emptyRows);
});

/* ✅ PDF 다운로드 (파일명 규칙 반영) */
const downloadPDF = async () => {
  const content = reportContent.value;
  const canvas = await html2canvas(content, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const marginLeft = 10;
  const marginTop = 15;
  const marginRight = 10;
  const marginBottom = 15;

  const usableWidth = pdfWidth - marginLeft - marginRight;
  const usableHeight = pdfHeight - marginTop - marginBottom;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = marginTop;

  pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight);
  heightLeft -= usableHeight;

  while (heightLeft > 0) {
    position = marginTop - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight);
    heightLeft -= usableHeight;
  }

  /* ✅ 파일명 규칙: 문서종류_부서명_작성일자.pdf */
  const fileName = `${props.report.documentType}_${props.report.deptName}_${props.report.date}.pdf`;
  pdf.save(fileName);
};

/* ✅ 프린트 */
const printReport = async () => {
  const content = reportContent.value;
  const canvas = await html2canvas(content, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const win = window.open("", "", "width=800,height=600");
  win.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { margin: 0; text-align: center; }
          img { width: 100%; }
        </style>
      </head>
      <body>
        <img id="printImage" src="${imgData}" />
        <script>
          const img = document.getElementById('printImage');
          img.onload = function() {
            window.print();
            window.close();
          };
        <\/script>
      </body>
    </html>
  `);
  win.document.close();
};
</script>

<style>
.no-print { display: block; }
@media print { .no-print { display: none !important; } }

/* ✅ 본문 폰트 사이즈 */
.report-content {
  font-size: 14pt !important;
}

/* ✅ 제목 스타일 */
.title-lg {
  font-size: 20pt !important;
  font-weight: 800;
}
.title-md {
  font-size: 16pt !important;
  font-weight: 700;
}

/* ✅ 세로 중앙정렬 */
table td, table th {
  height: 3rem;
  vertical-align: middle !important;
  text-align: center;
}
</style>
