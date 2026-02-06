<template>
  <div class="p-6 font-nanum">

    <!-- ✅ 검색조건 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-6 items-end">
      <!-- ✅ [재정부 전용] 조회범위 선택 -->
      <div v-if="userDeptName === '재정부'" class="flex flex-col">
        <label class="font-semibold text-gray-600 mb-1 text-sm">조회범위</label>
        <div class="flex gap-4 flex-wrap">
          <label class="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition">
            <input type="radio" v-model="financeScope" value="finance" @change="updateFinanceScope" class="w-4 h-4 accent-gray-600" />
            <span class="text-slate-700">재정부 청구</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition">
            <input type="radio" v-model="financeScope" value="others" @change="updateFinanceScope" class="w-4 h-4 accent-gray-600" />
            <span class="text-slate-700">타부서 청구</span>
          </label>
        </div>
      </div>

      <!-- 요청기간 -->
      <div class="flex flex-col">
        <label class="font-semibold text-gray-600 mb-1 text-sm">청구기간</label>
        <div class="flex gap-2 flex-wrap">
          <label v-for="m in [1,3,6,12]" :key="m" class="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition has-[:checked]:border-gray-400 has-[:checked]:bg-gray-50">
            <input type="radio" name="months" :value="m" v-model="search.months" @change="updateDateRange" class="w-4 h-4 accent-gray-600" />
            <span class="text-slate-700">{{ m }}개월</span>
          </label>
        </div>
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="page=1; searchList()"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
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
            <th class="border p-3 text-center">부서</th>
            <th class="border p-3 text-center">문서종류</th>
            <th class="border p-3 text-center">작성자</th>
            <th class="border p-3 text-center">요청일</th>
            <th class="border p-3 text-center">금액</th>
            <th class="border p-3 text-center">상세</th>
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
          page===p ? 'bg-purple-400 text-white' : 'bg-white border hover:bg-gray-100'
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
