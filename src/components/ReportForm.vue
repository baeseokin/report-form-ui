<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center p-10">
    <!-- 탭 메뉴 -->
    <div class="w-full max-w-6xl bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
      <div class="flex border-b mb-6">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="flex-1 py-3 text-center font-semibold transition"
          :class="activeTab === tab ? 'border-b-4 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab }}
        </button>
      </div>

      <!-- 탭 1: 기본정보 -->
      <div v-if="activeTab === '기본정보'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-800">📌 기본 정보 입력</h2>
        <div class="grid grid-cols-3 gap-4">
          <select v-model="selectedDept" class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400">
            <option disabled value="">부서명 선택</option>
            <option v-for="(data, dept) in deptData" :key="dept" :value="dept">{{ dept }}</option>
          </select>
          <input type="text" v-model="author" placeholder="작성자" class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400" />
          <input type="date" v-model="date" class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400" />
        </div>

        <div class="flex justify-end mt-6">
          <button @click="goNextTab" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition">
            다음 →
          </button>
        </div>
      </div>

      <!-- 탭 2: 지출내역 -->
      <div v-if="activeTab === '지출내역'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-800">💸 지출내역 입력</h2>
        <table class="w-full border text-sm bg-white rounded-lg overflow-hidden mt-3">
          <thead>
            <tr class="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800">
              <th class="border p-3">선택</th>
              <th class="border p-3">관</th>
              <th class="border p-3">항</th>
              <th class="border p-3">목</th>
              <th class="border p-3">세목</th>
              <th class="border p-3">지출내역</th>
              <th class="border p-3">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in items" :key="idx" class="hover:bg-blue-50 transition-colors duration-200">
              <td class="border p-2 text-center"><input type="checkbox" v-model="item.selected" /></td>

              <!-- 관 -->
              <td class="border p-2">
                <template v-if="getGwans.length">
                  <select v-model="item.gwan" @change="resetLower(item, 'gwan')" class="w-full p-2 border rounded">
                    <option disabled value="">선택</option>
                    <option v-for="g in getGwans" :key="g">{{ g }}</option>
                  </select>
                </template>
                <template v-else>
                  <input v-model="item.gwan" class="w-full p-2 border rounded" placeholder="관 입력" />
                </template>
              </td>

              <!-- 항 -->
              <td class="border p-2">
                <template v-if="getHangs(item).length">
                  <select v-model="item.hang" @change="resetLower(item, 'hang')" class="w-full p-2 border rounded">
                    <option disabled value="">선택</option>
                    <option v-for="h in getHangs(item)" :key="h">{{ h }}</option>
                  </select>
                </template>
                <template v-else>
                  <input v-model="item.hang" class="w-full p-2 border rounded" placeholder="항 입력" />
                </template>
              </td>

              <!-- 목 -->
              <td class="border p-2">
                <template v-if="getMoks(item).length">
                  <select v-model="item.mok" @change="resetLower(item, 'mok')" class="w-full p-2 border rounded">
                    <option disabled value="">선택</option>
                    <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
                  </select>
                </template>
                <template v-else>
                  <input v-model="item.mok" class="w-full p-2 border rounded" placeholder="목 입력" />
                </template>
              </td>

              <!-- 세목 -->
              <td class="border p-2">
                <template v-if="getSemoks(item).length">
                  <select v-model="item.semok" @change="resetLower(item, 'semok')" class="w-full p-2 border rounded">
                    <option disabled value="">선택</option>
                    <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
                  </select>
                </template>
                <template v-else>
                  <input v-model="item.semok" class="w-full p-2 border rounded" placeholder="세목 입력" />
                </template>
              </td>

              <!-- 지출내역 -->
              <td class="border p-2">
                <template v-if="getDetails(item).length">
                  <select v-model="item.detail" class="w-full p-2 border rounded">
                    <option disabled value="">선택</option>
                    <option v-for="d in getDetails(item)" :key="d">{{ d }}</option>
                  </select>
                </template>
                <template v-else>
                  <input v-model="item.detail" class="w-full p-2 border rounded" placeholder="지출내역 입력" />
                </template>
              </td>

              <!-- 금액 -->
              <td class="border p-2 text-right">
                <input type="text" :value="formatCurrency(item.amount)" @input="updateAmount($event, idx)" class="w-full p-2 text-right rounded border" />
              </td>
            </tr>
            <tr class="bg-purple-50 font-bold">
              <td class="border p-3 text-center" colspan="6">합계</td>
              <td class="border p-3 text-right">{{ totalAmount.toLocaleString() }} 원</td>
            </tr>
          </tbody>
        </table>

        <div class="flex justify-between mt-6 gap-3">
          <div>
            <button @click="addItem" class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow-md transition">＋ 행 추가</button>
            <button @click="deleteItems" class="ml-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow-md transition">－ 행 삭제</button>
          </div>
          <div class="flex gap-3">
            <button @click="goPrevTab" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition">← 이전</button>
            <button @click="goNextTab" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition">다음 →</button>
          </div>
        </div>
      </div>

      <!-- 탭 3: 최종 확인 -->
      <div v-if="activeTab === '최종 확인'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>

        <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
          <p><strong>부서명:</strong> {{ selectedDept }}</p>
          <p><strong>작성자:</strong> {{ author }}</p>
          <p><strong>제출일자:</strong> {{ date }}</p>
          <p><strong>청구총액:</strong> {{ toKoreanAmount(totalAmount) }}원 (₩{{ totalAmount.toLocaleString() }})</p>
        </div>

        <h2 class="text-xl font-bold text-gray-800">📄 추가 의견</h2>
        <div>
          <textarea v-model="comment" rows="4" maxlength="500"
            placeholder="여기에 코멘트를 입력하세요..."
            class="w-full border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-purple-400 resize-y"></textarea>
          <div class="flex justify-between mt-1 text-sm text-gray-500">
            <span>최대 500자까지 입력 가능합니다.</span>
            <span>{{ comment.length }}/500</span>
          </div>
        </div>

        <div class="flex justify-between">
          <button @click="goPrevTab" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition">← 이전</button>
          <button @click="generateReport" class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition">
            ✅ 보고서 생성
          </button>
        </div>
      </div>
    </div>

    <!-- 팝업 (보고서 미리보기) -->
    <div v-if="report" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl w-11/12 max-w-5xl p-10 relative overflow-y-auto max-h-[95vh] border-t-8 border-purple-500">
        <button @click="closeReport" class="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">✕</button>

        <div ref="reportContent" class="text-sm leading-relaxed">
          <h2 class="text-3xl font-extrabold text-center mb-6 text-gray-800">청 구 지 출 결 의 서</h2>

          <!-- 좌우 결재 서명란 -->
          <div class="flex justify-between mb-6">
            <table class="border text-center shadow-sm w-1/3">
              <thead class="bg-purple-100 text-gray-700">
                <tr>
                  <th class="border p-2 w-1/4">담당</th>
                  <th class="border p-2 w-1/4">부장</th>
                  <th class="border p-2 w-1/4">위원장</th>
                  <th class="border p-2 w-1/4">당회장</th>
                </tr>
              </thead>
              <tbody>
                <tr class="h-16"><td class="border"></td><td class="border"></td><td class="border"></td><td class="border"></td></tr>
                <tr class="h-16"><td class="border"></td><td class="border"></td><td class="border"></td><td class="border"></td></tr>
              </tbody>
            </table>

            <table class="border text-center shadow-sm w-1/3">
              <thead class="bg-purple-100 text-gray-700">
                <tr>
                  <th class="border p-2 w-1/4">담당</th>
                  <th class="border p-2 w-1/4">부장</th>
                  <th class="border p-2 w-1/4">위원장</th>
                  <th class="border p-2 w-1/4">당회장</th>
                </tr>
              </thead>
              <tbody>
                <tr class="h-16"><td class="border"></td><td class="border"></td><td class="border"></td><td class="border"></td></tr>
                <tr class="h-16"><td class="border"></td><td class="border"></td><td class="border"></td><td class="border"></td></tr>
              </tbody>
            </table>
          </div>

          <!-- 부서명 -->
          <div class="text-center font-bold text-lg mb-3 text-purple-700">{{ report.deptName }}</div>

          <!-- 지출내역 -->
          <table class="w-full border my-4 text-sm text-center shadow-md">
            <thead class="bg-blue-100 text-gray-800">
              <tr><th class="border p-2">관</th><th class="border p-2">항</th><th class="border p-2">목</th><th class="border p-2">세목</th><th class="border p-2">지출내역</th><th class="border p-2">금액</th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in report.items" :key="idx" class="hover:bg-gray-50">
                <td class="border p-2">{{ item.gwan }}</td>
                <td class="border p-2">{{ item.hang }}</td>
                <td class="border p-2">{{ item.mok }}</td>
                <td class="border p-2">{{ item.semok }}</td>
                <td class="border p-2">{{ item.detail }}</td>
                <td class="border p-2 text-right">{{ item.amount.toLocaleString() }} 원</td>
              </tr>
              <tr class="bg-purple-50 font-bold">
                <td class="border p-2 text-center" colspan="5">합 계</td>
                <td class="border p-2 text-right">{{ report.totalAmount.toLocaleString() }} 원</td>
              </tr>
            </tbody>
          </table>

          <!-- 코멘트 -->
          <div v-if="report.comment" class="mt-6 p-4 border rounded-lg bg-gray-50 text-gray-700">
            <strong>📌 코멘트:</strong>
            <p class="whitespace-pre-line mt-2">{{ report.comment }}</p>
          </div>

          <!-- 영수 문구 -->
          <div class="mt-10 text-right text-gray-800 leading-relaxed text-2xl">
            <p>위의 금액을 정히 영수합니다.</p>
            <p class="mt-4">{{ report.date }}</p>
            <p class="mt-6">영수인 성명 : {{ report.author }} (인)</p>
          </div>
        </div>

        <!-- PDF & 프린터 버튼 -->
        <div class="flex justify-end gap-4 mt-6 no-print">
          <button @click="downloadPDF" class="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-5 py-2 rounded-lg shadow-md transition">
            📄 PDF 다운로드
          </button>
          <button @click="printReport" class="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white px-5 py-2 rounded-lg shadow-md transition">
            🖨️ 프린터 출력
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const tabs = ["기본정보", "지출내역", "최종 확인"];
const activeTab = ref("기본정보");

const selectedDept = ref("");
const author = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const deptData = ref({});
const items = ref([
  { selected: true, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 }
]);
const comment = ref("");

const report = ref(null);
const reportContent = ref(null);

onMounted(async () => {
  const res = await fetch("/deptData.json");
  deptData.value = await res.json();
});

const goNextTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx < tabs.length - 1) activeTab.value = tabs[idx + 1];
};
const goPrevTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx > 0) activeTab.value = tabs[idx - 1];
};

const getGwans = computed(() =>
  selectedDept.value ? Object.keys(deptData.value[selectedDept.value] || {}) : []
);

const getHangs = (item) =>
  item.gwan && deptData.value[selectedDept.value]?.[item.gwan]
    ? Object.keys(deptData.value[selectedDept.value][item.gwan] || {})
    : [];

const getMoks = (item) =>
  item.hang && deptData.value[selectedDept.value]?.[item.gwan]?.[item.hang]
    ? Object.keys(deptData.value[selectedDept.value][item.gwan][item.hang] || {})
    : [];

const getSemoks = (item) =>
  item.mok && deptData.value[selectedDept.value]?.[item.gwan]?.[item.hang]?.[item.mok]
    ? Object.keys(deptData.value[selectedDept.value][item.gwan][item.hang][item.mok] || {})
    : [];

const getDetails = (item) =>
  item.semok && deptData.value[selectedDept.value]?.[item.gwan]?.[item.hang]?.[item.mok]?.[item.semok]
    ? deptData.value[selectedDept.value][item.gwan][item.hang][item.mok][item.semok] || []
    : [];

const resetLower = (item, level) => {
  if (level === "gwan") item.hang = item.mok = item.semok = item.detail = "";
  else if (level === "hang") item.mok = item.semok = item.detail = "";
  else if (level === "mok") item.semok = item.detail = "";
  else if (level === "semok") item.detail = "";
};

const totalAmount = computed(() => items.value.reduce((sum, i) => sum + (i.amount || 0), 0));

const addItem = () => items.value.push({ selected: false, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 });
const deleteItems = () => (items.value = items.value.filter((i) => !i.selected));

const formatCurrency = (value) => (value ? Number(value).toLocaleString() : "");
const updateAmount = (event, idx) => {
  const rawValue = event.target.value.replace(/[^0-9]/g, "");
  items.value[idx].amount = rawValue ? parseInt(rawValue, 10) : 0;
  event.target.value = formatCurrency(items.value[idx].amount);
};

const toKoreanAmount = (num) => {
  if (num === 0) return "영";
  const units = ["", "만", "억", "조"];
  const nums = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const small = ["", "십", "백", "천"];
  let res = "", unitIndex = 0;
  while (num > 0) {
    let part = num % 10000, partRes = "", digitIndex = 0;
    while (part > 0) {
      const d = part % 10;
      if (d > 0) partRes = nums[d] + small[digitIndex] + partRes;
      part = Math.floor(part / 10); digitIndex++;
    }
    if (partRes) res = partRes + units[unitIndex] + res;
    num = Math.floor(num / 10000); unitIndex++;
  }
  return res;
};

const generateReport = () => {
  report.value = {
    deptName: selectedDept.value,
    author: author.value,
    date: date.value,
    totalAmount: totalAmount.value,
    items: JSON.parse(JSON.stringify(items.value)),
    comment: comment.value
  };
};
const closeReport = () => (report.value = null);

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

<style>
.no-print { display: block; }
@media print { .no-print { display: none !important; } }
</style>
