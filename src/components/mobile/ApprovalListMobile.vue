<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen">
    <!-- ✅ 검색조건 접기/펼치기 -->
    <div class="mb-6 bg-purple-100 rounded-lg border border-purple-200 shadow-sm overflow-hidden">
      <!-- 접힌 상태: 터치하면 펼침 -->
      <button
        type="button"
        @click="searchExpanded = true"
        class="w-full flex items-center justify-between p-3 text-left hover:bg-purple-200 active:bg-purple-300 transition"
        :class="{ 'hidden': searchExpanded }"
      >
        <span class="font-semibold text-gray-700">검색조건</span>
        <span class="text-sm text-gray-500 truncate flex-1 mx-2">{{ searchConditionSummary }}</span>
        <span class="text-gray-400 shrink-0">▼</span>
      </button>

      <!-- 펼친 상태: 조건 영역 -->
      <div v-show="searchExpanded" class="border-t border-purple-200">
        <button
          type="button"
          @click="searchExpanded = false"
          class="w-full flex items-center justify-between p-3 text-left bg-purple-200 hover:bg-purple-300 active:bg-purple-400 transition"
        >
          <span class="font-semibold text-gray-700">검색조건 접기</span>
          <span class="text-gray-400">▲</span>
        </button>
        <div class="p-3 pt-4 space-y-3 bg-white">
          <!-- 부서명 -->
          <div>
            <label class="block text-sm mb-1">부서명</label>
            <input
              type="text"
              v-model="filters.deptName"
              placeholder="부서명 입력"
              class="mobile-form-control"
              :readonly="!canEditDept"
            />
          </div>

          <!-- 청구 유형 -->
          <div>
            <label class="block text-sm mb-1">청구 유형</label>
            <select v-model="filters.documentType" @change="fetchApprovals(1)" class="mobile-form-control mobile-form-control-select w-full">
              <option value="">전체</option>
              <option value="청구지출결의서">청구지출결의서</option>
              <option value="정산지출결의서">정산지출결의서</option>
              <option value="가불지출결의서">가불지출결의서</option>
            </select>
          </div>

          <!-- 진행상태 -->
          <div>
            <label class="block text-sm mb-1">진행상태</label>
            <select v-model="filters.status" @change="fetchApprovals(1)" class="mobile-form-control mobile-form-control-select w-full">
              <option value="">전체</option>
              <option value="결재진행중">결재진행중</option>
              <option value="결재완료">결재완료</option>
              <option value="결재반려">결재반려</option>
              <option value="재정부이관완료">재정부이관완료</option>
            </select>
          </div>

          <!-- 청구 시작일자 -->
          <div>
            <label class="block text-sm mb-1">청구 시작일자</label>
            <div class="mobile-form-control-date-wrap">
              <input type="date" v-model="filters.startDate" @change="fetchApprovals(1)" class="mobile-form-control mobile-form-control-date" />
              <span class="mobile-form-control-date-icon" aria-hidden="true">📅</span>
            </div>
          </div>

          <!-- 청구 종료일자 -->
          <div>
            <label class="block text-sm mb-1">청구 종료일자</label>
            <div class="mobile-form-control-date-wrap">
              <input type="date" v-model="filters.endDate" @change="fetchApprovals(1)" class="mobile-form-control mobile-form-control-date" />
              <span class="mobile-form-control-date-icon" aria-hidden="true">📅</span>
            </div>
          </div>

          <button
            @click="fetchApprovals(1)"
            class="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 active:bg-purple-800"
          >
            조회
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ 카드 리스트 -->
    <div class="space-y-4">
      <div
        v-for="a in approvals"
        :key="a.id"
        class="bg-white rounded-lg shadow-md p-4 border"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-purple-700">{{ a.document_type }}</h3>
          <span class="text-sm px-2 py-1 rounded bg-gray-100">{{ a.status }}</span>
        </div>

        <p class="text-gray-700 text-sm"><strong>부서:</strong> {{ a.dept_name }}</p>
        <p class="text-gray-700 text-sm"><strong>작성자:</strong> {{ a.author }}</p>
        <p class="text-gray-700 text-sm"><strong>별칭:</strong> {{ a.aliasName }}</p>
        <p class="text-gray-700 text-sm"><strong>일자:</strong> {{ formatDate(a.request_date) }}</p>
        <p class="text-gray-700 text-sm"><strong>총액:</strong> {{ formatAmount(a.total_amount) }}</p>

        <!-- 액션 버튼 -->
        <div class="flex justify-end space-x-3 mt-3">
          <button
            @click="openPreview(a.id)"
            class="p-2 rounded hover:bg-green-100"
            title="상세보기"
          >
            <img src="/icons/view.svg" alt="상세보기" class="w-6 h-6" />
          </button>
          <button
            @click="goToReport(a.id)"
            class="p-2 rounded hover:bg-purple-100"
            title="보고서작성"
          >
            <img src="/icons/report.svg" alt="보고서작성" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <p v-if="approvals.length === 0" class="text-center text-gray-500">
        데이터가 없습니다.
      </p>
    </div>

    <!-- 페이지네이션 -->
    <div class="flex justify-center mt-6 space-x-2">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="fetchApprovals(page)"
        :class="[
          'px-3 py-1 border rounded',
          currentPage === page ? 'bg-gray-300 text-gray-800' : 'bg-white hover:bg-gray-100'
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
import { ref, onMounted, computed } from "vue";
import axios from "axios";
//import ReportPreview from "../ReportPreview.vue";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import ("../ReportPreview.vue"));
import { useRouter } from "vue-router";
import { useUserStore } from "../../store/userStore";
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

// ✅ 검색조건 펼침/접힘 (기본: 접힌 상태)
const searchExpanded = ref(false);

// 접힌 상태에서 보여줄 요약 문구
const searchConditionSummary = computed(() => {
  const f = filters.value;
  const parts = [];
  if (f.deptName) parts.push(f.deptName);
  parts.push(f.documentType || "유형전체");
  parts.push(f.status || "상태전체");
  const start = f.startDate ? f.startDate.replace(/-/g, ".") : "";
  const end = f.endDate ? f.endDate.replace(/-/g, ".") : "";
  if (start && end) parts.push(`${start}~${end}`);
  return parts.length ? parts.join(" · ") : "조건 선택";
});

// ✅ 권한 체크: 재정부 or 관리자
const canEditDept = computed(() => {
  if (!user.value?.roles) return false;
  return user.value.roles.some(
    (r) => r.role_name === "재정부" || r.role_name === "관리자"
  );
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
      selectedGwan: res.data.selectedGwan,
      selectedHang: res.data.selectedHang,
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
