<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📌 기본 정보 입력</h2>

    <!-- 청구 유형 선택 (아래 부서명/작성자/제출일자 그리드와 동일 너비·균등 배치) -->
    <div>
      <p class="text-sm font-semibold text-gray-700 mb-3">청구 유형</p>
      <div class="grid grid-cols-3 gap-4">
        <label
          v-for="opt in documentTypeOptions"
          :key="opt.value"
          class="cursor-pointer border rounded-lg p-4 text-center shadow-sm transition
                 hover:shadow-md"
          :data-testid="'claim-type-option-' + opt.value"
          :class="documentType === opt.value ? 'bg-purple-100 border-purple-500 text-purple-700 font-bold' : 'bg-white border-gray-300'"
        >
          <input
            type="radio"
            :value="opt.value"
            :checked="documentType === opt.value"
            @change="$emit('update:documentType', opt.value)"
            class="hidden"
          />
          {{ opt.label }}
        </label>
      </div>
    </div>

    <!-- 부서명 / 작성자 / 영수인 / 제출일자 -->
    <div class="grid grid-cols-2 gap-x-6 gap-y-4">
      <!-- ✅ 부서 선택 -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">부서명</label>
        <select
          :value="selectedDept"
          @input="$emit('update:selectedDept', $event.target.value)"
          :disabled="!canSelectDept"
          class="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option v-for="d in departmentOptions" :key="d.id" :value="d.dept_name">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <!-- 작성자 -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">작성자</label>
        <input
          type="text"
          :value="author"
          disabled
          class="w-full border p-3 rounded-lg shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
        />
      </div>

      <!-- 영수인 -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">영수인</label>
        <input
          type="text"
          :value="payee"
          @input="$emit('update:payee', $event.target.value)"
          placeholder="영수인 성명 입력"
          class="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <!-- 제출일자 -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">제출일자</label>
        <input
          type="date"
          :value="date"
          @input="$emit('update:date', $event.target.value)"
          class="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>

    <!-- ✅ 청구요청 별칭 입력란 -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">청구요청 별칭</label>
      <input
        type="text"
        :value="aliasName"
        @input="$emit('update:aliasName', $event.target.value)"
        maxlength="100"
        data-testid="alias-input"
        placeholder="청구요청 별칭 입력 (최대 100자)"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 w-full"
      />
    </div>

    <!-- 다음 버튼 -->
    <div class="flex justify-end mt-6">
      <button
        @click="$emit('next')"
        data-testid="btn-next"
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";

const props = defineProps([
  "selectedDept",
  "author",
  "payee",
  "date",
  "deptData",
  "documentType",
  "aliasName",
]);

const emits = defineEmits([
  "update:selectedDept",
  "update:author",
  "update:payee",
  "update:date",
  "update:documentType",
  "update:aliasName",
  "next",
]);

// 청구 유형 리스트 (value: 저장/API용, label: 버튼 표시용)
const documentTypeOptions = [
  { value: "청구지출결의서", label: "청구지출" },
  { value: "정산지출결의서", label: "정산지출" },
  { value: "가불지출결의서", label: "가불지출" },
];

// ✅ 로그인 사용자 정보 불러오기
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

// ✅ 부서 목록 (기본정보 탭에서 선택용)
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
