<template>
  <div class="min-h-screen bg-white p-4 font-nanum">
    <!-- 단계 진행 표시 (Stepper) -->
    <div class="flex justify-between items-center mb-6 text-sm">
      <button
        v-for="(tab, idx) in tabs"
        :key="idx"
        type="button"
        class="flex-1 text-center py-1 transition"
        :class="[
          activeStep === idx + 1 ? 'font-bold text-purple-600' : 'text-gray-400',
          (idx === 2 || idx === 3) && !hasValidExpense ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        ]"
        @click="goToStep(idx + 1)"
      >
        {{ tab }}
      </button>
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
        v-model:selected-gwan="selectedGwan"
        v-model:selected-hang="selectedHang"        
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
        :selected-gwan="selectedGwan"
        :selected-hang="selectedHang"
        :items="items"
        :alias-name="aliasName"
        v-model:comment="comment"
        :attached-files="attachedFiles"
        @prev="activeStep--"
        @generate="generateReport"
      />
    </div>

    <!-- 미리보기 -->
    <ReportPreview v-if="report" :report="report" @close="closeReport" />
    <!-- 지출내역 미입력 시 단계 이동 차단 알림 -->
    <ModalAlert
      :visible="showNavigationAlert"
      title="알림"
      :message="navigationAlertMessage"
      @close="showNavigationAlert = false"
    />
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
import ModalAlert from "../ModalAlert.vue";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import ("../ReportPreview.vue"));

const tabs = ["기본정보", "지출내역", "파일첨부", "최종 확인"];
const activeStep = ref(1);

const documentType = ref("청구지출결의서");
const selectedDept = ref("");
const selectedGwan = ref("");
const selectedHang = ref("");
const author = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const aliasName = ref("");
const deptData = ref({});
const items = ref([
  { selected: true, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 },
]);
const comment = ref("");
const attachedFiles = ref([]);
const report = ref(null);

const route = useRoute();

onMounted(async () => {
  let deptMap = {};
  try {
    const deptRes = await axios.get("/api/departments");
    const depts = deptRes.data;

    deptMap = {};
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

            const categories = deptMap[data.dept_name] || [];

      const resolveItemForEdit = (item) => {
        const resolved = {
          selected: !!item.selected,
          gwan: item.gwan || data.selectedGwan || "",
          hang: item.hang || data.selectedHang || "",
          mok: item.mok || "",
          semok: item.semok || "",
          detail: item.detail || "",
          amount: item.amount || 0,
          customMok: item.customMok || "",
          customSemok: item.customSemok || "",
          customDetail: item.customDetail || "",
        };

        if (resolved.mok === "__custom__") {
          resolved.customMok = resolved.customMok || item.mok || "";
        }

        if (resolved.semok === "__custom__") {
          resolved.customSemok = resolved.customSemok || item.semok || "";
        }

        const gwan = categories.find(
          (cat) => cat.level === "관" && cat.category_name === resolved.gwan
        );
        const hang = gwan
          ? categories.find(
              (cat) =>
                cat.level === "항" &&
                cat.category_name === resolved.hang &&
                String(cat.parent_id) === String(gwan.id)
            )
          : null;
        const mokNames = hang
          ? categories
              .filter((cat) => cat.level === "목" && String(cat.parent_id) === String(hang.id))
              .map((cat) => cat.category_name)
          : [];

        if (resolved.mok && resolved.mok !== "__custom__" && !mokNames.includes(resolved.mok)) {
          resolved.customMok = resolved.mok;
          resolved.mok = "__custom__";
        }

        if (resolved.mok === "__custom__") {
          if (resolved.semok) {
            resolved.customSemok =
              resolved.semok === "__custom__" ? resolved.customSemok : resolved.semok;
            resolved.semok = "__custom__";
          }
          if (!resolved.semok && resolved.customSemok) {
            resolved.semok = "__custom__";
          }
          return resolved;
        }

        const mok = hang
          ? categories.find(
              (cat) =>
                cat.level === "목" &&
                cat.category_name === resolved.mok &&
                String(cat.parent_id) === String(hang.id)
            )
          : null;
        const semokNames = mok
          ? categories
              .filter((cat) => cat.level === "세목" && String(cat.parent_id) === String(mok.id))
              .map((cat) => cat.category_name)
          : [];

        if (resolved.semok && resolved.semok !== "__custom__" && !semokNames.includes(resolved.semok)) {
          resolved.customSemok = resolved.semok;
          resolved.semok = "__custom__";
        }

        return resolved;
      };

      documentType.value = data.document_type;
      selectedDept.value = data.dept_name;
      author.value = data.author;
      date.value = data.request_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      aliasName.value = data.aliasName;
      selectedGwan.value = data.selectedGwan;
      selectedHang.value = data.selectedHang;
      items.value = (data.items || []).map(resolveItemForEdit);
      date.value = new Date().toISOString().slice(0, 10);
      attachedFiles.value = [];
    }
  } catch (err) {
    console.error("❌ 부서/계정과목 불러오기 실패:", err);
  }
});

const totalAmount = computed(() =>
  items.value.reduce((sum, i) => sum + (i.amount || 0), 0)
);

// ✅ 지출내역 유효: 금액 합계 > 0 이고, 모든 항목에 지출내역(detail)이 입력됨
const hasValidExpense = computed(() => {
  if (totalAmount.value === 0) return false;
  const hasEmptyDetail = items.value.some((item) => !item.detail || String(item.detail).trim() === "");
  return !hasEmptyDetail;
});

const showNavigationAlert = ref(false);
const navigationAlertMessage = ref("");

function goToStep(step) {
  // 파일첨부(3) 또는 최종 확인(4)으로 이동 시 지출내역 미입력이면 차단
  if ((step === 3 || step === 4) && !hasValidExpense.value) {
    navigationAlertMessage.value = "지출내역을 입력한 후 파일첨부·최종 확인 단계로 이동할 수 있습니다.";
    showNavigationAlert.value = true;
    return;
  }
  activeStep.value = step;
}

const generateReport = () => {
  // ✅ 미리보기용: 코드 -> 이름 변환
  const categories = deptData.value[selectedDept.value] || [];
  const getName = (code) => {
    if (!code) return "";
    if (code === "__custom__") return "직접입력";
    const found = categories.find(c => c.category_id === code);
    return found ? found.category_name : code;
  };

  const itemsWithNames = items.value.map(i => ({
    ...i,
    gwan: getName(i.gwan),
    hang: getName(i.hang),
    mok: i.mok === "__custom__" ? i.customMok : getName(i.mok),
    semok: i.semok === "__custom__" ? i.customSemok : getName(i.semok),
  }));

  report.value = {
    documentType: documentType.value,
    deptName: selectedDept.value,
    author: author.value,
    date: date.value,
    totalAmount: totalAmount.value,
    aliasName: aliasName.value,
    items: JSON.parse(JSON.stringify(itemsWithNames)),
    comment: comment.value,
    attachedFiles: attachedFiles.value || [],
  };
};

const closeReport = () => (report.value = null);
</script>
