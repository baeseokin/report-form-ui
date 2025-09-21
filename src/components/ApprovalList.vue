<template>
  <div class="p-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800 mb-4">📑 청구목록 조회</h2>

    <!-- ✅ 검색조건 -->
    <div class="flex flex-wrap gap-4 mb-6 items-end">
      <!-- 부서명 -->
      <div class="flex flex-col w-40">
        <label class="font-bold mb-1">부서명</label>
        <input
          type="text"
          v-model="filters.deptName"
          placeholder="부서명 입력"
          class="border rounded p-2 w-full"
          readonly
        />
      </div>

      <!-- 문서종류 -->
      <div class="flex flex-col w-35">
        <label class="font-bold mb-1">문서종류</label>
        <select v-model="filters.documentType" class="border rounded p-2 w-full">
          <option value="">전체</option>
          <option value="청구지출결의서">청구지출결의서</option>
          <option value="정산지출결의서">정산지출결의서</option>
          <option value="가불지출결의서">가불지출결의서</option>
        </select>
      </div>

      <!-- 진행상태 -->
     <div class="flex flex-col w-32">
       <label class="font-bold mb-1">진행상태</label>
       <select v-model="filters.status" class="border rounded p-2 w-full">
         <option value="">전체</option>
         <option value="완료">완료</option>
         <option value="반려">반려</option>
         <option value="진행중">진행중</option>
       </select>
     </div>

      <!-- 청구 시작일자 -->
      <div class="flex flex-col w-30">
        <label class="font-bold mb-1">청구 시작일자</label>
        <input type="date" v-model="filters.startDate" class="border rounded p-2 w-full" />
      </div>

      <!-- 청구 종료일자 -->
      <div class="flex flex-col w-30">
        <label class="font-bold mb-1">청구 종료일자</label>
        <input type="date" v-model="filters.endDate" class="border rounded p-2 w-full" />
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="fetchApprovals(1)"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          조회
        </button>
      </div>
    </div>

    <!-- 결과 목록 -->
    <div>
      <table class="w-full border text-sm">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="border p-2">문서종류</th>
            <th class="border p-2">부서명</th>
            <th class="border p-2">작성자</th>
            <th class="border p-2">청구요청 별칭</th>
            <th class="border p-2">청구일자</th>
            <th class="border p-2">총액</th>
            <!-- 🔹 추가된 컬럼 -->
            <th class="border p-2">진행상태</th>
            <th class="border p-2">상세</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in approvals" :key="a.id" class="hover:bg-gray-50">
            <td class="border p-2">{{ a.document_type }}</td>
            <td class="border p-2">{{ a.dept_name }}</td>
            <td class="border p-2">{{ a.author }}</td>
            <td class="border p-2">{{ a.aliasName }}</td>
            <td class="border p-2">{{ formatDate(a.request_date) }}</td>
            <td class="border p-2 text-right">{{ formatAmount(a.total_amount) }}</td>
            <!-- 🔹 진행상태 -->
            <td class="border p-2">{{ a.status }}</td>
            <!-- 🔹 다음 결재자 -->
            <td class="border p-2 flex justify-center space-x-2">
              <!-- 상세보기 버튼 (돋보기 아이콘) -->
              <button
                @click="openPreview(a.id)"
                class="p-2 rounded hover:bg-green-100"
                title="상세보기"
              >
                <img src="/icons/view.svg" alt="상세보기" class="w-6 h-6" />
              </button>

              <!-- 보고서작성 버튼 (연필 아이콘) -->
              <button
                @click="goToReport(a.id)"
                class="p-2 rounded hover:bg-purple-100"
                title="보고서작성"
              >
                <img src="/icons/report.svg" alt="보고서작성" class="w-6 h-6" />
              </button>
            </td>
          </tr>
          <tr v-if="approvals.length === 0">
            <td colspan="10" class="text-center p-4">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div class="flex justify-center mt-4 space-x-2">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="fetchApprovals(page)"
        :class="[
          'px-3 py-1 border rounded',
          currentPage === page ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
        ]"
      >
        {{ page }}
      </button>
    </div>

    <!-- 상세보기 모달 -->
    <ReportPreview
      v-if="previewReport"
      :report="previewReport"
      @close="previewReport = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import ReportPreview from "./ReportPreview.vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";

const router = useRouter();
const { user } = storeToRefs(useUserStore());

const approvals = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const previewReport = ref(null);

const today = new Date();
const year = today.getFullYear();
const startOfYear = new Date(year, 0, 1);

const formatDateValue = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ✅ 로그인 사용자의 deptName 자동 세팅
const filters = ref({
  deptName: "",
  documentType: "",
  startDate: formatDateValue(startOfYear),
  endDate: formatDateValue(today),
  status: "",
});

onMounted(() => {
  if (user.value?.deptName) {
    filters.value.deptName = user.value.deptName;
    fetchApprovals(1);
  }
});

const fetchApprovals = async (page = 1) => {
  currentPage.value = page;
  try {
    const res = await axios.post("/api/approvalList", {
      ...filters.value,
      page,
      pageSize: 10,
    });
    approvals.value = res.data.rows;
    totalPages.value = res.data.totalPages;
  } catch (err) {
    console.error(err);
    approvals.value = [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const formatAmount = (val) => {
  if (val === null || val === undefined) return "";
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Number.isInteger(num)) {
    return num.toLocaleString("ko-KR");
  }
  return num.toLocaleString("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const openPreview = async (id) => {
  try {
    const res = await axios.get(`/api/approval/detail/${id}`);
    const report = {
      id: res.data.id,
      documentType: res.data.document_type,
      deptName: res.data.dept_name,
      author: res.data.author,
      date: res.data.request_date,
      totalAmount: res.data.total_amount,
      comment: res.data.comment,
      aliasName: res.data.aliasName,
      items: res.data.items || [],
      attachedFiles: res.data.attachedFiles || [],
      approvalHistory: res.data.approvalHistory || []  
    };
    previewReport.value = report;
  } catch (err) {
    console.error("상세조회 실패:", err);
  }
};

const goToReport = (id) => {
  router.push({ name: "ReportForm", params: { id } });
};
</script>
