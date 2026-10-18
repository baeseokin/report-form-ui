<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen pb-24">
    <!-- 📌 모바일 상단 탭 인디케이터 -->
    <div class="mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
      <span class="text-xs font-bold text-purple-700">STEP {{ currentTab + 1 }}/3</span>
      <span class="text-sm font-bold text-gray-800">{{ tabs[currentTab] }}</span>
      <span class="text-xs text-gray-400">{{ targetYear }}년도</span>
    </div>

    <!-- 1단계: 기본정보 -->
    <div v-if="currentTab === 0" class="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div>
        <label class="block text-xs font-bold text-gray-700 mb-1">
          대상 회계연도 <span class="text-red-500">*</span>
        </label>
        <select
          v-model="targetYear"
          class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
        >
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년도</option>
        </select>
        <span class="text-[11px] text-gray-400 mt-1 block">
          ※ 당해년도({{ targetYear - 1 }}년) 예산이 기본 세팅됩니다.
        </span>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-700 mb-1">
          신청 부서 <span class="text-red-500">*</span>
        </label>
        <select
          v-model="selectedDeptName"
          :disabled="!canChangeDept"
          class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm disabled:bg-gray-100"
        >
          <option v-for="d in sortedDepartmentOptions" :key="d.id || d.dept_name" :value="d.dept_name">
            {{ d.dept_name }}
          </option>
        </select>
        <span v-if="!canChangeDept" class="text-[11px] text-purple-700 mt-1 block font-medium">
          ※ 회계 권한 사용자는 소속 부서({{ userDeptName }})의 예산만 기안할 수 있습니다.
        </span>
        <span v-else class="text-[11px] text-indigo-700 mt-1 block font-medium">
          ※ 재정부 권한으로 전체 부서의 예산을 신청할 수 있습니다.
        </span>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-700 mb-1">기안자</label>
        <input
          type="text"
          :value="currentUser?.userName || '작성자'"
          readonly
          class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-500"
        />
      </div>

      <button
        type="button"
        @click="loadTemplateAndNext"
        :disabled="loading"
        class="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-2"
      >
        <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
        <span>다음: 예산편성 입력 →</span>
      </button>
    </div>

    <!-- 2단계: 예산편성 입력 (모바일 카드 뷰) -->
    <div v-else-if="currentTab === 1" class="space-y-4">
      <!-- 상단 요약 배너 -->
      <div class="bg-purple-600 text-white p-4 rounded-2xl shadow-md space-y-2">
        <div class="flex justify-between items-center text-xs opacity-90">
          <span>{{ selectedDeptName }}</span>
          <span>당해({{ baseYear }}) → {{ targetYear }}년</span>
        </div>
        <div class="flex justify-between items-end pt-1">
          <div>
            <div class="text-[11px] opacity-80">총 편성요청액</div>
            <div class="text-xl font-bold font-mono">{{ formatAmount(totalRequestAmount) }}원</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] opacity-80">증감</div>
            <div class="text-sm font-bold font-mono">{{ formatDiff(totalDiffAmount, totalPrevAmount) }}</div>
          </div>
        </div>
      </div>



      <!-- 상단 펼치기/접기 버튼 바 -->
      <div class="flex justify-end gap-1.5">
        <button
          type="button"
          @click="expandAll"
          class="px-2.5 py-1 text-xs bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-semibold transition shadow-2xs flex items-center gap-1"
        >
          <span>➕</span>
          <span>전체펼침</span>
        </button>
        <button
          type="button"
          @click="collapseAll"
          class="px-2.5 py-1 text-xs bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-semibold transition shadow-2xs flex items-center gap-1"
        >
          <span>➖</span>
          <span>전체접음</span>
        </button>
      </div>

      <!-- 계정별 카드 목록 -->
      <div class="space-y-2.5">
        <div
          v-for="item in visibleCategories"
          :key="item.id"
          class="rounded-xl border shadow-xs transition overflow-hidden"
          :class="getMobileCardClass(item)"
          :style="getMobileIndentStyle(item.depth)"
        >
          <!-- 카드 헤더 영역 (부모 계정인 경우 탭하여 접기/펼치기) -->
          <div
            class="p-3.5"
            :class="{ 'cursor-pointer select-none active:bg-black/5': item.has_children }"
            @click="item.has_children && toggleExpand(item.id)"
          >
            <!-- 메인 제목 줄 -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <!-- 폴딩 화살표 토글 버튼 (자식 있을 때) -->
                <button
                  v-if="item.has_children"
                  type="button"
                  @click.stop="toggleExpand(item.id)"
                  class="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 text-gray-700 font-bold shrink-0 text-xs transition-transform duration-150"
                  :class="{ 'rotate-90': item.is_expanded }"
                >
                  ▶
                </button>
                <span v-else class="text-xs text-gray-400 shrink-0">📄</span>

                <!-- 단계 뱃지 -->
                <span
                  class="px-2 py-0.5 text-[10px] rounded-md font-extrabold shrink-0 shadow-2xs"
                  :class="getMobileBadgeClass(item.level)"
                >{{ item.level }}</span>

                <!-- 계정명 -->
                <span :class="getMobileTitleClass(item.level, item.is_leaf)" class="truncate">
                  {{ item.category_name }}
                </span>

                <!-- 하위 항목 개수 뱃지 (자식이 있는 경우) -->
                <span
                  v-if="item.has_children"
                  class="px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0"
                  :class="item.is_expanded ? 'bg-black/10 text-gray-600' : 'bg-purple-600 text-white'"
                >
                  {{ item.children_count }}
                </span>

                <!-- 🆕 신규신청 뱃지 -->
                <span
                  v-if="item.is_new_category"
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0"
                >
                  신규
                </span>
              </div>

              <!-- 우측 증감액/증감율 -->
              <span class="text-xs font-mono font-semibold shrink-0" :class="getDiffClass(item.diff_amount)">
                {{ formatDiff(item.diff_amount, item.prev_amount) }}
              </span>
            </div>

            <!-- 당해년도 예산액 및 소계 표시 -->
            <div class="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>당해: <strong class="font-mono text-gray-700">{{ formatAmount(item.prev_amount) }}원</strong></span>
              <!-- 상위 계정인 경우 소계 강조 -->
              <span v-if="!item.is_leaf" class="text-xs font-semibold" :class="item.level === '관' ? 'text-blue-900' : 'text-purple-900'">
                소계: <span class="text-sm font-bold font-mono">{{ formatAmount(item.request_amount) }}원</span>
              </span>
            </div>

            <!-- 퀵 버튼 (+목추가, +세목추가) -->
            <div v-if="isLevelEligibleForAdd(item)" class="flex gap-1.5 mt-2 pt-2 border-t border-black/5" @click.stop>
              <button
                v-if="item.level === '항'"
                type="button"
                @click="openNewCategoryModal('목', item.id)"
                class="px-2 py-0.5 text-[11px] bg-white border border-purple-200 text-purple-700 rounded-md font-medium"
              >
                + 이 항에 신규 목 추가
              </button>
              <button
                v-if="item.level === '목'"
                type="button"
                @click="openNewCategoryModal('세목', item.id)"
                class="px-2 py-0.5 text-[11px] bg-white border border-green-200 text-green-700 rounded-md font-medium"
              >
                + 이 목에 신규 세목 추가
              </button>
            </div>
          </div>

          <!-- 최하위 Leaf 계정: 실제 금액 인풋 및 산출근거 입력창 -->
          <div v-if="item.is_leaf" class="p-3.5 bg-gray-50/70 border-t border-gray-100 space-y-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-700 shrink-0">편성요청:</span>
              <input
                v-if="isItemEditable(item)"
                type="text"
                inputmode="numeric"
                :value="item.request_amount ? item.request_amount.toLocaleString() : '0'"
                @input="handleAmountInput(item, $event)"
                @focus="$event.target.select()"
                class="flex-1 text-right font-mono border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-900 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
              />
              <div
                v-else
                class="flex-1 text-right font-mono border border-gray-200 bg-gray-100/90 rounded-lg p-2 text-sm font-bold text-gray-400 select-none cursor-not-allowed"
                :title="item.owner_dept_name ? `${item.owner_dept_name} 관리 계정으로 수정 불가` : '수정 불가'"
              >
                {{ formatAmount(item.request_amount) }}
              </div>
              <span class="text-xs text-gray-600">원</span>
            </div>

            <!-- 산출근거 -->
            <input
              v-if="isItemEditable(item)"
              type="text"
              v-model="item.calc_basis"
              placeholder="산출 근거 (예: 물가상승 반영)"
              class="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-purple-300 outline-none"
            />
            <div v-else class="flex items-center gap-1.5 p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-xs">
              <span class="font-bold text-amber-800">🏢 {{ item.owner_dept_name || '타 부서' }}</span>
              <span class="text-gray-500 text-[11px]">관리 계정 (수정 불가)</span>
            </div>

            <!-- 신규 신청 계정 삭제 버튼 -->
            <div v-if="item.is_new_category" class="flex justify-end pt-1">
              <button
                type="button"
                @click="removeNewCategory(item)"
                class="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <span>✕</span> <span>신규 신청 삭제</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="visibleCategories.length === 0" class="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          조회된 계정과목이 없습니다.
        </div>
      </div>

      <!-- 모바일 2단계 하단 버튼 그룹 -->
      <div class="flex gap-2 pt-2">
        <button
          type="button"
          @click="submitBudgetPlan('작성중')"
          :disabled="submitting"
          class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl text-sm transition"
        >
          임시저장
        </button>
        <button
          type="button"
          @click="goToTab(2)"
          class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition"
        >
          다음: 최종확인 →
        </button>
      </div>
    </div>

    <!-- 3단계: 최종확인 및 상신 -->
    <div v-else-if="currentTab === 2" class="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div class="p-4 bg-purple-50 rounded-xl space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">대상연도 / 부서:</span>
          <span class="font-bold text-gray-800">{{ targetYear }}년도 {{ selectedDeptName }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">당해({{ baseYear }}년) 예산:</span>
          <span class="font-mono text-gray-700">{{ formatAmount(totalPrevAmount) }}원</span>
        </div>
        <div class="flex justify-between border-t border-purple-200 pt-2">
          <span class="font-bold text-purple-900">편성요청 총액:</span>
          <span class="font-bold font-mono text-purple-700 text-base">{{ formatAmount(totalRequestAmount) }}원</span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-700 mb-1">📌 기안 의견</label>
        <textarea
          v-model="comment"
          rows="3"
          placeholder="예산안 총괄 변동 사유 및 운영 계획을 입력하세요."
          class="w-full border border-gray-300 rounded-lg p-2.5 text-xs"
        ></textarea>
      </div>

      <!-- 서명 (지출결의서 모바일 동일) -->
      <div>
        <label class="block text-xs font-bold text-gray-700 mb-1">✍️ 서명</label>
        <div class="relative w-full aspect-square border border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
          <canvas
            ref="canvas"
            width="320"
            height="320"
            class="w-full h-full touch-none"
            :class="{ 'cursor-not-allowed': isImageLoaded }"
          ></canvas>
          <button
            type="button"
            @click="clearCanvas(false)"
            class="absolute top-2 right-2 text-gray-400 hover:text-red-600 bg-white/90 rounded-full px-2 py-0.5 text-xs shadow"
            aria-label="서명 지우기"
          >
            ✕
          </button>
        </div>
        <p class="text-[11px] text-gray-500 mt-1.5">
          <span class="px-1 text-red-500 font-bold">✕</span>를 눌러 지우고 다시 서명할 수 있으며, <strong>기본서명</strong>으로 저장됩니다.
        </p>
      </div>

      <div class="pt-2">
        <button
          type="button"
          @click="submitBudgetPlan('결재진행중')"
          :disabled="submitting"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex justify-center items-center gap-2"
        >
          <span v-if="submitting" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>📤 결재 상신</span>
        </button>
      </div>
    </div>

    <!-- 📌 모바일 하단 고정 네비게이션 탭 바 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex justify-around py-2.5 z-30">
      <button
        v-for="(t, idx) in tabs"
        :key="t"
        @click="goToTab(idx)"
        class="flex-1 py-1 text-center font-bold text-xs transition"
        :class="[
          currentTab === idx ? 'text-purple-700' : 'text-gray-400',
          idx === 2 && !isStepValid(1) ? 'opacity-40' : ''
        ]"
      >
        {{ t }}
      </button>
    </div>

    <!-- 🌟 신규 계정 추가 모바일 모달 -->
    <div
      v-if="showNewCategoryModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
        <div class="p-4 bg-purple-600 text-white flex justify-between items-center">
          <div class="flex items-center gap-1.5 font-bold text-sm">
            <span>✨</span>
            <span>신규 계정(목 / 세목) 추가 신청</span>
          </div>
          <button
            type="button"
            @click="closeNewCategoryModal"
            class="text-white/80 hover:text-white p-1 text-base leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="p-4 space-y-3 text-xs">
          <div class="p-2.5 bg-purple-50 rounded-lg text-[11px] text-purple-900 leading-snug">
            💡 재정부에서 최종 승인 시 마스터에 정식 등록됩니다.
          </div>

          <!-- 단계 선택 (목 vs 세목) -->
          <div>
            <label class="block font-bold text-gray-700 mb-1">추가할 단계 <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                @click="setNewCategoryLevel('목')"
                :class="newCategoryForm.level === '목' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-gray-500 font-medium'"
                class="py-1.5 text-xs rounded transition text-center cursor-pointer"
              >
                📁 '목' 추가
              </button>
              <button
                type="button"
                @click="setNewCategoryLevel('세목')"
                :class="newCategoryForm.level === '세목' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-gray-500 font-medium'"
                class="py-1.5 text-xs rounded transition text-center cursor-pointer"
              >
                📄 '세목' 추가
              </button>
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1">
              <span v-if="newCategoryForm.level === '목'">상위 '항' 선택 (관 · 항)</span>
              <span v-else>상위 '목' 선택 (관 · 항 · 목)</span>
              <span class="text-red-500">*</span>
            </label>
            <select
              v-model="newCategoryForm.parentId"
              class="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
            >
              <option value="" disabled>
                {{ newCategoryForm.level === '목' ? '-- 상위 항 선택 --' : '-- 상위 목 선택 --' }}
              </option>
              <template v-if="newCategoryForm.level === '목'">
                <option v-for="opt in availableHangOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </template>
              <template v-else>
                <option v-for="opt in availableMokOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </template>
            </select>
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1">
              <span>신규 {{ newCategoryForm.level === '목' ? "'목'" : "'세목'" }} 계정명</span>
              <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="newCategoryForm.name"
              :placeholder="newCategoryForm.level === '목' ? '예: 선교행사비' : '예: 특별초청강사료'"
              class="w-full border border-gray-300 rounded-lg p-2 text-xs"
            />
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1">{{ targetYear }}년 편성요청 금액 (원)</label>
            <input
              type="text"
              inputmode="numeric"
              :value="newCategoryForm.amount ? Number(newCategoryForm.amount).toLocaleString() : ''"
              @input="handleNewModalAmountInput"
              placeholder="0"
              class="w-full text-right font-mono border border-gray-300 rounded-lg p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1">산출 근거</label>
            <input
              type="text"
              v-model="newCategoryForm.calcBasis"
              placeholder="신설 사유 입력"
              class="w-full border border-gray-300 rounded-lg p-2 text-xs"
            />
          </div>
        </div>

        <div class="p-3 bg-gray-50 border-t flex justify-end gap-2 text-xs">
          <button
            type="button"
            @click="closeNewCategoryModal"
            class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
          >
            취소
          </button>
          <button
            type="button"
            @click="confirmAddNewCategory"
            class="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold"
          >
            + 추가하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { useUserStore } from "@/store/userStore";
import { getCurrentYear } from "@/utils/dateUtils";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const props = defineProps({
  id: {
    type: [String, Number],
    default: null
  }
});

const tabs = ["1. 기본정보", "2. 예산편성", "3. 최종확인"];
const currentTab = ref(0);

const currentUser = computed(() => userStore.user);
const userDeptName = computed(() => userStore.user?.deptName || "");

// 권한 판별: 재정부 권한 또는 관리자 여부
const hasFinanceRole = computed(() => {
  const roles = userStore.user?.roles || [];
  const hasRole = roles.some(r => {
    const name = typeof r === "string" ? r : r.role_name;
    return name === "재정부" || name === "관리자";
  });
  return hasRole || userDeptName.value === "재정부";
});

// 재정부 권한은 전체 부서 선택 가능, 회계 권한 등은 본인 소속 부서만 신청 가능
const canChangeDept = computed(() => hasFinanceRole.value);

// 신청부서(selectedDeptName)가 해당 계정의 관리(Owner) 부서인지 판별 (수정 가능 여부)
const isItemEditable = (item) => {
  if (!item.is_leaf) return false;
  if (item.is_new_category) return true; // 신규 신청 계정은 직접 수정 가능
  if (item.owner_dept_name) {
    return item.owner_dept_name === selectedDeptName.value;
  }
  return !!item.is_owner;
};

// 특정 레벨(항 또는 목)에 신규 하위 계정 추가 가능한지 판별
const isLevelEligibleForAdd = (item) => {
  if (item.level !== "항" && item.level !== "목") return false;
  if (hasFinanceRole.value) return true;
  if (item.owner_dept_name) {
    return item.owner_dept_name === selectedDeptName.value;
  }
  return true;
};

const currentYear = getCurrentYear();
const yearOptions = [currentYear + 1];
const targetYear = ref(currentYear + 1);
const baseYear = computed(() => targetYear.value - 1);

const departmentOptions = ref([]);
const sortedDepartmentOptions = computed(() => {
  return [...departmentOptions.value].sort((a, b) => {
    const nameA = a.dept_name || "";
    const nameB = b.dept_name || "";
    return nameA.localeCompare(nameB, "ko-KR");
  });
});
const selectedDeptName = ref("");
const loading = ref(false);
const submitting = ref(false);

const rawCategories = ref([]);
const comment = ref("");
const userSignature = ref("");
const savedRequestId = ref(null);

/* ==========================================
   ✍️ 모바일 서명 캔버스 & 기본서명 로직
   ========================================== */
const canvas = ref(null);
let ctx = null;
let drawing = false;
const wasCleared = ref(false);
const hasNotified = ref(false);
const didRedrawAfterClear = ref(false);
const isImageLoaded = ref(false);
const hasInitialSignature = ref(false);

async function loadDefaultSignature() {
  try {
    const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
    const url = data?.signature;
    if (url) {
      await drawImageToCanvas(url);
      hasInitialSignature.value = true;
      userSignature.value = url;
      return;
    }
  } catch (e) {
    // 무시
  }
  hasInitialSignature.value = false;
  clearCanvas(true);
}

function drawImageToCanvas(src) {
  return new Promise((resolve) => {
    if (!canvas.value) return resolve();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (ctx && canvas.value) {
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height);
      }
      isImageLoaded.value = true;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

function getSignatureDataURL() {
  if (!canvas.value) return null;
  return canvas.value.toDataURL("image/png");
}

async function saveDefaultSignature() {
  const dataURL = getSignatureDataURL();
  if (!dataURL) return;
  try {
    await axios.put(
      "/api/users/me/signature",
      { signature: dataURL },
      { withCredentials: true }
    );
  } catch (e) {
    console.warn("기본서명 저장 실패:", e?.message || e);
  }
}

const startDrawTouch = (e) => {
  if (isImageLoaded.value) return;
  e.preventDefault();
  if (wasCleared.value && !hasNotified.value) {
    hasNotified.value = true;
  }
  if (wasCleared.value || !hasInitialSignature.value) {
    didRedrawAfterClear.value = true;
  }
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  drawing = true;
  ctx.beginPath();
  ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
};

const drawTouch = (e) => {
  e.preventDefault();
  if (!drawing) return;
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
  ctx.stroke();
};

const startDraw = (e) => {
  if (isImageLoaded.value) return;
  if (wasCleared.value && !hasNotified.value) hasNotified.value = true;
  if (wasCleared.value || !hasInitialSignature.value) didRedrawAfterClear.value = true;
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  drawing = true;
  ctx.beginPath();
  ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
};

const draw = (e) => {
  if (!drawing) return;
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  ctx.stroke();
};

const stopDraw = () => {
  drawing = false;
};

const clearCanvas = (skipMark = false) => {
  if (canvas.value && ctx) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
  isImageLoaded.value = false;
  if (!skipMark) {
    wasCleared.value = true;
    hasNotified.value = false;
    didRedrawAfterClear.value = false;
  }
};

const initCanvas = async () => {
  if (!canvas.value) return;
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  canvas.value.removeEventListener("touchstart", startDrawTouch);
  canvas.value.removeEventListener("touchmove", drawTouch);
  canvas.value.removeEventListener("touchend", stopDraw);
  canvas.value.removeEventListener("mousedown", startDraw);
  canvas.value.removeEventListener("mousemove", draw);
  canvas.value.removeEventListener("mouseup", stopDraw);

  canvas.value.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.value.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.value.addEventListener("touchend", stopDraw);
  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);

  await loadDefaultSignature();
};

watch(currentTab, async (newTab) => {
  if (newTab === 2) {
    await nextTick();
    await initCanvas();
  }
});

// 1단계에서 부서나 대상연도 변경 시 이전 로드 상태 초기화
watch([selectedDeptName, targetYear], () => {
  if (currentTab.value === 0 && !props.id && !route.params?.id) {
    savedRequestId.value = null;
    rawCategories.value = [];
  }
});

onMounted(async () => {
  try {
    const res = await axios.get("/api/departments");
    departmentOptions.value = res.data.departments || res.data || [];

    // 재정부 권한이 없으면(회계 등) 본인 소속 부서로 강제 고정
    if (!canChangeDept.value) {
      selectedDeptName.value = userDeptName.value || "";
    } else {
      selectedDeptName.value = userDeptName.value || departmentOptions.value[0]?.dept_name || "";
    }

    // 사용자 기본 서명 로드
    try {
      const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
      if (data?.signature) {
        userSignature.value = data.signature;
      }
    } catch {
      // 기본 서명 없을 시 패스
    }

    const targetId = props.id || route.params.id;
    if (targetId) {
      await loadExistingBudgetPlan(targetId);
    }
  } catch (err) {
    console.error("모바일 초기 데이터 로드 실패:", err);
  }
});

const loadExistingBudgetPlan = async (id) => {
  loading.value = true;
  try {
    const res = await axios.get(`/api/budget-plans/${id}`);
    if (res.data.success && res.data.report) {
      const rep = res.data.report;
      savedRequestId.value = rep.id;
      selectedDeptName.value = rep.dept_name || selectedDeptName.value;

      const yearMatch = rep.aliasName?.match(/(\d{4})년/);
      if (yearMatch) {
        targetYear.value = parseInt(yearMatch[1], 10);
      }

      comment.value = rep.comment || "";

      const drafterHistory = rep.history?.find(h => h.signature_path);
      if (drafterHistory?.signature_path) {
        userSignature.value = drafterHistory.signature_path;
      }

      const deptMap = {};
      departmentOptions.value.forEach(d => {
        deptMap[d.id] = d.dept_name;
      });

      if (rep.budgetPlanItems && rep.budgetPlanItems.length > 0) {
        rawCategories.value = rep.budgetPlanItems.map(it => {
          const ownerDeptName = it.owner_dept_id ? (deptMap[it.owner_dept_id] || "") : "";
          const isOwner = selectedDeptName.value ? (ownerDeptName === selectedDeptName.value) : true;
          return {
            id: it.category_id || it.id,
            category_id: it.category_code || it.category_id,
            parent_id: it.parent_id,
            category_name: it.category_name,
            level: it.level,
            owner_dept_id: it.owner_dept_id,
            owner_dept_name: ownerDeptName,
            is_owner: isOwner,
            is_leaf: it.is_leaf ? 1 : 0,
            is_new_category: !!it.is_new_category,
            prev_amount: Number(it.prev_amount || 0),
            request_amount: Number(it.request_amount || 0),
            diff_amount: Number(it.diff_amount || 0),
            calc_basis: it.calc_basis || ""
          };
        });

        recalculateRollups();
        collapseAll();
        currentTab.value = 1;
      }
    }
  } catch (err) {
    console.error("기존 예산편성서 로드 실패:", err);
    alert("예산편성서 정보를 불러오지 못했습니다.");
  } finally {
    loading.value = false;
  }
};

const loadTemplateAndNext = async () => {
  if (!selectedDeptName.value) {
    alert("신청 부서를 선택해주세요.");
    return;
  }
  loading.value = true;
  try {
    const res = await axios.get("/api/budget-plans/template", {
      params: {
        deptName: selectedDeptName.value,
        targetYear: targetYear.value
      }
    });

    if (res.data.draft && !savedRequestId.value) {
      const draft = res.data.draft;
      let promptMsg = "";

      if (draft.status === "재정부이관완료" || draft.status === "재정부이관") {
        promptMsg = `이전에 재정부이관이 완료된 [${selectedDeptName.value} ${targetYear.value}년도 예산편성서]가 있습니다.\n이전 승인 내용을 불러와서 이어서 작성하시겠습니까?`;
      } else if (draft.status === "결재반려" || draft.status === "반려") {
        promptMsg = `이전에 반려된 [${selectedDeptName.value} ${targetYear.value}년도 예산편성서]가 있습니다.\n반려된 이전 내용을 불러와서 이어서 작성하시겠습니까?`;
      } else {
        promptMsg = `이전에 임시저장된 [${selectedDeptName.value} ${targetYear.value}년도 예산편성서]가 있습니다.\n이어서 작성하시겠습니까?`;
      }

      const resume = confirm(promptMsg);
      if (resume) {
        await loadExistingBudgetPlan(draft.id);
        return;
      }
    }

    rawCategories.value = res.data.categories || [];
    recalculateRollups();
    collapseAll();
    currentTab.value = 1;
  } catch (err) {
    console.error("예산편성 템플릿 로드 실패:", err);
    alert("예산 템플릿을 불러오지 못했습니다.");
  } finally {
    loading.value = false;
  }
};

// 폴딩(접기/펼치기) 상태 관리 (기본은 모두 접힘)
const expandedIds = ref(new Set());

// 토글 함수
const toggleExpand = (id) => {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
};

// 모두 펼치기
const expandAll = () => {
  const childParentIds = new Set(rawCategories.value.map(c => c.parent_id).filter(Boolean));
  expandedIds.value = childParentIds;
};

// 모두 접기 (기본 상태)
const collapseAll = () => {
  expandedIds.value = new Set();
};

// 계층 구조에 따른 노출 항목 계산 (트리 계층 평탄화 및 depth, 자식 여부 계산)
const visibleCategories = computed(() => {
  if (!rawCategories.value || rawCategories.value.length === 0) return [];
  const byParent = {};
  rawCategories.value.forEach((c) => {
    const pid = c.parent_id || 0;
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(c);
  });

  const result = [];
  const traverse = (parentId, depth, isVisible, parentNames = []) => {
    const children = byParent[parentId] || [];
    children.forEach((c) => {
      c.depth = depth;
      c.children_count = (byParent[c.id] || []).length;
      c.has_children = c.children_count > 0;
      c.is_expanded = expandedIds.value.has(c.id);
      c.breadcrumb = parentNames.join(" › ");

      if (isVisible) {
        result.push(c);
      }
      // 직계 부모가 보이고, 부모가 펼쳐져 있어야 자식도 보임
      const childVisible = isVisible && c.is_expanded;
      traverse(c.id, depth + 1, childVisible, [...parentNames, c.category_name]);
    });
  };
  traverse(0, 1, true, []);
  return result;
});

const flatCategories = visibleCategories;

const recalculateRollups = () => {
  const items = rawCategories.value;
  if (!items || items.length === 0) return;

  const itemMap = {};
  items.forEach(it => { itemMap[it.id] = it; });

  items.forEach(it => {
    if (!it.is_leaf) {
      it.prev_amount = 0;
      it.request_amount = 0;
    }
  });

  items.forEach(it => {
    if (it.is_leaf) {
      let currentParentId = it.parent_id;
      while (currentParentId && itemMap[currentParentId]) {
        const parent = itemMap[currentParentId];
        parent.prev_amount += Number(it.prev_amount || 0);
        parent.request_amount += Number(it.request_amount || 0);
        currentParentId = parent.parent_id;
      }
    }
  });

  items.forEach(it => {
    it.diff_amount = Number(it.request_amount || 0) - Number(it.prev_amount || 0);
  });
};

const handleAmountInput = (item, event) => {
  const raw = event.target.value.replace(/[^0-9]/g, "");
  const num = raw ? parseInt(raw, 10) : 0;
  item.request_amount = num;
  event.target.value = num ? num.toLocaleString() : "";
  recalculateRollups();
};

const totalPrevAmount = computed(() => {
  return rawCategories.value
    .filter(it => it.is_leaf)
    .reduce((sum, it) => sum + Number(it.prev_amount || 0), 0);
});

const totalRequestAmount = computed(() => {
  return rawCategories.value
    .filter(it => it.is_leaf)
    .reduce((sum, it) => sum + Number(it.request_amount || 0), 0);
});

const totalDiffAmount = computed(() => {
  return totalRequestAmount.value - totalPrevAmount.value;
});

// 탭 이동 제어
const goToTab = (idx) => {
  if (idx === 1 && rawCategories.value.length === 0) {
    loadTemplateAndNext();
    return;
  }
  if (idx === 2 && !isStepValid(1)) return;
  currentTab.value = idx;
};

const isStepValid = (step) => {
  if (step === 1) return rawCategories.value.length > 0;
  return true;
};

/* ==========================================
   ✨ 모바일 신규 계정(목 / 세목) 추가 모달 로직
   ========================================== */
const showNewCategoryModal = ref(false);
const newCategoryForm = ref({
  level: "세목", // '목' 또는 '세목'
  parentId: "",
  name: "",
  amount: 0,
  calcBasis: ""
});

const setNewCategoryLevel = (lvl) => {
  newCategoryForm.value.level = lvl;
  if (lvl === "목") {
    newCategoryForm.value.parentId = availableHangOptions.value[0]?.id || "";
  } else {
    newCategoryForm.value.parentId = availableMokOptions.value[0]?.id || "";
  }
};

const availableHangOptions = computed(() => {
  const items = rawCategories.value || [];
  const itemMap = {};
  items.forEach(it => { itemMap[it.id] = it; });

  const hangs = items.filter(it => it.level === "항");
  return hangs.map(h => {
    const gwan = h.parent_id ? itemMap[h.parent_id] : null;
    const path = gwan?.category_name ? `[${gwan.category_name}] ` : "";
    return {
      id: h.id,
      label: `${path}${h.category_name}`
    };
  });
});

const availableMokOptions = computed(() => {
  const items = rawCategories.value || [];
  const itemMap = {};
  items.forEach(it => { itemMap[it.id] = it; });

  const moks = items.filter(it => it.level === "목");
  return moks.map(m => {
    const hang = m.parent_id ? itemMap[m.parent_id] : null;
    const gwan = hang && hang.parent_id ? itemMap[hang.parent_id] : null;
    const path = [gwan?.category_name, hang?.category_name].filter(Boolean).join(" > ");
    return {
      id: m.id,
      label: path ? `[${path}] ${m.category_name}` : m.category_name
    };
  });
});

const openNewCategoryModal = (preferredLevel = "세목", preferredParentId = null) => {
  const level = preferredLevel || "세목";
  let parentId = preferredParentId;
  if (!parentId) {
    parentId = level === "목" ? (availableHangOptions.value[0]?.id || "") : (availableMokOptions.value[0]?.id || "");
  }
  newCategoryForm.value = {
    level,
    parentId,
    name: "",
    amount: 0,
    calcBasis: ""
  };
  showNewCategoryModal.value = true;
};

const closeNewCategoryModal = () => {
  showNewCategoryModal.value = false;
};

const handleNewModalAmountInput = (e) => {
  const raw = e.target.value.replace(/[^0-9]/g, "");
  newCategoryForm.value.amount = raw ? parseInt(raw, 10) : 0;
};

const confirmAddNewCategory = () => {
  if (!newCategoryForm.value.parentId) {
    alert(newCategoryForm.value.level === "목" ? "상위 '항' 항목을 선택해주세요." : "상위 '목' 항목을 선택해주세요.");
    return;
  }
  const name = (newCategoryForm.value.name || "").trim();
  if (!name) {
    alert("신규 계정명을 입력해주세요.");
    return;
  }

  const parentId = newCategoryForm.value.parentId;
  const isDuplicate = rawCategories.value.some(
    it => it.parent_id === parentId && it.category_name === name
  );
  if (isDuplicate) {
    alert("동일한 상위 항목에 이미 존재하는 계정명입니다.");
    return;
  }

  const level = newCategoryForm.value.level;
  const parentItem = rawCategories.value.find(it => it.id === parentId);
  if (parentItem && level === "세목") {
    parentItem.is_leaf = 0;
  }

  const minId = rawCategories.value.reduce((min, it) => Math.min(min, typeof it.id === 'number' && it.id < 0 ? it.id : 0), 0);
  const tempId = minId - 1;
  const newItem = {
    id: tempId,
    category_id: tempId,
    category_code: "신규",
    parent_id: parentId,
    category_name: name,
    level: level,
    owner_dept_id: null,
    owner_dept_name: selectedDeptName.value,
    is_owner: true,
    is_leaf: 1,
    is_new_category: true,
    prev_amount: 0,
    request_amount: Number(newCategoryForm.value.amount || 0),
    diff_amount: Number(newCategoryForm.value.amount || 0),
    calc_basis: (newCategoryForm.value.calcBasis || "").trim()
  };

  rawCategories.value.push(newItem);
  recalculateRollups();
  expandedIds.value = new Set([...expandedIds.value, parentId]);
  closeNewCategoryModal();
};

const removeNewCategory = (item) => {
  if (!confirm(`'${item.category_name}' 신규 신청 계정을 삭제하시겠습니까?`)) return;

  const idx = rawCategories.value.findIndex(it => it.id === item.id);
  if (idx !== -1) {
    const parentId = item.parent_id;
    const childIds = rawCategories.value.filter(it => it.parent_id === item.id).map(it => it.id);
    rawCategories.value = rawCategories.value.filter(it => it.id !== item.id && !childIds.includes(it.id));

    if (parentId) {
      const remainingChildren = rawCategories.value.filter(it => it.parent_id === parentId);
      if (remainingChildren.length === 0) {
        const parentItem = rawCategories.value.find(it => it.id === parentId);
        if (parentItem && parentItem.level === "목") parentItem.is_leaf = 1;
      }
    }

    recalculateRollups();
  }
};

const submitBudgetPlan = async (status) => {
  if (status === "결재진행중") {
    try {
      const checkRes = await axios.get("/api/budget-plans/check-status", {
        params: {
          deptName: selectedDeptName.value,
          targetYear: targetYear.value,
          requestId: savedRequestId.value || undefined
        }
      });

      if (checkRes.data?.hasInProgress) {
        alert(`해당 연도(${targetYear.value}년도)의 ${selectedDeptName.value} 예산편성서가 이미 결재진행중입니다.\n기존 결재가 완료되거나 반려된 후에 상신할 수 있습니다.`);
        return;
      }

      if (checkRes.data?.hasTransferred) {
        const ok = confirm(`해당 연도(${targetYear.value}년도)의 ${selectedDeptName.value} 예산편성서는 이미 재정부이관이 완료된 건이 있습니다.\n계속 상신하시면 기존 건이 다시 업데이트됩니다.\n계속 진행하시겠습니까?`);
        if (!ok) return;
      }
    } catch (checkErr) {
      console.error("기존 건 상태 확인 오류:", checkErr);
    }

    if (!confirm(`총 ${formatAmount(totalRequestAmount.value)}원의 예산편성안을 결재 상신하시겠습니까?`)) return;
  }

  submitting.value = true;
  try {
    const signatureData = getSignatureDataURL() || userSignature.value;

    const payload = {
      requestId: savedRequestId.value || undefined,
      deptName: selectedDeptName.value,
      targetYear: targetYear.value,
      totalAmount: totalRequestAmount.value,
      comment: comment.value,
      status,
      items: rawCategories.value.map(it => ({
        id: it.id,
        category_id: it.id,
        category_code: String(it.category_id || it.id || ""),
        category_name: it.category_name,
        level: it.level,
        parent_id: it.parent_id,
        owner_dept_id: it.owner_dept_id,
        is_leaf: it.is_leaf,
        is_new_category: !!it.is_new_category,
        prev_amount: it.prev_amount,
        request_amount: it.request_amount,
        diff_amount: it.diff_amount,
        calc_basis: it.calc_basis
      })),
      signature: signatureData
    };

    const res = await axios.post("/api/budget-plans", payload);
    if (res.data.success) {
      if (res.data.requestId) {
        savedRequestId.value = res.data.requestId;
      }

      if ((wasCleared.value && didRedrawAfterClear.value) || (!hasInitialSignature.value && didRedrawAfterClear.value)) {
        await saveDefaultSignature();
      }

      alert(status === "결재진행중" ? "📤 예산편성서가 성공적으로 결재 상신되었습니다." : "💾 임시저장되었습니다.");

      if (status === "결재진행중") {
        router.push("/approvalList");
      }
    }
  } catch (err) {
    console.error("예산편성서 제출 실패:", err);
    if (err.response?.data?.message?.includes("foreign key") || err.response?.status === 404) {
      savedRequestId.value = null;
    }
    alert(err.response?.data?.message || "예산편성서 제출 중 오류가 발생했습니다.");
  } finally {
    submitting.value = false;
  }
};

const formatAmount = (num) => Number(num || 0).toLocaleString();

const formatDiff = (diff, prev) => {
  const d = Number(diff || 0);
  const p = Number(prev || 0);
  if (d === 0) return "0원 (0%)";
  const sign = d > 0 ? "+" : "";
  let pctStr = "";
  if (p > 0) {
    pctStr = `${sign}${((d / p) * 100).toFixed(1)}%`;
  } else if (d > 0) {
    pctStr = "+100%";
  } else {
    pctStr = "0%";
  }
  return `${sign}${d.toLocaleString()}원 (${pctStr})`;
};

const getDiffClass = (diff) => {
  const d = Number(diff || 0);
  if (d > 0) return "text-emerald-700 font-bold";
  if (d < 0) return "text-blue-700 font-bold";
  return "text-gray-400";
};

const getMobileCardClass = (item) => {
  switch (item.level) {
    case "관":
      return "border-l-[6px] border-l-blue-600 border-blue-200 bg-blue-50/70 shadow-xs";
    case "항":
      return "border-l-4 border-l-purple-500 border-purple-200 bg-purple-50/40";
    case "목":
      return "border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/30";
    default:
      return "border-l-4 border-l-gray-300 border-gray-200 bg-white";
  }
};

const getMobileIndentStyle = (depth) => {
  const margin = Math.max(0, (depth - 1) * 8);
  return margin > 0 ? { marginLeft: `${margin}px` } : {};
};

const getMobileBadgeClass = (level) => {
  switch (level) {
    case "관": return "bg-blue-600 text-white";
    case "항": return "bg-purple-600 text-white";
    case "목": return "bg-emerald-600 text-white";
    default: return "bg-gray-100 text-gray-700 border border-gray-300";
  }
};

const getMobileTitleClass = (level, isLeaf) => {
  if (level === "관") return "text-sm font-extrabold text-blue-950 tracking-tight";
  if (level === "항") return "text-sm font-bold text-purple-950";
  if (level === "목") return "text-sm font-semibold text-emerald-950";
  return isLeaf ? "text-xs font-semibold text-gray-800" : "text-xs font-bold text-gray-900";
};
</script>
