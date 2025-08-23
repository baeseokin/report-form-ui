<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl w-11/12 max-w-5xl p-10 relative overflow-y-auto max-h-[95vh] border-t-8 border-purple-500">
      <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">✕</button>
      <div ref="reportContent" class="text-sm leading-relaxed">
        <h2 class="text-3xl font-extrabold text-center mb-6 text-gray-800">청 구 지 출 결 의 서</h2>

        <!-- 좌우 결재 서명란 -->
        <div class="flex justify-between mb-6">
          <table class="border text-center w-1/3">
            <thead class="bg-purple-100 text-gray-700">
              <tr>
                <th class="border p-2">담당</th>
                <th class="border p-2">부장</th>
                <th class="border p-2">위원장</th>
                <th class="border p-2">당회장</th>
              </tr>
            </thead>
            <tbody>
              <tr class="h-16">
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
              </tr>
            </tbody>
          </table>

          <table class="border text-center w-1/3">
            <thead class="bg-purple-100 text-gray-700">
              <tr>
                <th class="border p-2">담당</th>
                <th class="border p-2">부장</th>
                <th class="border p-2">위원장</th>
                <th class="border p-2">당회장</th>
              </tr>
            </thead>
            <tbody>
              <tr class="h-16">
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
                <td class="border"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 부서명 테이블 -->
        <table class="w-full border mb-2 text-sm text-center">
          <thead class="bg-blue-100 text-gray-800">
            <tr>
              <th class="border p-2 w-48">부서명</th>
              <td class="border p-2 font-bold bg-white text-black" colspan="5">{{ report.deptName }}</td>
            </tr>
          </thead>
        </table>

        <!-- 지출내역 레이블 -->
        <h3 class="font-bold mb-2 mt-6">💸 지출내역</h3>

        <!-- 지출내역 테이블 -->
        <table class="w-full border my-4 text-sm text-center">
          <thead class="bg-blue-100 text-gray-800">
            <tr>
              <th class="border p-2">관</th>
              <th class="border p-2">항</th>
              <th class="border p-2">목</th>
              <th class="border p-2">세목</th>
              <th class="border p-2">지출내역</th>
              <th class="border p-2">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in report.items" :key="idx">
              <td class="border p-2">{{ item.gwan }}</td>
              <td class="border p-2">{{ item.hang }}</td>
              <td class="border p-2">{{ item.mok }}</td>
              <td class="border p-2">{{ item.semok }}</td>
              <td class="border p-2">{{ item.detail }}</td>
              <td class="border p-2 text-right">{{ item.amount.toLocaleString() }} 원</td>
            </tr>
            <tr class="bg-blue-100 font-bold">
              <td class="border p-2 text-center" colspan="5">합 계</td>
              <td class="border p-2 text-right">{{ report.totalAmount.toLocaleString() }} 원</td>
            </tr>
          </tbody>
        </table>

        <!-- 코멘트 테이블 -->
        <div v-if="report.comment" class="mt-6">
          <h3 class="font-bold mb-2">📌 Comment</h3>
          <table class="w-full border text-sm text-center">
            <thead class="bg-gray-200 text-gray-800">
              <tr>
                <th class="border p-2 w-20">구분</th>
                <th class="border p-2 w-28">성명</th>
                <th class="border p-2 w-40">입력시간</th>
                <th class="border p-2">Comment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border p-2">기안</td>
                <td class="border p-2">{{ report.author }}</td>
                <td class="border p-2">{{ formattedDate }}</td>
                <td class="border p-2 text-left">
                  <span v-if="!expanded" @click="expanded = true" class="cursor-pointer">
                    {{ truncatedComment }}
                  </span>
                  <span v-else @click="expanded = false" class="cursor-pointer whitespace-pre-line">
                    {{ report.comment }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 영수 문구 (작게) -->
        <div class="mt-10 text-right text-gray-800 leading-relaxed text-sm">
          <p>위의 금액을 정히 영수합니다.</p>
          <p class="mt-4">{{ report.date }}</p>
          <p class="mt-6">영수인 성명 : {{ report.author }} (인)</p>
        </div>
      </div>

      <!-- PDF/프린터 버튼 -->
      <div class="flex justify-end gap-4 mt-6 no-print">
        <button @click="downloadPDF" class="bg-red-500 text-white px-5 py-2 rounded-lg">📄 PDF 다운로드</button>
        <button @click="printReport" class="bg-gray-700 text-white px-5 py-2 rounded-lg">🖨️ 프린터 출력</button>
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

const truncatedComment = computed(() => {
  if (!props.report.comment) return "";
  return props.report.comment.length > 100
    ? props.report.comment.slice(0, 100) + "..."
    : props.report.comment;
});

// 현재 시간 (입력시간 표시용)
const formattedDate = new Date().toLocaleString("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
}).replace(/\./g, "-").replace(" ", "").trim();

const downloadPDF = async () => {
  const canvas = await html2canvas(reportContent.value);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("report.pdf");
};
const printReport = () => {
  const win = window.open("", "", "width=800,height=600");
  win.document.write(`<html><head><title>Print</title></head><body>${reportContent.value.innerHTML}</body></html>`);
  win.document.close(); win.focus(); win.print(); win.close();
};
</script>
