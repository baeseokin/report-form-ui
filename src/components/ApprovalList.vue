<template>
  <div class="p-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800 mb-4">📑 청구목록 조회</h2>

    <!-- 검색 조건 -->
    <div class="flex gap-4 mb-4 items-center">
      <!-- 부서명 -->
      <div class="flex flex-col w-1/4">
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
      <div class="flex flex-col w-1/4">
        <label class="font-bold mb-1">문서종류</label>
        <select v-model="filters.documentType" class="border rounded p-2 w-full">
          <option value="">전체</option>
          <option value="청구지출결의서">청구지출결의서</option>
          <option value="정산지출결의서">정산지출결의서</option>
          <option value="가불지출결의서">가불지출결의서</option>
        </select>
      </div>

      <!-- 청구 시작일자 -->
      <div class="flex flex-col w-1/4">
        <label class="font-bold mb-1">청구 시작일자</label>
        <input type="date" v-model="filters.startDate" class="border rounded p-2 w-full" />
      </div>

      <!-- 청구 종료일자 -->
      <div class="flex flex-col w-1/4">
        <label class="font-bold mb-1">청구 종료일자</label>
        <input type="date" v-model="filters.endDate" class="border rounded p-2 w-full" />
      </div>
    </div>

    <!-- 조회 버튼 -->
    <div class="mb-4">
      <button
        @click="fetchApprovals(1)"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        조회
      </button>
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
            <td class="border p-2 text-right">{{ a.total_amount.toLocaleString() }}</td>
            <td class="border p-2">
              <button
                @click="openPreview(a.id)"
                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
              >
                상세보기
              </button>
              <button
                @click="goToReport(a.id)"
                class="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
              >
                보고서작성
              </button>
            </td>
          </tr>
          <tr v-if="approvals.length === 0">
            <td colspan="8" class="text-center p-4">데이터가 없습니다.</td>
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

const openPreview = async (id) => {
  try {
    const res = await axios.get(`/api/approval/${id}`);
    previewReport.value = {
      ...res.data,
      attachedFiles: res.data.attachedFiles || [],
    };
  } catch (err) {
    console.error("상세조회 실패:", err);
  }
};

const goToReport = (id) => {
  router.push({ name: "ReportForm", params: { id } });
};
</script>
