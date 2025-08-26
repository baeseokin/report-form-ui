<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center p-10 font-nanum">
    <div class="w-full max-w-6xl bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
      <!-- 탭 -->
      <div class="flex border-b mb-6">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="flex-1 py-3 text-center font-semibold transition"
          :class="activeTab === tab ? 'border-b-4 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab }}
        </button>
      </div>

      <!-- 탭별 컴포넌트 -->
      <BasicInfoTab
        v-if="activeTab === '기본정보'"
        v-model:selectedDept="selectedDept"
        v-model:author="author"
        v-model:date="date"
        v-model:documentType="documentType"
        :dept-data="deptData"
        @next="goNextTab"
      />
      <ExpenseTab
        v-if="activeTab === '지출내역'"
        v-model:items="items"
        :dept-data="deptData"
        :selected-dept="selectedDept"
        @prev="goPrevTab"
        @next="goNextTab"
      />
      <ConfirmTab
        v-if="activeTab === '최종 확인'"
        :document-type="documentType"
        :selected-dept="selectedDept"
        :author="author"
        :date="date"
        :total-amount="totalAmount"
        :items="items"
        v-model:comment="comment"
        @prev="goPrevTab"
        @generate="generateReport"
      />
    </div>

    <!-- 미리보기 -->
    <ReportPreview v-if="report" :report="report" @close="closeReport"/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import BasicInfoTab from "./components/BasicInfoTab.vue";
import ExpenseTab from "./components/ExpenseTab.vue";
import ConfirmTab from "./components/ConfirmTab.vue";
import ReportPreview from "./components/ReportPreview.vue";

const tabs = ["기본정보", "지출내역", "최종 확인"];
const activeTab = ref("기본정보");

const documentType = ref("청구지출결의서"); // ✅ 문서종류 기본값
const selectedDept = ref("");
const author = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const deptData = ref({});
const items = ref([{ selected: true, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 }]);
const comment = ref("");
const report = ref(null);

onMounted(async () => {
  const res = await fetch("/deptData.json");
  deptData.value = await res.json();
});

const totalAmount = computed(() => items.value.reduce((sum, i) => sum + (i.amount || 0), 0));

const goNextTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx < tabs.length - 1) activeTab.value = tabs[idx + 1];
};
const goPrevTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx > 0) activeTab.value = tabs[idx - 1];
};

const generateReport = () => {
  report.value = {
    documentType: documentType.value, // ✅ 추가됨
    deptName: selectedDept.value,
    author: author.value,
    date: date.value,
    totalAmount: totalAmount.value,
    items: JSON.parse(JSON.stringify(items.value)),
    comment: comment.value,
  };
};
const closeReport = () => (report.value = null);
</script>
