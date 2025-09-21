<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center p-10 font-nanum"
  >
    <div
      class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200"
    >
      <!-- 📌 PC: 상단 탭 -->
      <div v-if="!isMobile" class="flex border-b mb-6">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="flex-1 py-3 text-center font-semibold transition"
          :class="
            activeTab === tab
              ? 'border-b-4 border-purple-600 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          "
        >
          {{ tab }}
        </button>
      </div>

      <!-- 📌 탭별 컴포넌트 (PC/Mobile 분기) -->
      <component
        :is="isMobile ? BasicInfoTabMobile : BasicInfoTab"
        v-if="activeTab === '기본정보'"
        v-model:documentType="documentType"
        v-model:selectedDept="selectedDept"
        v-model:author="author"
        v-model:date="date"
        v-model:aliasName="aliasName"
        :dept-data="deptData"
        @next="goNextTab"
      />

      <component
        :is="isMobile ? ExpenseTabMobile : ExpenseTab"
        v-if="activeTab === '지출내역'"
        v-model:items="items"
        :dept-data="deptData"
        :selected-dept="selectedDept"
        @prev="goPrevTab"
        @next="goNextTab"
      />

      <component
        :is="isMobile ? FileAttachTabMobile : FileAttachTab"
        v-if="activeTab === '파일첨부'"
        v-model="attachedFiles"
        @prev="goPrevTab"
        @next="goNextTab"
      />

      <component
        :is="isMobile ? ConfirmTabMobile : ConfirmTab"
        v-if="activeTab === '최종 확인'"
        :document-type="documentType"
        :selected-dept="selectedDept"
        :author="author"
        :date="date"
        :total-amount="totalAmount"
        :items="items"
        :alias-name="aliasName"
        v-model:comment="comment"
        :attached-files="attachedFiles"
        @prev="goPrevTab"
        @generate="generateReport"
      />
    </div>

    <!-- 📌 모바일: 하단 네비게이션 -->
    <div
      v-if="isMobile"
      class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2"
    >
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="flex-1 py-2 text-center font-semibold transition"
        :class="activeTab === tab ? 'text-purple-700' : 'text-gray-500'"
      >
        {{ tab }}
      </button>
    </div>

    <!-- 📌 미리보기 -->
    <ReportPreview v-if="report" :report="report" @close="closeReport" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

// 📌 PC 전용 컴포넌트
import BasicInfoTab from "./BasicInfoTab.vue";
import ExpenseTab from "./ExpenseTab.vue";
import FileAttachTab from "./FileAttachTab.vue";
import ConfirmTab from "./ConfirmTab.vue";
import ReportPreview from "./ReportPreview.vue";

// 📌 Mobile 전용 컴포넌트
import BasicInfoTabMobile from "./mobile/BasicInfoTabMobile.vue";
import ExpenseTabMobile from "./mobile/ExpenseTabMobile.vue";
import FileAttachTabMobile from "./mobile/FileAttachTabMobile.vue";
import ConfirmTabMobile from "./mobile/ConfirmTabMobile.vue";

// 반응형 감지
const isMobile = ref(false);
if (typeof window !== "undefined") {
  isMobile.value = window.innerWidth <= 768;
  window.addEventListener("resize", () => {
    isMobile.value = window.innerWidth <= 768;
  });
}

const tabs = ["기본정보", "지출내역", "파일첨부", "최종 확인"];
const activeTab = ref("기본정보");

const documentType = ref("청구지출결의서");
const selectedDept = ref("");
const author = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const aliasName = ref("");
const deptData = ref({});
const items = ref([
  { selected: true, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 },
]);
const comment = ref("");
const report = ref(null);
const attachedFiles = ref([]);

const route = useRoute();

onMounted(async () => {
  const res = await fetch("/deptData.json");
  deptData.value = await res.json();

  if (route.params.id) {
    try {
      const res = await axios.get(`/api/approval/detail/${route.params.id}`, {
        withCredentials: true,
      });

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

      date.value = new Date().toISOString().slice(0, 10);
      attachedFiles.value = [];
    } catch (err) {
      console.error("❌ 보고서 데이터 불러오기 실패:", err);
    }
  }
});

const totalAmount = computed(() =>
  items.value.reduce((sum, i) => sum + (i.amount || 0), 0)
);

const goNextTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx < tabs.length - 1) activeTab.value = tabs[idx + 1];
};
const goPrevTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (idx > 0) activeTab.value = tabs[idx - 1];
};

const generateReport = (previewData) => {
  report.value = {
    documentType: documentType.value,
    deptName: previewData.deptName,
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
