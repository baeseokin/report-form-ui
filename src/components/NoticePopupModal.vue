<template>
  <Teleport to="body">
    <div
      v-if="isOpen && currentNotice"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-nanum"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-purple-100 animate-in fade-in zoom-in duration-200"
      >
        <!-- 모달 헤더 -->
        <div class="px-5 py-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-lg">📢</span>
            <h3 class="font-bold text-sm sm:text-base tracking-tight">공지사항 안내</h3>
            <span
              v-if="popupNotices.length > 1"
              class="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white"
            >
              {{ currentIndex + 1 }} / {{ popupNotices.length }}
            </span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition text-lg leading-none cursor-pointer"
            title="닫기"
          >
            ✕
          </button>
        </div>

        <!-- 모달 본문 영역 (스크롤 가능) -->
        <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <!-- 제목 및 메타정보 -->
          <div class="border-b border-gray-100 pb-3">
            <h4 class="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
              {{ currentNotice.title }}
            </h4>
            <div class="flex items-center gap-3 text-xs text-gray-500 mt-2">
              <span><strong>작성자:</strong> {{ currentNotice.author_name }}</span>
              <span><strong>작성일:</strong> {{ formatDate(currentNotice.created_at) }}</span>
            </div>
          </div>

          <!-- 공지 본문 내용 (Quill HTML) -->
          <div
            class="prose prose-sm max-w-none text-gray-800 quill-content ql-editor min-h-[120px] p-0"
            v-html="currentNotice.content"
          ></div>

          <!-- 첨부파일 목록 -->
          <div
            v-if="currentNotice.files && currentNotice.files.length > 0"
            class="bg-purple-50/50 rounded-xl p-3 border border-purple-100 space-y-1.5 text-xs"
          >
            <div class="font-bold text-purple-900 flex items-center gap-1 mb-1">
              <span>📎 첨부파일</span>
              <span class="text-purple-600 font-normal">({{ currentNotice.files.length }}개)</span>
            </div>
            <ul class="space-y-1">
              <li
                v-for="file in currentNotice.files"
                :key="file.id"
                class="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-purple-100"
              >
                <span class="truncate text-gray-700 pr-2">{{ file.original_name }}</span>
                <a
                  :href="'/api/files/' + encodeURIComponent(file.file_name) + '?downloadName=' + encodeURIComponent(file.original_name)"
                  :download="file.original_name"
                  class="text-purple-600 hover:text-purple-800 font-semibold shrink-0 cursor-pointer"
                >
                  다운로드
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- 모달 하단 (다시는 띄우지 않기 체크 및 닫기) -->
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <label class="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium">
            <input
              type="checkbox"
              v-model="doNotShowAgain"
              class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-400 cursor-pointer"
            />
            <span>다시는 띄우지 않기</span>
          </label>

          <div class="flex items-center gap-2">
            <!-- 공지가 여러 개일 경우 이전/다음 버튼 -->
            <button
              v-if="popupNotices.length > 1 && currentIndex > 0"
              type="button"
              @click="prevNotice"
              class="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-lg transition"
            >
              이전
            </button>
            <button
              v-if="popupNotices.length > 1 && currentIndex < popupNotices.length - 1"
              type="button"
              @click="nextNotice"
              class="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-lg transition"
            >
              다음
            </button>
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { useUserStore } from "@/store/userStore";

const userStore = useUserStore();

const isOpen = ref(false);
const popupNotices = ref([]);
const currentIndex = ref(0);
const doNotShowAgain = ref(false);

const currentNotice = computed(() => {
  return popupNotices.value[currentIndex.value] || null;
});

// 날짜 포맷
const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 팝업 공지 목록 로드 및 필터링
const checkPopupNotices = async () => {
  // 로그인한 사용자만 확인
  if (!userStore.user) return;

  try {
    const res = await axios.get("/api/notices/popups", { withCredentials: true });
    if (res.data?.success && Array.isArray(res.data.data)) {
      // "다시는 띄우지 않기" 처리된 공지 제외
      const valid = res.data.data.filter((n) => {
        const isDismissed = localStorage.getItem(`hide_notice_popup_${n.id}`);
        return !isDismissed;
      });

      popupNotices.value = valid;
      currentIndex.value = 0;
      doNotShowAgain.value = false;
      isOpen.value = valid.length > 0;
    }
  } catch (err) {
    console.error("팝업 공지 로드 실패:", err);
  }
};

// 이전 공지 보기
const prevNotice = () => {
  saveCurrentPreference();
  if (currentIndex.value > 0) {
    currentIndex.value--;
    doNotShowAgain.value = false;
  }
};

// 다음 공지 보기
const nextNotice = () => {
  saveCurrentPreference();
  if (currentIndex.value < popupNotices.value.length - 1) {
    currentIndex.value++;
    doNotShowAgain.value = false;
  }
};

// 현재 공지에 대해 "다시는 띄우지 않기" 체크 저장
const saveCurrentPreference = () => {
  if (currentNotice.value && doNotShowAgain.value) {
    try {
      localStorage.setItem(`hide_notice_popup_${currentNotice.value.id}`, "true");
    } catch (e) {
      console.warn("localStorage 저장 실패:", e);
    }
  }
};

// 닫기 처리
const handleClose = () => {
  saveCurrentPreference();
  isOpen.value = false;
};

// 컴포넌트 마운트 시 확인
onMounted(() => {
  checkPopupNotices();
});

// 사용자가 로그인하거나 변경될 때 다시 확인
watch(
  () => userStore.user?.userId,
  (newId) => {
    if (newId) {
      checkPopupNotices();
    } else {
      isOpen.value = false;
    }
  }
);

defineExpose({
  checkPopupNotices,
});
</script>

<style scoped>
/* Quill 에디터 스타일 정돈 */
:deep(.ql-editor) {
  padding: 0 !important;
  font-family: inherit;
}
:deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}
</style>
