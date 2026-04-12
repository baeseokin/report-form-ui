<template>
  <div
    :class="[
      'w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white shadow-2xl rounded-2xl py-[15px] px-[14px] sm:p-6 md:p-8 border border-gray-200 mx-auto font-nanum',
      isMobile ? 'pb-12' : ''
    ]"
  >
      <!-- 📌 PC: 상단 탭 -->
      <div v-if="!isMobile" class="flex border-b mb-6">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="handleTabClick(tab)"
          :data-testid="'tab-' + (tab === '최종 확인' ? 'confirm' : (tab === '파일첨부' ? 'file' : (tab === '지출내역' ? 'expense' : 'basic')))"
          class="flex-1 py-3 text-center font-semibold transition"
          :class="[
            activeTab === tab
              ? 'border-b-4 border-purple-600 text-purple-700'
              : 'text-gray-500 hover:text-gray-700',
            (tab === '파일첨부' || tab === '최종 확인') && !hasValidExpense
              ? 'opacity-50 cursor-not-allowed'
              : ''
          ]"
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
        :key="selectedDept || 'expense'"
        v-model:items="items"
        v-model:selected-gwan="selectedGwan"
        v-model:selected-hang="selectedHang"        
        v-model:selected-dept="selectedDept"
        :dept-data="deptData"
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
        :key="'confirm-' + (selectedDept || '')"
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
        :data-testid="'tab-' + (tab === '최종 확인' ? 'confirm' : (tab === '파일첨부' ? 'file' : (tab === '지출내역' ? 'expense' : 'basic')))"
        class="flex-1 py-2 text-center font-semibold transition"
        :class="[
          activeTab === tab ? 'text-purple-700' : 'text-gray-500',
          (tab === '파일첨부' || tab === '최종 확인') && !hasValidExpense
            ? 'opacity-50 cursor-not-allowed'
            : ''
        ]"
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
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import { defineAsyncComponent } from "vue";

// ✅ 모달/탭 전부 비동기 로드 → 모바일 초기 번들 크기 감소
const ModalAlert = defineAsyncComponent(() => import("./ModalAlert.vue"));
const ReportPreview = defineAsyncComponent(() => import("./ReportPreview.vue"));

const BasicInfoTab = defineAsyncComponent(() => import("./BasicInfoTab.vue"));
const ExpenseTab = defineAsyncComponent(() => import("./ExpenseTab.vue"));
const FileAttachTab = defineAsyncComponent(() => import("./FileAttachTab.vue"));
const ConfirmTab = defineAsyncComponent(() => import("./ConfirmTab.vue"));

const BasicInfoTabMobile = defineAsyncComponent(() => import("./mobile/BasicInfoTabMobile.vue"));
const ExpenseTabMobile = defineAsyncComponent(() => import("./mobile/ExpenseTabMobile.vue"));
const FileAttachTabMobile = defineAsyncComponent(() => import("./mobile/FileAttachTabMobile.vue"));
const ConfirmTabMobile = defineAsyncComponent(() => import("./mobile/ConfirmTabMobile.vue"));
const props = defineProps(['id']);

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
const { user } = storeToRefs(useUserStore());

// ✅ 부서 + 계정과목 데이터 불러오기
onMounted(async () => {
  let deptMap = {};
  // ✅ 새 보고서일 때 부서명을 로그인 사용자 부서로 초기화 (최종확인 표시/API 전달 일치)
  if (!route.params.id && !selectedDept.value && user.value?.deptName) {
    selectedDept.value = user.value.deptName;
  }
  if (!author.value && user.value?.userName) {
    author.value = user.value.userName;
  }
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
      // ✅ 작성자는 원본 작성자가 아닌 현재 로그인 사용자로 채움
      author.value = user.value?.userName || data.author;
      date.value = data.request_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      aliasName.value = data.aliasName;
      selectedGwan.value = data.selectedGwan;
      selectedHang.value = data.selectedHang;

      items.value = (data.items || []).map(resolveItemForEdit);

      // ✅ 수정 모드(edit)일 때는 원래 날짜 유지, 그 외(복사/작성)는 오늘 날짜
      if (route.query.mode === 'edit') {
        date.value = data.request_date?.slice(0, 10);
      } else {
        date.value = new Date().toISOString().slice(0, 10);
      }

      // ✅ 기존 파일 로드
      if (data.attachedFiles && data.attachedFiles.length > 0) {
        attachedFiles.value = data.attachedFiles.map(f => ({
          id: f.id,
          name: f.file_name,
          aliasName: f.alias_name || f.file_name,
          size: f.file_size,
          isExisting: true
        }));
      } else {
        attachedFiles.value = [];
      }
    } catch (err) {
      console.error("❌ 보고서 데이터 불러오기 실패:", err);
    }
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

// ✅ 부서 변경 시: 관/항 선택 초기화 → 지출내역 탭에서 새 부서 계정으로 다시 선택
watch(selectedDept, () => {
  selectedGwan.value = "";
  selectedHang.value = "";
});

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
    !hasValidExpense.value
  );
};

// ✅ 파일첨부/최종 확인 탭으로 직접 이동 시도 시 지출내역 미입력이면 차단
const isFileOrConfirmTab = (tab) => tab === "파일첨부" || tab === "최종 확인";

const notifyExpenseRequired = () => {
  navigationAlertMessage.value = "지출내역을 입력한 후 파일첨부·최종 확인 탭으로 이동할 수 있습니다.";
  showNavigationAlert.value = true;
};

const handleTabClick = (tab) => {
  if (isFileOrConfirmTab(tab) && !hasValidExpense.value) {
    notifyExpenseRequired();
    return;
  }
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
    items: JSON.parse(JSON.stringify(itemsForConfirm.value)),
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
