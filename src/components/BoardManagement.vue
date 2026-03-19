<template>
  <div class="p-6 font-nanum">

    <!-- ✅ 목록 화면 -->
    <div v-if="mode === 'list'" class="space-y-6">
      <!-- 상단 액션 버튼 영역 -->
      <div class="flex justify-end mb-4">
        <button
          @click="openForm()"
          class="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          <svg class="w-4 h-4 text-purple-100 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          새 게시글 쓰기
        </button>
      </div>

      <!-- 결과 테이블 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-purple-100 text-gray-700">
              <th class="border py-1 px-3 text-center h-10 w-16">No</th>
              <th class="border py-1 px-3 text-center h-10">제목</th>
              <th class="border py-1 px-3 text-center h-10 w-32">작성자</th>
              <th class="border py-1 px-3 text-center h-10 w-32">작성일</th>
              <th class="border py-1 px-3 text-center h-10 w-24">조회수</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(n, index) in boards"
              :key="n.id"
              class="hover:bg-purple-50 transition cursor-pointer"
              @click="viewBoard(n.id)"
            >
              <td class="border p-3 text-center">
                {{ totalItems - (currentPage - 1) * limit - index }}
              </td>
              <td class="border p-3 text-left font-medium text-gray-900">
                <div class="flex items-center gap-2">
                  <span class="truncate block max-w-md md:max-w-xl">{{ n.title }}</span>
                  <span :class="n.comment_count > 0 ? 'text-purple-600 tracking-wider' : 'text-gray-400'" class="font-bold text-xs">[{{ n.comment_count || 0 }}]</span>
                  <span v-if="isNew(n.created_at)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    New
                  </span>
                </div>
              </td>
              <td class="border p-3 text-center">{{ n.author_name }}</td>
              <td class="border p-3 text-center">{{ formatDate(n.created_at) }}</td>
              <td class="border p-3 text-center">{{ n.view_count }}</td>
            </tr>
            <tr v-if="boards.length === 0">
              <td colspan="5" class="text-center p-6 text-gray-500">
                등록된 게시글이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center space-x-2">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-4 py-1 rounded-lg transition bg-white border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          @click="changePage(p)"
          :class="[
            'px-4 py-1 rounded-lg transition',
            currentPage === p ? 'bg-gray-300 text-gray-800 font-medium' : 'bg-white border hover:bg-gray-100'
          ]"
        >
          {{ p }}
        </button>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-4 py-1 rounded-lg transition bg-white border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>

    <!-- ✅ 상세 보기 화면 -->
    <div v-else-if="mode === 'view'" class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px] flex flex-col">
      <!-- 헤더 영역 -->
      <div class="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div class="flex justify-between items-start mb-2">
          <h2 class="text-xl font-bold text-gray-900 break-words leading-snug">{{ currentBoard.title }}</h2>
        </div>
        <div class="flex flex-wrap items-center text-sm text-gray-500 space-x-4">
          <div class="flex items-center">
            <span class="font-semibold mr-1 text-gray-700">작성자:</span> {{ currentBoard.author_name }}
          </div>
          <div class="flex items-center">
            <span class="font-semibold mr-1 text-gray-700">작성일:</span> {{ formatDateTime(currentBoard.created_at) }}
          </div>
          <div class="flex items-center">
            <span class="font-semibold mr-1 text-gray-700">조회수:</span> {{ currentBoard.view_count }}
          </div>
        </div>
      </div>

      <!-- 본문 영역 -->
      <div class="px-6 py-8 prose max-w-none text-gray-800 quill-content ql-editor min-h-[200px]" v-html="currentBoard.content"></div>

      <!-- 첨부파일 영역 -->
      <div v-if="currentBoard.files && currentBoard.files.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          첨부파일
        </h3>
        <ul class="space-y-2">
          <li v-for="file in currentBoard.files" :key="file.id" class="flex items-center text-sm">
            <a :href="'/api/files/' + encodeURIComponent(file.file_name) + '?downloadName=' + encodeURIComponent(file.original_name)" :download="file.original_name" class="text-purple-600 hover:text-purple-800 hover:underline flex items-center transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {{ file.original_name }} <span class="text-gray-400 ml-1">({{ formatBytes(file.file_size) }})</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- 댓글 영역 -->
      <div class="px-6 py-6 border-t border-gray-200 bg-white flex-1">
        <h3 class="text-base font-bold text-gray-800 mb-4">댓글 <span class="text-purple-600 ml-1">{{ currentBoard.comments?.length || 0 }}</span></h3>
        
        <!-- 새 본문 댓글 작성 폼 -->
        <div class="flex space-x-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <textarea 
            v-model="newComment.content" 
            rows="2" 
            class="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-sm resize-none"
            placeholder="댓글을 남겨보세요."
          ></textarea>
          <button @click="submitComment()" :disabled="!newComment.content.trim()" class="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition font-medium text-sm flex-shrink-0 disabled:opacity-50">등록</button>
        </div>

        <!-- 댓글 목록 트리 -->
        <div class="space-y-3">
          <template v-for="c in commentTree" :key="c.id">
            <!-- 최상위 댓글 -->
            <div class="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-sm text-gray-800">{{ c.author_name }}</span>
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{{ formatDateTime(c.created_at) }}</span>
                  <button @click="replyingTo = replyingTo === c.id ? null : c.id" class="text-purple-600 hover:text-purple-800 ml-2 font-medium bg-purple-50 px-2 py-0.5 rounded">답글</button>
                  <button v-if="canEditOrDelete(c.author_id)" @click="deleteComment(c.id)" class="text-red-500 hover:text-red-700 ml-2 font-medium bg-red-50 px-2 py-0.5 rounded">삭제</button>
                </div>
              </div>
              <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ c.content }}</p>

              <!-- 답글 폼 (해당 댓글에 답글 버튼 클릭 시) -->
              <div v-if="replyingTo === c.id" class="mt-3 flex space-x-2 p-3 bg-gray-50 rounded border border-gray-200">
                <textarea 
                  v-model="replyContent" 
                  rows="2" 
                  class="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-purple-500 outline-none text-sm resize-none"
                  placeholder="답글을 입력하세요."
                ></textarea>
                <div class="flex flex-col space-y-2">
                  <button @click="submitComment(c.id)" :disabled="!replyContent.trim()" class="px-4 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-900 transition font-medium text-xs flex-shrink-0 disabled:opacity-50">등록</button>
                  <button @click="replyingTo = null" class="px-4 py-1.5 bg-white border text-gray-600 rounded hover:bg-gray-100 transition font-medium text-xs flex-shrink-0">취소</button>
                </div>
              </div>
            </div>

            <!-- 대댓글 목록 -->
            <div v-if="c.replies && c.replies.length > 0" class="pl-8 space-y-2 mt-1 relative">
              <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
              <div v-for="reply in c.replies" :key="reply.id" class="p-3 bg-gray-50 border border-gray-100 rounded shadow-sm relative">
                <div class="absolute -left-4 top-4 w-4 h-px bg-gray-200"></div>
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-sm text-gray-800 flex items-center">
                    <svg class="w-3 h-3 text-purple-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    {{ reply.author_name }}
                  </span>
                  <div class="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{{ formatDateTime(reply.created_at) }}</span>
                    <!-- 대댓글에도 답글을 달 수 있게 하려면 c.id(최상위 부모)로 매핑하거나 reply.id로 할 수 있음. 대댓글의 답글도 부모밑으로 1단계만 중첩하기 위해 c.id 지정 -->
                    <button @click="replyingTo = replyingTo === reply.id ? null : reply.id" class="text-purple-600 hover:text-purple-800 ml-2 font-medium bg-purple-50 px-2 py-0.5 rounded">답글</button>
                    <button v-if="canEditOrDelete(reply.author_id)" @click="deleteComment(reply.id)" class="text-red-500 hover:text-red-700 ml-2 font-medium bg-red-50 px-2 py-0.5 rounded">삭제</button>
                  </div>
                </div>
                <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ reply.content }}</p>

                <!-- 대댓글에 대한 답글 폼 (실제로는 최상위 부모 c.id의 자식으로 등록) -->
                <div v-if="replyingTo === reply.id" class="mt-3 flex space-x-2 p-3 bg-white rounded border border-gray-200">
                  <textarea 
                    v-model="replyContent" 
                    rows="2" 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-purple-500 outline-none text-sm resize-none"
                    placeholder="답글을 입력하세요."
                  ></textarea>
                  <div class="flex flex-col space-y-2">
                    <button @click="submitComment(c.id)" :disabled="!replyContent.trim()" class="px-4 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-900 transition font-medium text-xs flex-shrink-0 disabled:opacity-50">등록</button>
                    <button @click="replyingTo = null" class="px-4 py-1.5 bg-gray-50 border text-gray-600 rounded hover:bg-gray-100 transition font-medium text-xs flex-shrink-0">취소</button>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <div v-if="!currentBoard.comments || currentBoard.comments.length === 0" class="text-sm text-center text-gray-400 py-8">
            등록된 댓글이 없습니다.
          </div>
        </div>
      </div>

      <!-- 하단 상태 조작 버튼 영역 -->
      <div class="px-6 py-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center mt-auto">
        <button
          @click="mode = 'list'; fetchBoards();"
          class="px-5 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          목록으로
        </button>
        <div v-if="canEditOrDelete(currentBoard.author_id)" class="flex space-x-2">
          <button
            @click="openForm(currentBoard)"
            class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            수정
          </button>
          <button
            @click="deleteBoard(currentBoard.id)"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ 등록 / 수정 폼 화면 -->
    <div v-else-if="mode === 'form'" class="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
        {{ form.id ? '게시글 수정' : '게시글 등록' }}
      </h2>

      <div class="space-y-6 flex flex-col items-center">
        <!-- 제목 -->
        <div class="w-full">
          <label class="block text-sm font-semibold text-gray-700 mb-2">제목 <span class="text-red-500">*</span></label>
          <input
            v-model="form.title"
            type="text"
            class="w-full max-w-3xl px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition"
            placeholder="제목을 입력하세요"
          />
        </div>

        <!-- 내용 -->
        <div class="w-full">
          <label class="block text-sm font-semibold text-gray-700 mb-2">내용 <span class="text-red-500">*</span></label>
          <div class="bg-white border border-gray-300 rounded-lg pb-12 quill-container overflow-hidden">
            <QuillEditor
              v-model:content="form.content"
              contentType="html"
              theme="snow"
              :toolbar="customToolbar"
              style="min-height: 400px; padding-bottom: 2rem; border-color: transparent;"
            />
          </div>
        </div>

        <!-- 기존 첨부파일 목록 -->
        <div v-if="form.id && form.existingFiles.length > 0" class="w-full max-w-3xl self-start">
          <label class="block text-sm font-semibold text-gray-700 mb-2">기존 첨부파일 관리</label>
          <ul class="space-y-2">
            <li v-for="file in form.existingFiles" :key="file.id" class="flex justify-between items-center bg-gray-50 px-3 py-2 rounded border border-gray-200">
              <span class="truncate pr-4 text-sm text-gray-700">{{ file.original_name }}</span>
              <button @click="markFileForDeletion(file.id)" class="text-red-500 hover:text-red-700 font-medium text-sm whitespace-nowrap bg-red-50 px-3 py-1 rounded">
                삭제
              </button>
            </li>
          </ul>
        </div>
        
        <!-- 삭제 예정 파일 복구 버튼 -->
        <div v-if="form.deletedFileIds.length > 0" class="w-full max-w-3xl self-start text-sm text-red-600 bg-red-50 px-4 py-3 rounded border border-red-200 flex justify-between items-center">
          <span class="font-medium">* 기존 파일 중 {{ form.deletedFileIds.length }}개가 저장 시 삭제됩니다.</span>
          <button @click="undoDeletions" class="text-purple-600 hover:text-purple-800 font-medium px-3 py-1 bg-white rounded shadow-sm border hover:bg-gray-50 transition">실행 취소</button>
        </div>

        <!-- 신규 첨부파일 드래그 앤 드롭 영역 -->
        <div class="w-full max-w-3xl self-start mt-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">새로운 첨부파일</label>
          <div class="flex items-center justify-center w-full">
            <label
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors relative text-center"
              :class="isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <svg class="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p class="mb-2 text-sm text-gray-600"><span class="font-semibold text-purple-600">클릭</span> 또는 파일을 여기로 드래그</p>
                <p class="text-xs text-gray-500">최대 10개 파일 첨부 가능</p>
              </div>
              <input type="file" multiple class="hidden" @change="handleFileChange" />
            </label>
          </div>
          
          <ul v-if="form.newFiles.length > 0" class="mt-4 space-y-2">
            <li v-for="(file, index) in form.newFiles" :key="index" class="text-sm text-gray-700 flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded">
              <span class="truncate pr-4">{{ file.name }} <span class="text-gray-400 ml-1">({{ formatBytes(file.size) }})</span></span>
              <button @click="removeNewFile(index)" class="text-red-500 hover:text-red-700 font-medium whitespace-nowrap bg-red-50 px-3 py-1 rounded">삭제</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 하단 버튼 영역 -->
      <div class="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          @click="mode = form.id ? 'view' : 'list'"
          class="px-6 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          취소
        </button>
        <button
          @click="saveBoard"
          :disabled="isSaving"
          class="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

// 커스텀 툴바 정의 (풀 옵션에 한글 폰트 주입 및 비디오 허용)
const customToolbar = [
  [{ 'font': Font.whitelist }],
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'align': [] }],
  [{ 'color': [] }, { 'background': [] }],
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
       // 부모가 삭제되었거나 없는 경우 최상위로 올림
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
      // 댓글 작성 후 상세화면 리프레시
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
      // 댓글 삭제 후 상세화면 리프레시
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

<style>
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

.ql-snow .ql-picker.ql-font { width: 130px; }

/* 기본 Quill 컨테이너 커스텀 */
.quill-container .ql-editor {
  min-height: 400px;
  font-family: inherit;
  font-size: 1rem;
}

.quill-container .ql-toolbar {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  background-color: #f9fafb;
}

.quill-container .ql-container {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  font-family: 'NanumBarunGothic', sans-serif;
}
</style>
