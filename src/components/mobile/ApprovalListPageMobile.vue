<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen">
    <!-- ✅ [재정부 전용] 조회범위 선택 -->
    <div v-if="userDeptName === '재정부'" class="flex justify-center mb-3 space-x-4 bg-white p-2 rounded border shadow-sm">
      <label class="flex items-center space-x-1">
        <input type="radio" v-model="financeScope" value="finance" @change="updateFinanceScope" class="text-purple-600 focus:ring-purple-500" />
        <span class="text-sm font-medium text-gray-700">재정부 청구</span>
      </label>
      <label class="flex items-center space-x-1">
        <input type="radio" v-model="financeScope" value="others" @change="updateFinanceScope" class="text-purple-600 focus:ring-purple-500" />
        <span class="text-sm font-medium text-gray-700">타부서 청구</span>
      </label>
    </div>

    <!-- ✅ 요청기간 선택 + 조회 버튼 (ApprovalListMobile과 동일하게 조회 버튼 아래로) -->
    <div class="space-y-3 mb-6">
      <div>
        <label class="font-bold mb-1 block">요청기간</label>
        <select
          v-model="search.months"
          @change="updateDateRange"
          class="mobile-form-control mobile-form-control-select"
        >
          <option v-for="m in [1,3,6,12]" :key="m" :value="m">
            {{ m }}개월
          </option>
        </select>
      </div>
      <button
        @click="page=1; searchList()"
        class="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        조회
      </button>
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
          >결재</button>
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
        :class="['px-3 py-1 rounded text-sm', page===p ? 'bg-gray-300 text-gray-800' : 'bg-gray-200']"
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
const ReportPreview = defineAsyncComponent(() => import ("@/components/ReportPreview.vue"));
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

// ✅ 재정부 조회범위 상태
const financeScope = ref("finance"); // 'finance' | 'others'

const updateFinanceScope = () => {
  if (financeScope.value === "finance") {
    search.status = "결재완료";
    search.deptName = userDeptName;
  } else {
    search.status = "결재진행중";
    search.deptName = "";
  }
  page.value = 1;
  searchList();
};

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