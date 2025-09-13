<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">내결재목록 조회</h2>

    <!-- ✅ 검색조건 + 조회 버튼 한 줄 -->
    <div class="mb-6 flex flex-wrap gap-4 items-end">
      <!-- 요청기간 -->
      <div class="flex flex-col">
        <label class="block font-medium mb-1">요청기간</label>
        <div class="flex space-x-2">
          <label v-for="m in [1,3,6,12]" :key="m" class="flex items-center space-x-1">
            <input
              type="radio"
              name="months"
              :value="m"
              v-model="search.months"
              @change="updateDateRange"
            />
            <span>{{ m }}개월</span>
          </label>
        </div>
      </div>

      <!-- 🔒 부서명: 화면에서 숨김 (자동 세팅됨) -->

      <!-- 🔒 진행상태: 항상 진행중 (화면에서 숨김) -->

      <!-- 🔒 현재 결재자: 로그인 사용자로 자동 세팅 (화면에서 숨김) -->

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="page=1; searchList()"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          조회
        </button>
      </div>
    </div>

    <!-- ✅ 테이블 -->
    <table class="w-full border-collapse border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2">부서</th>
          <th class="border p-2">문서종류</th>
          <th class="border p-2">작성자</th>
          <th class="border p-2">요청일</th>
          <th class="border p-2">금액</th>
          <th class="border p-2">상세</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50">
          <td class="border p-2">{{ row.dept_name }}</td>
          <td class="border p-2">{{ row.document_type }}</td>
          <td class="border p-2">{{ row.author }}</td>
          <td class="border p-2">{{ formatDate(row.request_date) }}</td>
          <td class="border p-2 text-right">{{ Math.floor(row.total_amount).toLocaleString() }}</td>
          <td class="border p-2">
            <button
              @click="openDetail(row)"
              class="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              보기
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ 페이지네이션 -->
    <div class="mt-4 flex justify-center space-x-2">
      <button
        v-for="p in totalPages"
        :key="p"
        @click="page=p; searchList()"
        :class="['px-3 py-1 rounded', page===p ? 'bg-purple-600 text-white' : 'bg-gray-200']"
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
import ReportPreview from "@/components/ReportPreview.vue";
import { useUserStore } from "@/store/userStore";

const rows = ref([]);
const page = ref(1);
const totalPages = ref(1);
const previewReport = ref(null);

const userStore = useUserStore();

const search = reactive({
  months: 1,
  deptName: userStore.user?.deptName || "",
  status: "진행중",
  approverName: userStore.user?.userName || "",
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
