<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
      <p><strong>부서명:</strong> {{ selectedDept }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>청구총액:</strong> {{ toKoreanAmount(totalAmount) }}원 (₩{{ totalAmount.toLocaleString() }})</p>
    </div>
    <h2 class="text-xl font-bold text-gray-800">📄 추가 의견</h2>
    <div>
      <textarea v-model="localComment" rows="4" maxlength="500" class="w-full border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-purple-400 resize-y"></textarea>
      <div class="flex justify-between text-sm text-gray-500">
        <span>최대 500자</span>
        <span>{{ localComment.length }}/500</span>
      </div>
    </div>
    <div class="flex justify-between">
      <button @click="$emit('prev')" class="bg-gray-400 text-white px-6 py-2 rounded-lg shadow-md">← 이전</button>
      <button @click="generate" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md">✅ 보고서 생성</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps(["selectedDept", "author", "date", "totalAmount", "comment"]);
const emit = defineEmits(["update", "prev", "generate"]);

const localComment = ref(props.comment);
watch(localComment, () => emit("update", { comment: localComment.value }));

const toKoreanAmount = (num) => {
  if (num === 0) return "영";
  const units = ["", "만", "억", "조"];
  const nums = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const small = ["", "십", "백", "천"];
  let res = "", unitIndex = 0;
  while (num > 0) {
    let part = num % 10000, partRes = "", digitIndex = 0;
    while (part > 0) {
      const d = part % 10;
      if (d > 0) partRes = nums[d] + small[digitIndex] + partRes;
      part = Math.floor(part / 10); digitIndex++;
    }
    if (partRes) res = partRes + units[unitIndex] + res;
    num = Math.floor(num / 10000); unitIndex++;
  }
  return res;
};

const generate = () => emit("generate");
</script>
