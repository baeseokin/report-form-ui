<template>
  <div class="space-y-6 font-nanum px-2">
    <h2 class="text-lg font-bold text-gray-800 mb-2">📌 기본 정보 입력</h2>

    <!-- 문서 종류 선택 (세로 배치) -->
    <div>
      <p class="text-base font-semibold text-purple-700 mb-2">문서 종류</p>
      <div class="flex flex-col gap-2">
        <label
          v-for="type in documentTypes"
          :key="type"
          class="cursor-pointer border rounded-lg px-4 py-3 text-center shadow-sm transition hover:shadow-md"
          :class="documentType === type ? 'bg-purple-100 border-purple-500 text-purple-700 font-bold' : 'bg-white border-gray-300'"
        >
          <input
            type="radio"
            :value="type"
            :checked="documentType === type"
            @change="$emit('update:documentType', type)"
            class="hidden"
          />
          {{ type }}
        </label>
      </div>
    </div>

    <!-- 부서명 / 작성자 / 제출일자 (세로 배치) -->
    <div class="space-y-3">
      <!-- 부서명 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">부서명</label>
        <input
          type="text"
          :value="user?.deptName"
          readonly
          class="border p-3 rounded-lg shadow-sm bg-gray-100 w-full cursor-not-allowed text-sm"
        />
      </div>

      <!-- 작성자 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">작성자</label>
        <input
          type="text"
          :value="author"
          @input="$emit('update:author', $event.target.value)"
          placeholder="작성자"
          class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 w-full text-sm"
        />
      </div>

      <!-- 제출일자 -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">제출일자</label>
        <input
          type="date"
          :value="date"
          @input="$emit('update:date', $event.target.value)"
          class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 w-full text-sm"
        />
      </div>
    </div>

    <!-- 청구요청 별칭 -->
    <div>
      <label class="block text-sm font-semibold text-gray-600 mb-1">청구요청 별칭</label>
      <input
        type="text"
        :value="aliasName"
        @input="$emit('update:aliasName', $event.target.value)"
        maxlength="100"
        placeholder="청구요청 별칭 입력"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 w-full text-sm"
      />
    </div>

    <!-- 안내 문구 -->
    <p class="text-xs text-gray-500 italic leading-snug">
      ◎ 청구목록 조회화면에서 기존 청구내역을 재사용하여 보고서를 작성할 수 있습니다.
    </p>

    <!-- 다음 버튼 -->
    <div class="flex justify-center mt-4">
      <button
        @click="$emit('next')"
        class="bg-blue-500 hover:bg-blue-600 text-white w-full py-3 rounded-lg shadow-md transition text-base font-semibold"
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";

const props = defineProps([
  "selectedDept",
  "author",
  "date",
  "deptData",
  "documentType",
  "aliasName",
]);

const emits = defineEmits([
  "update:selectedDept",
  "update:author",
  "update:date",
  "update:documentType",
  "update:aliasName",
  "next",
]);

// 문서 종류 리스트
const documentTypes = ["청구지출결의서", "정산지출결의서", "가불지출결의서"];

// 로그인 사용자
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
</script>
