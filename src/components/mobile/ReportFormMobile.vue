<template>
  <div class="min-h-screen bg-white p-4 font-nanum">
    <!-- 단계 진행 표시 (Stepper) -->
    <div class="flex justify-between items-center mb-6 text-sm">
      <div
        v-for="(tab, idx) in tabs"
        :key="idx"
        class="flex-1 text-center"
        :class="activeStep === idx + 1 ? 'font-bold text-purple-600' : 'text-gray-400'"
      >
        {{ tab }}
      </div>
    </div>

    <!-- 단계별 컴포넌트 -->
    <div v-if="activeStep === 1">
      <BasicInfoTabMobile
        v-model:documentType="documentType"
        v-model:selectedDept="selectedDept"
        v-model:author="author"
        v-model:date="date"
        v-model:aliasName="aliasName"
        :dept-data="deptData"
        @next="activeStep++"
      />
    </div>

    <div v-if="activeStep === 2">
      <ExpenseTabMobile
        v-model:items="items"
        :dept-data="deptData"
        :selected-dept="selectedDept"
        @prev="activeStep--"
        @next="activeStep++"
      />
    </div>

    <div v-if="activeStep === 3">
      <FileAttachTabMobile
        v-model="attachedFiles"
        @prev="activeStep--"
        @next="activeStep++"
      />
    </div>

    <div v-if="activeStep === 4">
      <ConfirmTabMobile
        :document-type="documentType"
        :selected-dept="selectedDept"
        :author="author"
        :date="date"
        :total-amount="totalAmount"
        :items="items"
        :alias-name="aliasName"
        v-model:comment="comment"
        :attached-files="attachedFiles"
        @prev="activeStep--"
        @submit="generateReport"
      />
    </div>

    <!-- 미리보기 -->
    <ReportPreview v-if="report" :report="report" @close="closeReport" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

// 모바일 전용 탭 컴포넌트 import
import BasicInfoTabMobile from "./BasicInfoTabMobile.vue";
import ExpenseTabMobile from "./ExpenseTabMobile.vue";
import FileAttachTabMobile from "./FileAttachTabMobile.vue";
import ConfirmTabMobile from "./ConfirmTabMobile.vue";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import ("../ReportPreview.vue"));

const tabs = ["기본정보", "지출내역", "파일첨부", "최종 확인"];
const activeStep = ref(1);

const documentType = ref("청구지출결의서");
const selectedDept = ref("");
const author = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const aliasName = ref("");
const deptData = ref({});
const items = ref([]);
const comment = ref("");
const attachedFiles = ref([]);
const report = ref(null);

const route = useRoute();

onMounted(async () => {
  try {
    const deptRes = await axios.get("/api/departments");
    const depts = deptRes.data;

    const deptMap = {};
    for (const dept of depts) {
      const catRes = await axios.get(`/api/accountCategories/${dept.id}`, {
        params: { date: new Date().toISOString().split("T")[0] },
      });
      deptMap[dept.dept_name] = catRes.data.categories || [];
    }
    deptData.value = deptMap;

    // 보고서 수정 모드
    if (route.params.id) {
      const res = await axios.get(`/api/approval/detail/${route.params.id}`, { withCredentials: true });
      const data = res.data;
      documentType.value = data.document_type;
      selectedDept.value = data.dept_name;
      author.value = data.author;
      date.value = data.request_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      aliasName.value = data.aliasName;
      items.value = (data.items || []).map((i) => ({
        gwan: i.gwan,
        hang: i.hang,
        mok: i.mok,
        semok: i.semok,
        detail: i.detail,
        amount: i.amount,
      }));
      attachedFiles.value = [];
    }
  } catch (err) {
    console.error("❌ 부서/계정과목 불러오기 실패:", err);
  }
});

const totalAmount = computed(() =>
  items.value.reduce((sum, i) => sum + (i.amount || 0), 0)
);

const generateReport = () => {
  report.value = {
    documentType: documentType.value,
    deptName: selectedDept.value,
    author: author.value,
    date: date.value,
    totalAmount: totalAmount.value,
    aliasName: aliasName.value,
    items: JSON.parse(JSON.stringify(items.value)),
    comment: comment.value,
    attachedFiles: attachedFiles.value || [],
  };
};

const closeReport = () => (report.value = null);
</script>
