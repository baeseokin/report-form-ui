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
          @click="handleTabClick(tab)"
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
        v-model:selected-gwan="selectedGwan"
        v-model:selected-hang="selectedHang"        
        v-model:selected-dept="selectedDept"
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
        :selected-gwan="selectedGwanName"
        :selected-hang="selectedHangName"
        :items="itemsForConfirm"
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
          @click="handleTabClick(tab)"
        class="flex-1 py-2 text-center font-semibold transition"
        :class="activeTab === tab ? 'text-purple-700' : 'text-gray-500'"
      >
        {{ tab }}
      </button>
    </div>

    <!-- 📌 미리보기 -->
    <ReportPreview v-if="report" :report="report" @close="closeReport" />
    <!-- 📌 방향 전환 경고 모달 -->
    <ModalAlert
      :visible="showOrientationAlert"
      title="주의"
      :message="orientationAlertMessage"
      @close="showOrientationAlert = false"
    />
    <ModalAlert
      :visible="showNavigationAlert"
      title="알림"
      :message="navigationAlertMessage"
      @close="showNavigationAlert = false"
    />    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import ModalAlert from "./ModalAlert.vue";

// 📌 PC 전용 컴포넌트
import BasicInfoTab from "./BasicInfoTab.vue";
import ExpenseTab from "./ExpenseTab.vue";
import FileAttachTab from "./FileAttachTab.vue";
import ConfirmTab from "./ConfirmTab.vue";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import ("./ReportPreview.vue"));

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
const selectedGwan = ref("");
const selectedHang = ref("");
const author = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const aliasName = ref("");
const deptData = ref({}); // ✅ 서버에서 가져올 dept+계정 데이터
const allCategories = ref([]); // ✅ 전체 계정과목 (이름 변환용)
const items = ref([
  { selected: true, gwan: "", hang: "", mok: "", semok: "", detail: "", amount: 0 },
]);
const comment = ref("");
const report = ref(null);
const attachedFiles = ref([]);

const route = useRoute();

// ✅ 부서 + 계정과목 데이터 불러오기
onMounted(async () => {
  let deptMap = {};
  try {
    const deptRes = await axios.get("/api/departments");
    const depts = deptRes.data;

    // ✅ 전체 계정과목 로드 (이름 변환용)
    try {
      const allRes = await axios.get("/api/accountCategories");
      allCategories.value = allRes.data.categories || [];
    } catch (e) {
      console.error("전체 계정과목 로드 실패", e);
    }

    deptMap = {};
    for (const dept of depts) {
      const catRes = await axios.get(`/api/accountCategories/${dept.id}`, {
        params: { date: new Date().toISOString().split("T")[0] },
      });
      deptMap[dept.dept_name] = catRes.data.categories || [];
    }

    deptData.value = deptMap;
  } catch (err) {
    console.error("❌ 부서/계정과목 불러오기 실패:", err);
  }

  // 보고서 수정 모드 (id param 있을 경우)
  if (route.params.id) {
    try {
      const res = await axios.get(`/api/approval/detail/${route.params.id}`, {
        withCredentials: true,
      });

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

        // Handle existing custom
        if (resolved.mok === "__custom__") {
          resolved.customMok = resolved.customMok || item.mok || "";
          if (resolved.semok) {
            resolved.customSemok = resolved.semok === "__custom__" ? resolved.customSemok : resolved.semok;
            resolved.semok = "__custom__";
          }
          return resolved;
        }

        // 1. Resolve Gwan (ID or Name -> ID)
        let gwanCat = categories.find(c => c.level === "관" && (c.category_id === resolved.gwan || c.category_name === resolved.gwan));
        if (gwanCat) resolved.gwan = gwanCat.category_id;

        // 2. Resolve Hang
        let hangCat = null;
        if (gwanCat) {
          hangCat = categories.find(c => c.level === "항" && c.parent_id === gwanCat.id && (c.category_id === resolved.hang || c.category_name === resolved.hang));
          if (hangCat) resolved.hang = hangCat.category_id;
        }

        // 3. Resolve Mok
        let mokCat = null;
        if (hangCat && resolved.mok) {
           mokCat = categories.find(c => c.level === "목" && c.parent_id === hangCat.id && (c.category_id === resolved.mok || c.category_name === resolved.mok));
           if (mokCat) {
             resolved.mok = mokCat.category_id;
           } else {
             resolved.customMok = resolved.mok;
             resolved.mok = "__custom__";
           }
        }

        // 4. Resolve Semok
        if (mokCat && resolved.semok) {
           let semokCat = categories.find(c => c.level === "세목" && c.parent_id === mokCat.id && (c.category_id === resolved.semok || c.category_name === resolved.semok));
           if (semokCat) {
             resolved.semok = semokCat.category_id;
           } else {
             resolved.customSemok = resolved.semok;
             resolved.semok = "__custom__";
           }
        } else if (resolved.semok && !mokCat) {
           // If mok is custom (or missing), semok is treated as custom
           if (resolved.mok === "__custom__") {
             resolved.customSemok = resolved.semok;
             resolved.semok = "__custom__";
           }
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
    } catch (err) {
      console.error("❌ 보고서 데이터 불러오기 실패:", err);
    }
  }
});

const totalAmount = computed(() =>
  items.value.reduce((sum, i) => sum + (i.amount || 0), 0)
);

// ✅ ConfirmTab 표시용 (코드 -> 이름 변환)
const currentCategories = computed(() => deptData.value[selectedDept.value] || []);

const getCategoryName = (code) => {
  if (!code) return "";
  if (code === "__custom__") return "직접입력";
  // ✅ 전체 목록에서 우선 검색 (부모 계정 등 매핑되지 않은 항목 포함)
  const found = allCategories.value.find(c => c.category_id === code) || currentCategories.value.find(c => c.category_id === code);
  return found ? found.category_name : code;
};

const selectedGwanName = computed(() => getCategoryName(selectedGwan.value));
const selectedHangName = computed(() => getCategoryName(selectedHang.value));

const itemsForConfirm = computed(() => items.value.map(item => ({
  ...item,
  gwan: getCategoryName(item.gwan),
  hang: getCategoryName(item.hang),
  mok: item.mok === '__custom__' ? item.customMok : getCategoryName(item.mok),
  semok: item.semok === '__custom__' ? item.customSemok : getCategoryName(item.semok),
})));

const showNavigationAlert = ref(false);
const navigationAlertMessage = ref("");

const isExpenseTabBlocked = (nextIdx) => {
  const currentIdx = tabs.indexOf(activeTab.value);
  const expenseIdx = tabs.indexOf("지출내역");
  return (
    currentIdx === expenseIdx &&
    nextIdx > currentIdx &&
    totalAmount.value <= 0
  );
};

const notifyExpenseRequired = () => {
  navigationAlertMessage.value = "지출항목을 입력해야 다음으로 이동할 수 있습니다.";
  showNavigationAlert.value = true;
};

const handleTabClick = (tab) => {
  const targetIdx = tabs.indexOf(tab);
  if (isExpenseTabBlocked(targetIdx)) {
    notifyExpenseRequired();
    return;
  }
  activeTab.value = tab;
};

const goNextTab = () => {
  const idx = tabs.indexOf(activeTab.value);
  if (isExpenseTabBlocked(idx + 1)) {
    notifyExpenseRequired();
    return;
  }  
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

// ✅ 방향 전환 시 경고 모달 표시
const showOrientationAlert = ref(false);
const orientationAlertMessage = ref("보고서 작성 화면은 가로 또는 세로, 하나의 모드에서 사용하세요. 작성 중 전환시 오류가 발생할 수 있습니다.");

function triggerOrientationAlert() {
  // 이미 떠 있으면 다시 띄우지 않음
  if (!showOrientationAlert.value) {
    showOrientationAlert.value = true;
  }
}

// 반응형 감지 (가로/세로 전환 포함하여 견고하게)
let mql = null;

function getViewportWidth() {
  return (typeof window !== "undefined" && window.visualViewport)
    ? window.visualViewport.width
    : (typeof window !== "undefined" ? window.innerWidth : 1024);
}

function updateIsMobile() {
  const width = getViewportWidth();
  const prev = isMobile.value;
  isMobile.value = width <= 768;
  // ✅ 폭 변화로 인해 가로/세로 모드가 바뀌었으면 알림 표시
  if (prev !== isMobile.value) {
    triggerOrientationAlert();
  }
}

function initResponsiveListeners() {
  if (typeof window === "undefined") return () => {};

  updateIsMobile();

  const onResize = () => updateIsMobile();
  const onOrientation = () => triggerOrientationAlert();

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onOrientation, { passive: true });

  mql = window.matchMedia("(max-width: 768px)");
  const onMqlChange = (e) => {
    isMobile.value = e.matches;
    triggerOrientationAlert();
  };
  mql.addEventListener?.("change", onMqlChange);

  const onVvResize = () => updateIsMobile();
  window.visualViewport?.addEventListener?.("resize", onVvResize, { passive: true });

  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onOrientation);
    mql?.removeEventListener?.("change", onMqlChange);
    window.visualViewport?.removeEventListener?.("resize", onVvResize);
  };
}

let cleanupResponsive = null;
onMounted(() => {
  cleanupResponsive = initResponsiveListeners();
});

onBeforeUnmount(() => {
  cleanupResponsive?.();
});

</script>
