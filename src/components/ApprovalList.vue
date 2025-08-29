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

  <!-- 청구시작일자 -->
  <div class="flex flex-col w-1/4">
    <label class="font-bold mb-1">청구시작일자</label>
    <input type="date" v-model="filters.startDate" class="border rounded p-2 w-full" />
  </div>

  <!-- 청구종료일자 -->
  <div class="flex flex-col w-1/4">
    <label class="font-bold mb-1">청구종료일자</label>
    <input type="date" v-model="filters.endDate" class="border rounded p-2 w-full" />
  </div>
</div>


    <div class="mb-4">
      <button
        @click="fetchApprovals(1)"
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded shadow"
      >
        🔍 조회
      </button>
    </div>

    <!-- 결과 테이블 -->
    <table class="w-full border text-center text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="border p-2">부서명</th>
          <th class="border p-2">문서종류</th>
          <th class="border p-2">청구일자</th>
          <th class="border p-2">총액</th>
          <th class="border p-2">작성자</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in approvals" :key="item.id">
          <td class="border p-2">{{ item.dept_name }}</td>
          <td class="border p-2">{{ item.document_type }}</td>
          <td class="border p-2">{{ formatDate(item.request_date) }}</td>
          <td class="border p-2 text-right">₩{{ Number(item.total_amount).toLocaleString() }}</td>
          <td class="border p-2">{{ item.author }}</td>
        </tr>
        <tr v-if="approvals.length === 0">
          <td colspan="5" class="border p-4 text-gray-400">데이터가 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <!-- 페이징 -->
    <div class="flex justify-center gap-2 mt-4">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="fetchApprovals(page)"
        class="px-3 py-1 border rounded"
        :class="page === currentPage ? 'bg-blue-500 text-white' : 'bg-white'"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const approvals = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);

const filters = ref({
  deptName: "",
  documentType: "",
  startDate: "",
  endDate: "",
});

const fetchApprovals = async (page = 1) => {
  currentPage.value = page;
  try {
    const res = await axios.post("http://localhost:3001/api/approvalList", {
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
  return new Date(dateStr).toLocaleDateString("ko-KR");
};
</script>
