<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📌 기본 정보 입력</h2>

    <!-- 문서 종류 선택 -->
    <div>
      <p class="text-lg font-semibold text-purple-700 mb-3">문서 종류</p>
      <div class="flex gap-4">
        <label
          v-for="type in documentTypes"
          :key="type"
          class="flex-1 cursor-pointer border rounded-lg p-4 text-center shadow-sm transition
                 hover:shadow-md"
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

    <!-- 부서명 / 작성자 / 제출일자 -->
    <div class="grid grid-cols-3 gap-4">
      <!-- 부서명 선택 -->
      <select
        :value="selectedDept"
        @change="$emit('update:selectedDept', $event.target.value)"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      >
        <option disabled value="">부서명 선택</option>
        <option v-for="(data, dept) in deptData" :key="dept" :value="dept">{{ dept }}</option>
      </select>

      <!-- 작성자 -->
      <input
        type="text"
        :value="author"
        @input="$emit('update:author', $event.target.value)"
        placeholder="작성자"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      />

      <!-- 제출일자 -->
      <input
        type="date"
        :value="date"
        @input="$emit('update:date', $event.target.value)"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      />
    </div>

    <!-- ✅ 청구요청 별칭 입력란 -->
    <div>
      <label class="block text-lg font-semibold text-gray-700 mb-2">청구요청 별칭</label>
      <input
        type="text"
        :value="aliasName"
        @input="$emit('update:aliasName', $event.target.value)"
        maxlength="100"
        placeholder="청구요청 별칭 입력 (최대 100자)"
        class="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 w-full"
      />
    </div>

    <!-- ✅ 안내 문구 추가 -->
    <p class="text-sm text-gray-500 italic">
      ◎ 청구목록 조회화면에서 기존 청구내역을 재사용하여 보고서를 작성할 수 있습니다.
    </p>

    <!-- 다음 버튼 -->
    <div class="flex justify-end mt-6">
      <button
        @click="$emit('next')"
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
      >
        다음 →
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps([
  "selectedDept",
  "author",
  "date",
  "deptData",
  "documentType",
  "aliasName", // ✅ 추가됨
]);

const emits = defineEmits([
  "update:selectedDept",
  "update:author",
  "update:date",
  "update:documentType",
  "update:aliasName", // ✅ 추가됨
  "next",
]);

// 문서 종류 리스트
const documentTypes = ["청구지출결의서", "정산지출결의서", "가불지출결의서"];
</script>
