<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center py-10 font-nanum">
    <div class="bg-white shadow-md rounded-2xl p-8 w-full max-w-xl">
      <h2 class="text-2xl font-bold text-purple-700 mb-6 text-center">📧 이메일 테스트 (Text 기반)</h2>

      <!-- 수신자 -->
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-600 mb-1">받는 사람 이메일(쉼표로 여러 개)</label>
        <input
          v-model="to"
          type="text"
          placeholder="user1@ex.com, user2@ex.com"
          class="w-full border rounded p-2 focus:ring-2 focus:ring-purple-400"
        />
        <p v-if="toError" class="text-red-500 text-xs mt-1">{{ toError }}</p>
      </div>

      <!-- 제목 -->
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-600 mb-1">제목(메일 타이틀)</label>
        <input
          v-model="title"
          type="text"
          placeholder="결재요청 등록 알림 - 지출결의서"
          class="w-full border rounded p-2 focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <!-- 본문(Text) -->
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-600 mb-1">본문(Text, 줄바꿈 지원)</label>
        <textarea
          v-model="bodyText"
          rows="7"
          class="w-full border rounded p-2 focus:ring-2 focus:ring-purple-400"
          placeholder="부서: 음악부&#10;작성자: 홍길동&#10;요청일자: 2025-10-10&#10;청구총액: ₩250,000"
        ></textarea>
      </div>

      <!-- 요청 ID(선택: 있으면 CTA 버튼 노출) -->
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-600 mb-1">요청 ID (선택)</label>
        <input
          v-model="requestId"
          type="number"
          placeholder="예: 59"
          class="w-full border rounded p-2 focus:ring-2 focus:ring-purple-400"
        />
        <p class="text-xs text-gray-500 mt-1">※ APP_BASE_URL이 설정되어 있고 ID가 있으면, 메일에 '상세보기' 버튼이 포함됩니다.</p>
      </div>

      <!-- CC (선택) -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-600 mb-1">CC (선택, 쉼표로 여러 개)</label>
        <input
          v-model="cc"
          type="text"
          placeholder="manager@ex.com, lead@ex.com"
          class="w-full border rounded p-2 focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <!-- 보내기 버튼 -->
      <button
        @click="sendEmail"
        :disabled="loading"
        class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {{ loading ? "발송 중..." : "메일 보내기" }}
      </button>

      <!-- 결과 메시지 -->
      <p v-if="message" class="mt-4 text-center" :class="ok ? 'text-green-700' : 'text-red-600'">
        {{ message }}
      </p>

      <!-- 텍스트 → HTML 미리보기(클라이언트 변환) -->
      <div v-if="bodyText" class="mt-6 border-t pt-4">
        <h3 class="text-sm font-semibold text-gray-500 mb-2">본문 미리보기 (줄바꿈 반영):</h3>
        <div class="border rounded-lg p-4 bg-gray-50 text-sm whitespace-pre-line">
          {{ bodyText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const to = ref("");
const cc = ref("");
const title = ref("결재요청 등록 알림 - 지출결의서");
const bodyText = ref(
  "새로운 결재요청이 등록되었습니다.\n\n부서: 음악부\n작성자: 홍길동\n요청일자: 2025-10-10\n청구총액: ₩250,000\n비고: 없음"
);
const requestId = ref("");

const message = ref("");
const ok = ref(false);
const loading = ref(false);
const toError = ref("");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function parseEmails(s) {
  return (s || "")
    .split(",")
    .map(v => v.trim())
    .filter(v => v.length > 0);
}
function validEmails(arr) {
  return arr.filter(e => emailRegex.test(e));
}

async function sendEmail() {
  message.value = "";
  ok.value = false;
  toError.value = "";

  // 수신자 정규화/검증
  const toList = validEmails(parseEmails(to.value));
  const ccList = validEmails(parseEmails(cc.value));

  if (toList.length === 0) {
    toError.value = "유효한 수신자 이메일을 1개 이상 입력하세요.";
    return;
  }
  if (!title.value?.trim()) {
    message.value = "제목을 입력하세요.";
    return;
  }
  if (!bodyText.value?.trim()) {
    message.value = "본문(Text)을 입력하세요.";
    return;
  }

  loading.value = true;
  try {
    // 서버의 text 기반 발송 엔드포인트 (예시)
    const res = await axios.post("/api/email/send-text", {
      to: toList.join(", "),
      cc: ccList.join(", "),
      title: title.value,
      bodyText: bodyText.value,
      requestId: requestId.value ? Number(requestId.value) : undefined,
    });

    if (res.data?.success) {
      ok.value = true;
      message.value = "✅ 메일이 성공적으로 발송되었습니다!";
    } else {
      message.value = "⚠️ 발송 실패: " + (res.data?.error || "원인 불명");
    }
  } catch (err) {
    message.value = "❌ 오류: " + (err.response?.data?.error || err.message);
  } finally {
    loading.value = false;
  }
}
</script>
