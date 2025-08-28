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
          @click="sendApprovalRequest"
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
  "documentType",
  "selectedDept",
  "author",
  "date",
  "totalAmount",
  "comment",
  "items",
]);
const emits = defineEmits(["update:comment", "prev", "generate"]);

/* ✅ 서버 저장 로직 */
const sendApprovalRequest = async () => {
  const data = {
    documentType: props.documentType,
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

  try {
    const response = await fetch("http://localhost:3001/api/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("서버 저장 실패");

    alert("✅ 결재요청이 성공적으로 저장되었습니다!");
  } catch (err) {
    console.error(err);
    alert("❌ 서버 저장 중 오류가 발생했습니다.");
  }
};
</script>
