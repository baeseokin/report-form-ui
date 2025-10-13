<template>
  <div class="p-6 font-nanum">
    <h2 class="text-2xl font-bold text-purple-700 mb-6">📑 내 결재목록 조회</h2>

    <!-- ✅ 검색조건 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner mb-6 flex flex-wrap gap-6 items-end">
      <!-- 요청기간 -->
      <div class="flex flex-col">
        <label class="font-semibold text-gray-800 mb-1">청구기간</label>
        <div class="flex space-x-4">
          <label v-for="m in [1,3,6,12]" :key="m" class="flex items-center space-x-1">
            <input
              type="radio"
              name="months"
              :value="m"
              v-model="search.months"
              @change="updateDateRange"
            />
            <span class="text-gray-700">{{ m }}개월</span>
          </label>
        </div>
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="page=1; searchList()"
          class="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
        >
          조회
        </button>
      </div>
    </div>

    <!-- ✅ 결과 테이블 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-700">
            <th class="border p-3">부서</th>
            <th class="border p-3">문서종류</th>
            <th class="border p-3">작성자</th>
            <th class="border p-3">요청일</th>
            <th class="border p-3">금액</th>
            <th class="border p-3">상세</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="hover:bg-purple-50 transition">
            <td class="border p-3 text-center">{{ row.dept_name }}</td>
            <td class="border p-3 text-center">{{ row.document_type }}</td>
            <td class="border p-3 text-center">{{ row.author }}</td>
            <td class="border p-3 text-center">{{ formatDate(row.request_date) }}</td>
            <td class="border p-3 text-right">{{ Math.floor(row.total_amount).toLocaleString() }}</td>
            <td class="border p-3 text-center">
              <button
                @click="openDetail(row)"
                class="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                보기
              </button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="6" class="text-center p-6 text-gray-500">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ✅ 페이지네이션 -->
    <div class="mt-6 flex justify-center space-x-2">
      <button
        v-for="p in totalPages"
        :key="p"
        @click="page=p; searchList()"
        :class="[
          'px-4 py-1 rounded-lg transition',
          page===p ? 'bg-purple-600 text-white' : 'bg-white border hover:bg-gray-100'
        ]"
      >
        {{ p }}
      </button>
    </div>

    <!-- ✅ 상세보기 모달 -->
    <ReportPreview
      v-if="previewReport"
      :report="previewReport"
      @close="previewReport = null"
      @refreshList="searchList"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
//import ReportPreview from "@/components/ReportPreview.vue";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import('@/components/ReportPreview.vue'));
import { useUserStore } from "@/store/userStore";

const rows = ref([]);
const page = ref(1);
const totalPages = ref(1);
const previewReport = ref(null);

const userStore = useUserStore();
const userDeptName = userStore.user?.deptName || "";
const search = reactive({
  months: 1,
  deptName: userDeptName,
  status: userDeptName === "재정부" ? "결재완료" : "결재진행중",
  approverUserId: userStore.user?.userId || "",
  startDate: "",
  endDate: "",
});

const updateDateRange = () => {
  const now = new Date();
  const months = search.months;
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  search.startDate = start.toISOString().split("T")[0];
  search.endDate = end.toISOString().split("T")[0];
};

const searchList = async () => {
  const res = await fetch("/api/approvalList", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ...search,
      page: page.value,
      pageSize: 10,
    }),
  });
  const data = await res.json();
  if (data.success) {
    rows.value = data.rows;
    totalPages.value = data.totalPages;
  }
};

const openDetail = async (row) => {
  const res = await fetch(`/api/approval/detail/${row.id}`, {
    credentials: "include",
  });
  const data = await res.json();

  previewReport.value = {
    id: data.id,
    documentType: data.document_type,
    deptName: data.dept_name,
    author: data.author,
    date: data.request_date,
    totalAmount: data.total_amount,
    comment: data.comment,
    aliasName: data.aliasName,
    items: data.items || [],
    attachedFiles: data.attachedFiles || [],
    approvalHistory: data.approvalHistory || [] 
  };
};

const formatDate = (d) => new Date(d).toLocaleDateString("ko-KR");

onMounted(() => {
  updateDateRange();
  searchList();
});
</script>
