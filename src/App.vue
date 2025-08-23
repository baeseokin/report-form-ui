<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center p-10">
    <div class="w-full max-w-6xl bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
      <!-- 탭 메뉴 -->
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
      <BasicInfo
        v-if="activeTab === '기본정보'"
        :selectedDept="selectedDept"
        :author="author"
        :date="date"
        :deptData="deptData"
        @update="onUpdate"
        @next="goNextTab"
      />
      <ExpenseList
        v-if="activeTab === '지출내역'"
        :items="items"
        :deptData="deptData"
        :selectedDept="selectedDept"
        :totalAmount="totalAmount"
        @update="onUpdate"
        @prev="goPrevTab"
        @next="goNextTab"
      />
      <FinalConfirm
        v-if="activeTab === '최종 확인'"
        :selectedDept="selectedDept"
        :author="author"
        :date="date"
        :totalAmount="totalAmount"
        :comment="comment"
        @update="onUpdate"
        @prev="goPrevTab"
        @generate="generateReport"
      />
    </div>

    <!-- 미리보기 팝업 -->
    <ReportPreview
      v-if="report"
      :report="report"
      @close="closeReport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import BasicInfo from "./components/BasicInfo.vue";
import ExpenseList from "./components/ExpenseList.vue";
import FinalConfirm from "./components/FinalConfirm.vue";
import ReportPreview from "./components/ReportPreview.vue";

const tabs = ["기본정보", "지출내역", "최종 확인"];
const activeTab = ref("기본정보");

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

const goNextTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx < tabs.length - 1) activeTab.value = tabs[idx + 1];
};
const goPrevTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx > 0) activeTab.value = tabs[idx - 1];
};

const totalAmount = computed(() => items.value.reduce((sum, i) => sum + (i.amount || 0), 0));

const onUpdate = (payload) => {
  if (payload.selectedDept !== undefined) selectedDept.value = payload.selectedDept;
  if (payload.author !== undefined) author.value = payload.author;
  if (payload.date !== undefined) date.value = payload.date;
  if (payload.items !== undefined) items.value = payload.items;
  if (payload.comment !== undefined) comment.value = payload.comment;
};

const generateReport = () => {
  report.value = {
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
