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

      <!-- 청구 시작일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">청구 시작일자</label>
        <input type="date" v-model="search.startDate" class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition" />
      </div>

      <!-- 청구 종료일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">청구 종료일자</label>
        <input type="date" v-model="search.endDate" class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition" />
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
            <th class="border py-1 px-3 text-center h-10">부서</th>
            <th class="border py-1 px-3 text-center h-10">청구 유형</th>
            <th class="border py-1 px-3 text-center h-10">작성자</th>
            <th class="border py-1 px-3 text-center h-10">요청일</th>
            <th class="border py-1 px-3 text-center h-10">금액</th>
            <th class="border py-1 px-3 text-center h-10">상세</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.id" class="hover:bg-purple-50 transition">
            <td class="border p-3 text-center">{{ row.dept_name }}</td>
            <td class="border p-3 text-center">{{ row.document_type }}</td>
            <td class="border p-3 text-center">{{ row.author }}</td>
            <td class="border p-3 text-center">{{ formatDate(row.request_date) }}</td>
            <td class="border py-1 px-3 text-right h-[49px]">{{ Math.floor(row.total_amount).toLocaleString() }}</td>
            <td class="border p-3 text-center">
              <button
                @click="openDetail(row)"
                :data-testid="'row-view-btn-' + index"
                class="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                결재
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
          page===p ? 'bg-gray-300 text-gray-800' : 'bg-white border hover:bg-gray-100'
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

const formatDateValue = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const today = new Date();
const startOfMonth = new Date();
startOfMonth.setMonth(startOfMonth.getMonth() - 1);

const search = reactive({
  deptName: userDeptName,
  status: "결재대기",
  approverUserId: "",
  startDate: formatDateValue(startOfMonth),
  endDate: formatDateValue(today),
});

// ✅ 재정부 조회범위 상태
const financeScope = ref("finance"); // 'finance' | 'others'

const updateFinanceScope = () => {
  if (financeScope.value === "finance") {
    search.status = "결재대기";
    search.deptName = "";
  } else {
    // 타부서 청구 조회 시 결재진행중인 모든 건 모니터링
    search.status = "결재진행중";
    search.deptName = "";
  }
  search.approverUserId = "";
  page.value = 1;
  searchList();
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
    // 서버측 필터링 적용으로 인해 프론트엔드 필터링은 불필요 (재정부이관완료 제외는 서버에서도 수행하나 방어용으로 유지 가능)
    rows.value = data.rows.filter(row => row.status !== '재정부이관완료');
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
    payee: data.payee,
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
  searchList();
});
</script>
