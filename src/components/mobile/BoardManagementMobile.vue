<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen">

    <!-- ✅ 목록 화면 -->
    <div v-if="mode === 'list'" class="space-y-4">
      <!-- 상단 액션 버튼 영역 -->
      <div class="flex justify-end mb-4 px-1">
        <button
          @click="openForm()"
          class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 active:from-purple-700 active:to-indigo-700 text-white font-semibold text-sm rounded-full shadow-md active:shadow-sm transition-all"
        >
          <svg class="w-4 h-4 text-purple-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          새 글 쓰기
        </button>
      </div>

      <!-- 모바일 카드형 목록 -->
      <div v-if="boards.length > 0" class="space-y-3">
        <div
          v-for="(n, index) in boards"
          :key="n.id"
          class="border rounded-lg shadow-sm p-4 bg-white active:bg-gray-50 transition cursor-pointer"
          @click="viewBoard(n.id)"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 pr-2 min-w-0 flex items-center">
              <span class="font-bold text-gray-900 truncate leading-snug">{{ n.title }}</span>
              <span :class="n.comment_count > 0 ? 'text-purple-600' : 'text-gray-400'" class="ml-1 text-[11px] font-bold shrink-0">[{{ n.comment_count || 0 }}]</span>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span v-if="isNew(n.created_at)" class="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                New
              </span>
            </div>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-500 mt-2">
            <span>{{ n.author_name }}</span>
            <div class="flex space-x-3">
              <span>{{ formatDate(n.created_at) }}</span>
              <span>조회 {{ n.view_count }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center p-8 bg-white rounded-lg border text-gray-500 shadow-sm">
        등록된 게시글이 없습니다.
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-center space-x-2">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm rounded transition bg-white border active:bg-gray-100 disabled:opacity-50"
        >
          이전
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          @click="changePage(p)"
          :class="[
            'px-3 py-1 text-sm rounded transition',
            currentPage === p ? 'bg-gray-300 text-gray-800 font-medium' : 'bg-white border active:bg-gray-100'
          ]"
        >
          {{ p }}
        </button>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm rounded transition bg-white border active:bg-gray-100 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>

    <!-- ✅ 상세 보기 화면 -->
    <div v-else-if="mode === 'view'" class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
      <!-- 헤더 영역 -->
      <div class="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-bold text-gray-900 break-words mb-2 leading-tight">{{ currentBoard.title }}</h2>
        <div class="flex flex-wrap items-center text-xs text-gray-500 gap-y-1 gap-x-3 mt-2">
          <div><span class="font-semibold text-gray-700">작성자:</span> {{ currentBoard.author_name }}</div>
          <div><span class="font-semibold text-gray-700">작성일:</span> {{ formatDateTime(currentBoard.created_at) }}</div>
          <div><span class="font-semibold text-gray-700">조회수:</span> {{ currentBoard.view_count }}</div>
        </div>
      </div>

      <!-- 본문 영역 -->
      <div class="px-4 py-6 prose prose-sm max-w-none text-gray-800 quill-content ql-editor min-h-[150px]" v-html="currentBoard.content"></div>

      <!-- 첨부파일 영역 -->
      <div v-if="currentBoard.files && currentBoard.files.length > 0" class="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-700 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          첨부파일
        </h3>
        <ul class="space-y-2">
          <li v-for="file in currentBoard.files" :key="file.id" class="text-sm">
            <a :href="'/api/files/' + encodeURIComponent(file.file_name) + '?downloadName=' + encodeURIComponent(file.original_name)" :download="file.original_name" class="text-purple-600 active:text-purple-800 underline active:bg-purple-50 p-1 -ml-1 rounded flex items-start break-all">
              <span class="mr-1">🔗</span>
              <span>{{ file.original_name }} <span class="text-gray-400 whitespace-nowrap">({{ formatBytes(file.file_size) }})</span></span>
            </a>
          </li>
        </ul>
      </div>

      <!-- 댓글 영역 -->
      <div class="px-4 py-6 bg-white border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-800 mb-4">댓글 <span class="text-purple-600 ml-1">{{ currentBoard.comments?.length || 0 }}</span></h3>
        
        <!-- 새 본문 댓글 작성 폼 -->
        <div class="flex space-x-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <textarea 
            v-model="newComment.content" 
            rows="2" 
            class="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-sm resize-none w-full"
            placeholder="댓글을 남겨보세요."
          ></textarea>
          <button @click="submitComment()" :disabled="!newComment.content.trim()" class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition font-medium text-sm flex-shrink-0 disabled:opacity-50">등록</button>
        </div>

        <!-- 댓글 목록 트리 -->
        <div class="space-y-3">
          <template v-for="c in commentTree" :key="c.id">
            <!-- 최상위 댓글 -->
            <div class="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs text-gray-800">{{ c.author_name }}</span>
                <div class="flex items-center space-x-2 text-[10px] text-gray-500">
                  <span>{{ formatDateTime(c.created_at) }}</span>
                  <button @click="replyingTo = replyingTo === c.id ? null : c.id" class="text-purple-600 ml-1 font-medium bg-purple-50 px-2 py-0.5 rounded active:bg-purple-100">답글</button>
                  <button v-if="canEditOrDelete(c.author_id)" @click="deleteComment(c.id)" class="text-red-500 ml-1 font-medium bg-red-50 px-2 py-0.5 rounded active:bg-red-100">삭제</button>
                </div>
              </div>
              <p class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{{ c.content }}</p>

              <!-- 답글 폼 -->
              <div v-if="replyingTo === c.id" class="mt-3 flex space-x-2 p-3 bg-gray-50 rounded border border-gray-200">
                <textarea 
                  v-model="replyContent" 
                  rows="2" 
                  class="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-purple-500 outline-none text-xs resize-none"
                  placeholder="답글을 입력하세요."
                ></textarea>
                <div class="flex flex-col space-y-2">
                  <button @click="submitComment(c.id)" :disabled="!replyContent.trim()" class="px-3 py-1.5 bg-gray-800 text-white rounded active:bg-gray-900 transition font-medium text-[10px] disabled:opacity-50">등록</button>
                  <button @click="replyingTo = null" class="px-3 py-1.5 bg-white border text-gray-600 rounded active:bg-gray-100 transition font-medium text-[10px]">취소</button>
                </div>
              </div>
            </div>

            <!-- 대댓글 목록 -->
            <div v-if="c.replies && c.replies.length > 0" class="pl-6 space-y-2 mt-1 relative">
              <div class="absolute left-3 top-0 bottom-0 w-px bg-gray-200"></div>
              <div v-for="reply in c.replies" :key="reply.id" class="p-3 bg-gray-50 border border-gray-100 rounded shadow-sm relative">
                <div class="absolute -left-3 top-4 w-3 h-px bg-gray-200"></div>
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-xs text-gray-800 flex items-center">
                    <svg class="w-3 h-3 text-purple-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    {{ reply.author_name }}
                  </span>
                  <div class="flex items-center space-x-2 text-[10px] text-gray-500">
                    <span>{{ formatDateTime(reply.created_at) }}</span>
                    <!-- 대댓글에도 답글 버튼 제공 (부모 id 매핑) -->
                    <button @click="replyingTo = replyingTo === reply.id ? null : reply.id" class="text-purple-600 ml-1 font-medium bg-purple-50 px-2 py-0.5 rounded active:bg-purple-100">답글</button>
                    <button v-if="canEditOrDelete(reply.author_id)" @click="deleteComment(reply.id)" class="text-red-500 ml-1 font-medium bg-red-50 px-2 py-0.5 rounded active:bg-red-100">삭제</button>
                  </div>
                </div>
                <p class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{{ reply.content }}</p>

                <!-- 대댓글에 대한 답글 폼 -->
                <div v-if="replyingTo === reply.id" class="mt-3 flex space-x-2 p-3 bg-white rounded border border-gray-200">
                  <textarea 
                    v-model="replyContent" 
                    rows="2" 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-purple-500 outline-none text-xs resize-none"
                    placeholder="답글을 입력하세요."
                  ></textarea>
                  <div class="flex flex-col space-y-2">
                    <button @click="submitComment(c.id)" :disabled="!replyContent.trim()" class="px-3 py-1.5 bg-gray-800 text-white rounded active:bg-gray-900 transition font-medium text-[10px] disabled:opacity-50">등록</button>
                    <button @click="replyingTo = null" class="px-3 py-1.5 bg-gray-50 border text-gray-600 rounded active:bg-gray-100 transition font-medium text-[10px]">취소</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-if="!currentBoard.comments || currentBoard.comments.length === 0" class="text-xs text-center text-gray-400 py-6">
            등록된 댓글이 없습니다.
          </div>
        </div>
      </div>

      <!-- 하단 상태 조작 버튼 영역 -->
      <div class="px-4 py-4 bg-gray-100 border-t border-gray-200 flex flex-wrap gap-2 justify-between items-center mt-auto">
        <button
          @click="mode = 'list'; fetchBoards();"
          class="px-5 py-2 text-sm bg-gray-700 text-white rounded-lg active:bg-gray-800 transition font-medium"
        >
          목록으로
        </button>
        <div v-if="canEditOrDelete(currentBoard.author_id)" class="flex gap-2">
          <button
            @click="openForm(currentBoard)"
            class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg active:bg-purple-700 transition font-medium"
          >
            수정
          </button>
          <button
            @click="deleteBoard(currentBoard.id)"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg active:bg-red-700 transition font-medium"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ 등록 / 수정 폼 화면 -->
    <div v-else-if="mode === 'form'" class="bg-white border border-gray-200 shadow-sm rounded-lg p-4 mb-4">
      <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
        {{ form.id ? '게시글 수정' : '게시글 등록' }}
      </h2>

      <div class="space-y-4 flex flex-col">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">제목 <span class="text-red-500">*</span></label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-sm"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">내용 <span class="text-red-500">*</span></label>
          <div class="bg-white border border-gray-300 rounded pb-12 quill-container overflow-hidden">
            <QuillEditor
              v-model:content="form.content"
              contentType="html"
              theme="snow"
              :toolbar="customToolbar"
              style="min-height: 250px; padding-bottom: 2rem; border-color: transparent;"
            />
          </div>
        </div>

        <!-- 기존 첨부파일 목록 -->
        <div v-if="form.id && form.existingFiles.length > 0">
          <label class="block text-sm font-semibold text-gray-700 mb-1">기존 첨부파일 관리</label>
          <ul class="space-y-2">
            <li v-for="file in form.existingFiles" :key="file.id" class="flex justify-between items-center bg-gray-50 px-2 py-2 rounded border border-gray-200 text-xs">
              <span class="truncate pr-2 text-gray-700">{{ file.original_name }}</span>
              <button @click="markFileForDeletion(file.id)" class="text-red-500 font-medium whitespace-nowrap px-2 py-1 bg-red-50 rounded">
                삭제
              </button>
            </li>
          </ul>
        </div>
        
        <div v-if="form.deletedFileIds.length > 0" class="text-xs text-red-600 bg-red-50 px-2 py-2 rounded border border-red-100 flex justify-between items-center mt-2">
          <span>* 삭제 대기: {{ form.deletedFileIds.length }}개</span>
          <button @click="undoDeletions" class="text-purple-600 font-medium px-2 py-1 bg-white rounded shadow-sm border">되돌리기</button>
        </div>

        <!-- 임시 첨부파일 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">새로운 첨부파일</label>
          <div class="flex items-center justify-center w-full">
            <label
              class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer transition-colors relative text-center"
              :class="isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6 px-2">
                <p class="mb-1 text-xs text-gray-600"><span class="text-purple-600 font-medium">여기를 터치</span>해 파일 선택</p>
                <p class="text-[10px] text-gray-400">최대 10개 파일</p>
              </div>
              <input type="file" multiple class="hidden" @change="handleFileChange" />
            </label>
          </div>
          <ul v-if="form.newFiles.length > 0" class="mt-2 space-y-2">
            <li v-for="(file, index) in form.newFiles" :key="index" class="text-xs text-gray-700 flex items-center justify-between bg-white border border-gray-200 px-2 py-2 rounded">
              <span class="truncate pr-2">{{ file.name }} <span class="text-gray-400">({{ formatBytes(file.size) }})</span></span>
              <button @click="removeNewFile(index)" class="text-red-500 whitespace-nowrap font-medium px-2 py-1 bg-red-50 rounded">삭제</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button
          @click="mode = form.id ? 'view' : 'list'"
          class="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg active:bg-gray-50 transition font-medium flex-1 text-center"
        >
          취소
        </button>
        <button
          @click="saveBoard"
          :disabled="isSaving"
          class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg active:bg-purple-700 transition font-medium flex-1 text-center disabled:opacity-50 flex justify-center items-center"
        >
          <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSaving ? '저장 중...' : '저장' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useUserStore } from '@/store/userStore';
import { QuillEditor, Quill } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// ✅ 한글 폰트를 화이트리스트에 등록
const Font = Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'serif', 'monospace', 'nanum-gothic', 'nanum-myeongjo', 'noto-sans-kr'];
Quill.register(Font, true);

// 모바일용 커스텀 툴바 정의 (가로 폭이 좁으므로 필수 요소 위주로 간소화)
const customToolbar = [
  [{ 'font': Font.whitelist }, { 'size:': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
  ['link', 'image', 'video'],
  ['clean']
];

const userStore = useUserStore();

// 권한 체킹 로직
const isManager = computed(() => {
  const isDocAdmin = userStore.user?.roles?.some(r => r.role_name === '관리자');
  const isFinance = userStore.user?.deptName === '재정부';
  return isDocAdmin || isFinance;
});

const canEditOrDelete = (authorId) => {
  if (!userStore.user) return false;
  if (String(userStore.user.userId) === String(authorId)) return true;
  return isManager.value;
};

const mode = ref('list'); // 'list', 'view', 'form'
const boards = ref([]);
const totalItems = ref(0);
const currentPage = ref(1);
const limit = ref(10);
const totalPages = ref(1);

const currentBoard = ref(null);
const newComment = ref({ content: '' });
const replyingTo = ref(null);
const replyContent = ref('');
const isSaving = ref(false);

const commentTree = computed(() => {
  if (!currentBoard.value?.comments) return [];
  const map = {};
  const roots = [];
  
  // 깊은 복사 등을 통해 원본을 훼손되지 않게
  const comments = JSON.parse(JSON.stringify(currentBoard.value.comments));
  
  comments.forEach(c => {
    c.replies = [];
    map[c.id] = c;
  });
  
  comments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(c);
    } else if (c.parent_id && !map[c.parent_id]) {
       // 부모가 삭제되었거나 없는 경우
       roots.push(c);
    } else {
      roots.push(c);
    }
  });
  
  return roots;
});

const form = ref({
  id: null,
  title: '',
  content: '',
  existingFiles: [],
  deletedFileIds: [],
  newFiles: [],
});

const originalExistingFiles = ref([]);

// 날짜 비교로 New 아이콘 (최근 7일)
const isNew = (dateString) => {
  if (!dateString) return false;
  const curr = new Date();
  const reg = new Date(dateString);
  const diffTime = Math.abs(curr - reg);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays <= 7;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const fetchBoards = async () => {
  try {
    const res = await axios.get(`/api/boards?page=${currentPage.value}&limit=${limit.value}`);
    if (res.data.success) {
      boards.value = res.data.data;
      totalItems.value = res.data.total;
      totalPages.value = res.data.totalPages;
    }
  } catch (err) {
    console.error(err);
    alert('게시글 목록을 불러오는데 실패했습니다.');
  }
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchBoards();
};

const viewBoard = async (id) => {
  try {
    const res = await axios.get(`/api/boards/${id}`);
    if (res.data.success) {
      currentBoard.value = res.data.data;
      mode.value = 'view';
      newComment.value.content = '';
      replyingTo.value = null;
      replyContent.value = '';
    }
  } catch (err) {
    console.error(err);
    alert('게시글을 불러오는데 실패했습니다.');
  }
};

const submitComment = async (parentId = null) => {
  const content = parentId ? replyContent.value : newComment.value.content;
  if (!content.trim()) return;
  try {
    const res = await axios.post(`/api/boards/${currentBoard.value.id}/comments`, { 
      content,
      parent_id: parentId
    });
    if (res.data.success) {
      if (parentId) {
        replyContent.value = '';
        replyingTo.value = null;
      } else {
        newComment.value.content = '';
      }
      viewBoard(currentBoard.value.id);
    }
  } catch (err) {
    console.error(err);
    alert('댓글 작성 중 오류가 발생했습니다.');
  }
};

const deleteComment = async (commentId) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  try {
    const res = await axios.delete(`/api/boards/comments/${commentId}`);
    if (res.data.success) {
      viewBoard(currentBoard.value.id);
    }
  } catch (err) {
    console.error(err);
    if(err.response?.status === 403) alert('삭제 권한이 없습니다.');
    else alert('댓글 삭제 중 오류가 발생했습니다.');
  }
};

const openForm = (board = null) => {
  if (board) {
    form.value = {
      id: board.id,
      title: board.title,
      content: board.content || '', 
      existingFiles: board.files ? [...board.files] : [],
      deletedFileIds: [],
      newFiles: [],
    };
    originalExistingFiles.value = board.files ? [...board.files] : [];
  } else {
    form.value = {
      id: null,
      title: '',
      content: '',
      existingFiles: [],
      deletedFileIds: [],
      newFiles: [],
    };
    originalExistingFiles.value = [];
  }
  mode.value = 'form';
};

const isDragging = ref(false);

const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    form.value.newFiles.push(files[i]);
  }
};

const handleFileChange = (e) => {
  const files = e.target.files;
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    form.value.newFiles.push(files[i]);
  }
  e.target.value = '';
};

const removeNewFile = (index) => {
  form.value.newFiles.splice(index, 1);
};

const markFileForDeletion = (fileId) => {
  form.value.deletedFileIds.push(fileId);
  form.value.existingFiles = form.value.existingFiles.filter(f => f.id !== fileId);
};

const undoDeletions = () => {
  form.value.deletedFileIds = [];
  form.value.existingFiles = [...originalExistingFiles.value];
};

const saveBoard = async () => {
  if (!form.value.title.trim() || !form.value.content || form.value.content === '<p><br></p>') {
    alert('제목과 내용을 모두 입력해주세요.');
    return;
  }

  isSaving.value = true;
  const formData = new FormData();
  formData.append('title', form.value.title);
  formData.append('content', form.value.content);
  
  if (form.value.deletedFileIds.length > 0) {
    formData.append('deletedFileIds', JSON.stringify(form.value.deletedFileIds));
  }

  form.value.newFiles.forEach(file => {
    formData.append('files', file);
  });

  try {
    let res;
    if (form.value.id) {
      res = await axios.put(`/api/boards/${form.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      res = await axios.post('/api/boards', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    if (res.data.success) {
      mode.value = 'list';
      currentPage.value = 1;
      fetchBoards();
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || '저장에 실패했습니다.');
  } finally {
    isSaving.value = false;
  }
};

const deleteBoard = async (id) => {
  if (!confirm('종속된 댓글과 파일도 전부 삭제됩니다.\n게시글을 완전히 삭제하시겠습니까?')) return;
  
  try {
    const res = await axios.delete(`/api/boards/${id}`);
    if (res.data.success) {
      mode.value = 'list';
      currentPage.value = 1;
      fetchBoards();
    }
  } catch (err) {
    console.error(err);
    if(err.response?.status === 403) alert('삭제 권한이 없습니다.');
    else alert('게시글 삭제에 실패했습니다.');
  }
};

onMounted(() => {
  fetchBoards();
});
</script>

<style scoped>
/* =======================================
   Quill 에디터 폰트 커스텀 
======================================= */
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="nanum-gothic"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="nanum-gothic"]::before { content: '나눔고딕'; font-family: 'Nanum Gothic', sans-serif; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="nanum-myeongjo"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="nanum-myeongjo"]::before { content: '나눔명조'; font-family: 'Nanum Myeongjo', serif; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="noto-sans-kr"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="noto-sans-kr"]::before { content: '본고딕'; font-family: 'Noto Sans KR', sans-serif; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="sans-serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="sans-serif"]::before { content: '기본체 (Sans-Serif)'; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before { content: '바탕체 (Serif)'; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before { content: '고정폭 (Monospace)'; }

/* 실제 적용 폰트 */
.ql-font-nanum-gothic { font-family: 'Nanum Gothic', sans-serif; }
.ql-font-nanum-myeongjo { font-family: 'Nanum Myeongjo', serif; }
.ql-font-noto-sans-kr { font-family: 'Noto Sans KR', sans-serif; }

.ql-snow .ql-picker.ql-font { width: 100px; }
.ql-toolbar.ql-snow .ql-picker-label { padding-left: 4px; padding-right: 2px; }

/* 터치 피드백 */
button {
  transition: background-color 0.2s;
}
button:active {
  transform: scale(0.97);
}

/* 퀄모바일 컨테이너 커스텀 */
.quill-container :deep(.ql-editor) {
  min-height: 250px;
  font-family: inherit;
  font-size: 0.95rem;
  padding: 12px;
}

.quill-container :deep(.ql-toolbar) {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
  background-color: #f9fafb;
}

.quill-container :deep(.ql-container) {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
  font-family: 'NanumBarunGothic', sans-serif;
}
</style>
