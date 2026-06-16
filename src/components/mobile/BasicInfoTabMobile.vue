<template>
  <div class="space-y-6 font-nanum px-2">
    <h2 class="text-lg font-bold text-gray-800 mb-2">📌 기본 정보 입력</h2>

    <!-- 청구 유형 선택 (아래 select와 같은 너비로 균등 배치) -->
    <div>
      <p class="text-base font-semibold text-purple-700 mb-2">청구 유형</p>
      <div class="grid grid-cols-3 gap-2">
        <label
          v-for="opt in documentTypeOptions"
          :key="opt.value"
          :data-testid="'claim-type-option-' + opt.value"
          class="cursor-pointer border rounded-lg px-4 py-3 text-center shadow-sm transition hover:shadow-md"
          :class="documentType === opt.value ? 'bg-purple-100 border-purple-500 text-purple-700 font-bold' : 'bg-white border-gray-300'"
        >
          <input
            type="radio"
            :value="opt.value"
            :checked="documentType === opt.value"
            @change="$emit('update:documentType', opt.value)"
            class="hidden"
          />
          <div class="flex flex-col sm:flex-row items-center justify-center leading-tight">
            <span>{{ opt.p1 }}</span>
            <span>{{ opt.p2 }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 부서명 / 작성자 / 제출일자 (세로 배치) -->
    <div class="space-y-3">
      <!-- 부서명: 재정부/관리자 권한 시 전체 부서 선택 가능, 그 외는 본인 부서만 비활성 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">부서명</label>
        <select
          :value="selectedDept"
          @input="$emit('update:selectedDept', $event.target.value)"
          :disabled="!canSelectDept"
          class="mobile-form-control mobile-form-control-select disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option v-for="d in departmentOptions" :key="d.id ?? d.dept_name" :value="d.dept_name">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <!-- 작성자 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">작성자</label>
        <input
        type="text"
        :value="author"
        disabled
        class="mobile-form-control bg-gray-100 text-gray-600 cursor-not-allowed"
      />
      </div>

      <!-- 영수인 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">영수인</label>
        <input
          type="text"
          :value="payee"
          @input="$emit('update:payee', $event.target.value)"
          placeholder="영수인 성명 입력"
          class="mobile-form-control"
        />
      </div>

      <!-- 제출일자 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">제출일자</label>
        <div class="mobile-form-control-date-wrap">
          <input
            type="date"
            :value="date"
            @input="$emit('update:date', $event.target.value)"
            class="mobile-form-control mobile-form-control-date"
          />
          <span class="mobile-form-control-date-icon" aria-hidden="true">📅</span>
        </div>
      </div>
    </div>

    <!-- 청구계좌 및 전화번호 -->
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">청구 계좌정보</label>
        <input
          type="text"
          :value="accountInfo"
          @input="$emit('update:accountInfo', $event.target.value)"
          placeholder="예: 국민 495201-01-22221112 홍길동"
          class="mobile-form-control"
        />
        <div v-if="isAccountInfoChanged" class="mt-2 flex items-center">
          <input 
            type="checkbox" 
            :checked="updateDeptAccountInfo"
            @change="$emit('update:updateDeptAccountInfo', $event.target.checked)"
            class="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
            id="chkUpdateAccountMobile"
          />
          <label for="chkUpdateAccountMobile" class="text-sm text-gray-600 cursor-pointer">부서정보에 설정된 계좌정보 업데이트</label>
        </div>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">청구자 전화번호</label>
        <input
          type="text"
          :value="requesterPhone"
          @input="handlePhoneInput($event)"
          maxlength="13"
          placeholder="전화번호 입력"
          class="mobile-form-control"
        />
      </div>
    </div>

    <!-- 청구요청 별칭 -->
    <div>
      <label class="block text-sm font-semibold text-gray-600 mb-1">청구요청 별칭</label>
      <input
        type="text"
        :value="aliasName"
        data-testid="alias-input"
        @input="$emit('update:aliasName', $event.target.value)"
        maxlength="100"
        placeholder="청구요청 별칭 입력"
        class="mobile-form-control"
      />
    </div>

    <!-- 다음 버튼 -->
    <div class="flex justify-center mt-4">
      <button
        @click="$emit('next')"
        data-testid="btn-next"
        class="bg-blue-500 hover:bg-blue-600 text-white w-full py-3 rounded-lg shadow-md transition text-base font-semibold"
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";

const props = defineProps([
  "selectedDept",
  "author",
  "payee",
  "date",
  "deptData",
  "documentType",
  "aliasName",
  "accountInfo",
  "requesterPhone",
  "updateDeptAccountInfo"
]);

const emits = defineEmits([
  "update:selectedDept",
  "update:author",
  "update:payee",
  "update:date",
  "update:documentType",
  "update:aliasName",
  "update:accountInfo",
  "update:requesterPhone",
  "update:updateDeptAccountInfo",
  "next",
]);

const handlePhoneInput = (event) => {
  let val = event.target.value.replace(/[^0-9]/g, "");
  if (val.length > 3 && val.length <= 7) {
    val = val.slice(0, 3) + "-" + val.slice(3);
  } else if (val.length > 7) {
    val = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
  }
  emits("update:requesterPhone", val);
  event.target.value = val;
};

// 청구 유형 리스트 (value: 저장/API용, label: 버튼 표시용)
// 모바일에서 줄바꿈 시 "지출" 앞에서 끊기도록 개별 span으로 처리 (ZWSP보다 신뢰도 높음)
const documentTypeOptions = [
  { value: "청구지출결의서", p1: "청구", p2: "지출" },
  { value: "정산지출결의서", p1: "정산", p2: "지출" },
  { value: "가불지출결의서", p1: "가불", p2: "지출" },
];

// 로그인 사용자
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

// 부서 목록 (기본정보 탭에서 선택용)
const departments = ref([]);
// 재정부 또는 관리자 권한일 때만 부서 선택 가능, 그 외는 본인 부서만 표시·비활성
const canSelectDept = computed(() => {
  const roles = user.value?.roles || [];
  return roles.some((r) => r.role_name === "재정부" || r.role_name === "관리자");
});
const departmentOptions = computed(() => {
  const list = departments.value || [];
  if (canSelectDept.value) return list;
  const deptName = user.value?.deptName;
  if (!deptName) return list;
  const mine = list.find((d) => d.dept_name === deptName);
  return mine ? [mine] : [{ id: null, dept_name: deptName }];
});

const isAccountInfoChanged = computed(() => {
  const dept = departments.value.find(d => d.dept_name === props.selectedDept);
  if (!dept) return false;
  const original = dept.account_info || "";
  const current = props.accountInfo || "";
  if (!original && !current) return false;
  return original !== current;
});

onMounted(async () => {
  try {
    const res = await axios.get("/api/departments");
    const list = (res.data || []).slice().sort((a, b) => (a.dept_name || "").localeCompare(b.dept_name || ""));
    departments.value = list;
  } catch (e) {
    console.error("부서 목록 로드 실패", e);
  }
  if (!props.selectedDept && user.value?.deptName) {
    emits("update:selectedDept", user.value.deptName);
  }
});
</script>
