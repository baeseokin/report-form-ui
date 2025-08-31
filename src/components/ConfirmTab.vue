<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">📄 최종 확인</h2>
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
      <p><strong>문서 종류:</strong> {{ documentType }}</p>
      <p><strong>부서명:</strong> {{ selectedDept }}</p>
      <p><strong>작성자:</strong> {{ author }}</p>
      <p><strong>제출일자:</strong> {{ date }}</p>
      <p><strong>청구총액:</strong> ₩{{ totalAmount.toLocaleString() }}</p>
      <p><strong>청구요청 별칭:</strong> {{ aliasName }}</p>
    </div>

    <!-- ✅ 첨부파일 목록 표시 -->
    <div class="p-4 bg-gray-50 rounded-lg shadow-inner space-y-1">
      <h3 class="text-lg font-semibold text-gray-800">📎 첨부파일</h3>
      <ul v-if="attachedFiles && attachedFiles.length > 0" class="list-disc ml-6 mt-2">
        <li v-for="(f, idx) in attachedFiles" :key="idx">
          <span class="font-semibold text-purple-700">{{ f.aliasName || f.name }}</span>
          <span class="text-gray-700 ml-2">/ {{ f.name }}</span>
          <span class="text-sm text-gray-500 ml-2">
            ({{ (f.size / 1024).toFixed(1) }} KB)
          </span>
        </li>
      </ul>
      <p v-else class="text-gray-500">첨부된 파일이 없습니다.</p>
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
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          📤 결재요청
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";

const props = defineProps([
  "documentType",
  "selectedDept",
  "author",
  "date",
  "totalAmount",
  "comment",
  "items",
  "aliasName",
  "attachedFiles", // ✅ FileAttachTab.vue에서 전달된 파일 객체 { file, name, size, aliasName }
]);

const emits = defineEmits(["update:comment", "prev", "generate"]);

/* ✅ 결재요청 */
const sendApprovalRequest = async () => {
  try {
    // 1️⃣ 결재 요청 저장
    const data = {
      documentType: props.documentType,
      deptName: props.selectedDept,
      author: props.author,
      date: props.date,
      totalAmount: props.totalAmount,
      comment: props.comment,
      aliasName: props.aliasName,
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

    const res = await axios.post("/api/approval", data);
    if (!res.data.success) throw new Error("서버 저장 실패");

    const requestId = res.data.id;

    // 2️⃣ 첨부파일 업로드 (aliasName 포함)
    if (props.attachedFiles && props.attachedFiles.length > 0) {
      const formData = new FormData();
      const aliasNames = [];

      props.attachedFiles.forEach((f) => {
        formData.append("files", f.file);               // 실제 파일
        aliasNames.push(f.aliasName || f.name);         // 별칭 없으면 파일명
      });

      formData.append("aliasNames", JSON.stringify(aliasNames));

      await axios.post(`/api/approval/${requestId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    alert("✅ 결재요청 및 파일 저장 성공!");
  } catch (err) {
    console.error("❌ 결재요청 중 오류:", err);
    alert("❌ 결재요청 실패");
  }
};
</script>
