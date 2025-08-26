<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
      <p><strong>문서 종류:</strong> {{ documentType }}</p>
      <p><strong>부서명:</strong> {{ selectedDept }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>청구총액:</strong> ₩{{ totalAmount.toLocaleString() }}</p>
    </div>

    <h2 class="text-xl font-bold text-gray-800">📌 추가 의견</h2>
    <textarea
      :value="comment"
      @input="$emit('update:comment', $event.target.value)"
      rows="4"
      maxlength="500"
      placeholder="여기에 코멘트를 입력하세요..."
      class="w-full border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-purple-400 resize-y"
    ></textarea>
    <p class="text-right text-sm text-gray-500 mt-1">{{ comment?.length || 0 }}/500</p>

    <div class="flex justify-between">
      <button
        @click="$emit('prev')"
        class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition"
      >
        ← 이전
      </button>

      <div class="flex gap-3">
        <button
          @click="$emit('generate')"
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          🔍 미리보기
        </button>

        <button
          @click="saveAsJson"
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          📤 결재요청
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps([
  "documentType", // ✅ 문서 종류 추가
  "selectedDept",
  "author",
  "date",
  "totalAmount",
  "comment",
  "items",
]);
const emits = defineEmits(["update:comment", "prev", "generate"]);

/* ✅ JSON 저장 (결재요청 버튼) */
const saveAsJson = () => {
  const data = {
    documentType: props.documentType, // ✅ 포함
    deptName: props.selectedDept,
    author: props.author,
    date: props.date,
    totalAmount: props.totalAmount,
    comment: props.comment,
    items:
      props.items?.map((i) => ({
        gwan: i.gwan,
        hang: i.hang,
        mok: i.mok,
        semok: i.semok,
        detail: i.detail,
        amount: i.amount,
      })) || [],
  };

  // ✅ 파일 이름 동적 생성
  const fileName = `${props.documentType}_${props.selectedDept || "부서"}_${props.author || "작성자"}_${props.date || "날짜"}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};
</script>
