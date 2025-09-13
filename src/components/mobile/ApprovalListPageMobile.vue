<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen">
    <h2 class="text-lg font-bold text-gray-800 mb-4">✅ 내결재목록 조회</h2>  

    <!-- ✅ 요청기간 선택 (모바일 friendly: select box) -->
    <div class="flex justify-center mb-4 space-x-2">
    <select
    v-model="search.months"
    @change="updateDateRange"
    class="border rounded px-2 py-1 text-sm"
    >
    <option v-for="m in [1,3,6,12]" :key="m" :value="m">
    {{ m }}개월
    </option>
    </select>
    <button
    @click="page=1; searchList()"
    class="px-3 py-1 bg-blue-600 text-white rounded text-sm"
    >조회</button>
    </div>

    <!-- ✅ 카드형 목록 -->
    <div v-if="rows.length > 0" class="space-y-3">
      <div
        v-for="row in rows"
        :key="row.id"
        class="border rounded-lg shadow p-3 bg-white"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="font-semibold">{{ row.document_type }}</span>
          <span class="text-xs text-gray-500">{{ formatDate(row.request_date) }}</span>
        </div>
        <div class="text-sm text-gray-600">부서: {{ row.dept_name }}</div>
        <div class="text-sm text-gray-600">작성자: {{ row.author }}</div>
        <div class="text-sm text-gray-600">금액: {{ Math.floor(row.total_amount).toLocaleString() }}원</div>

        <div class="flex justify-end mt-2">
          <button
            @click="openDetail(row)"
            class="px-3 py-1 bg-purple-600 text-white rounded text-sm"
          >보기</button>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 py-5">
      표시할 결재 내역이 없습니다.
    </div>

    <!-- ✅ 페이지네이션 -->
    <div class="mt-4 flex justify-center space-x-2">
      <button
        v-for="p in totalPages"
        :key="p"
        @click="page=p; searchList()"
        :class="['px-3 py-1 rounded text-sm', page===p ? 'bg-purple-600 text-white' : 'bg-gray-200']"
      >
        {{ p }}
      </button>
    </div>

    <!-- ✅ 상세보기 모달 -->
    <ReportPreview
      v-if="previewReport"
      :report="previewReport"
      @close="previewReport = null"
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

<style scoped>
button {
  transition: background-color 0.2s;
}
button:active {
  transform: scale(0.95);
}
</style>