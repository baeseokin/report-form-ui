<template>
  <div class="p-6 font-nanum">

    <!-- ✅ 목록 화면 -->
    <div v-if="mode === 'list'" class="space-y-6">
      <!-- 상단 액션 버튼 영역 -->
      <div v-if="isManager" class="flex justify-end mb-4">
        <button
          @click="openForm()"
          class="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          <svg class="w-4 h-4 text-purple-100 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          공지 등록하기
        </button>
      </div>

      <!-- 결과 테이블 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
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
              v-for="(n, index) in notices"
              :key="n.id"
              class="hover:bg-purple-50 transition cursor-pointer"
              @click="viewNotice(n.id)"
            >
              <td class="border p-3 text-center">
                {{ totalItems - (currentPage - 1) * limit - index }}
              </td>
              <td class="border p-3 text-left font-medium text-gray-900">
                <div class="flex items-center gap-2">
                  <span class="truncate block max-w-md md:max-w-xl">{{ n.title }}</span>
                  <span v-if="isNew(n.created_at)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    New
                  </span>
                </div>
              </td>
              <td class="border p-3 text-center">{{ n.author_name }}</td>
              <td class="border p-3 text-center">{{ formatDate(n.created_at) }}</td>
              <td class="border p-3 text-center">{{ n.view_count }}</td>
            </tr>
            <tr v-if="notices.length === 0">
              <td colspan="5" class="text-center p-6 text-gray-500">
                등록된 공지사항이 없습니다.
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
    <div v-else-if="mode === 'view'" class="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
      <!-- 헤더 영역 -->
      <div class="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div class="flex justify-between items-start mb-2">
          <h2 class="text-xl font-bold text-gray-900 break-words">{{ currentNotice.title }}</h2>
        </div>
        <div class="flex flex-wrap items-center text-sm text-gray-500 space-x-4">
          <div class="flex items-center">
            <span class="font-semibold mr-1 text-gray-700">작성자:</span> {{ currentNotice.author_name }}
          </div>
          <div class="flex items-center">
            <span class="font-semibold mr-1 text-gray-700">작성일:</span> {{ formatDateTime(currentNotice.created_at) }}
          </div>
          <div class="flex items-center">
            <span class="font-semibold mr-1 text-gray-700">조회수:</span> {{ currentNotice.view_count }}
          </div>
        </div>
      </div>

      <!-- 본문 영역 -->
      <div class="px-6 py-8 prose max-w-none text-gray-800 quill-content ql-editor min-h-[300px]" v-html="currentNotice.content"></div>

      <!-- 첨부파일 영역 -->
      <div v-if="currentNotice.files && currentNotice.files.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          첨부파일
        </h3>
        <ul class="space-y-2">
          <li v-for="file in currentNotice.files" :key="file.id" class="flex items-center text-sm">
            <a :href="'/api/files/' + encodeURIComponent(file.file_name) + '?downloadName=' + encodeURIComponent(file.original_name)" :download="file.original_name" class="text-purple-600 hover:text-purple-800 hover:underline flex items-center transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {{ file.original_name }} <span class="text-gray-400 ml-1">({{ formatBytes(file.file_size) }})</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- 하단 버튼 영역 -->
      <div class="px-6 py-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
        <button
          @click="mode = 'list'; fetchNotices();"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          목록으로
        </button>
        <div v-if="isManager" class="flex space-x-2">
          <button
            @click="openForm(currentNotice)"
            class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            수정
          </button>
          <button
            @click="deleteNotice(currentNotice.id)"
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
        {{ form.id ? '공지사항 수정' : '공지사항 등록' }}
      </h2>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">제목</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition outline-none"
            placeholder="공지사항 제목을 입력하세요"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">내용</label>
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

        <!-- 기존 첨부파일 목록 (수정 시) -->
        <div v-if="form.id && form.existingFiles.length > 0">
          <label class="block text-sm font-semibold text-gray-700 mb-2">기존 첨부파일</label>
          <ul class="space-y-2">
            <li v-for="file in form.existingFiles" :key="file.id" class="flex justify-between items-center bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm">
              <span class="truncate pr-4 text-gray-700">{{ file.original_name }}</span>
              <button @click="markFileForDeletion(file.id)" class="text-red-500 hover:text-red-700 font-medium transition">
                삭제
              </button>
            </li>
          </ul>
        </div>
        
        <!-- 삭제 대기 파일 목록 -->
        <div v-if="form.deletedFileIds.length > 0" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-100 mt-2">
          <span class="font-medium">* 삭제 예정 파일:</span> {{ form.deletedFileIds.length }}개 (저장 시 실제 삭제됩니다)
          <button @click="undoDeletions" class="ml-2 text-purple-600 hover:underline font-medium">실행 취소</button>
        </div>

        <!-- 새 첨부파일 업로드 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">임시 파일 첨부 (다중 선택 및 드래그 앤 드롭)</label>
          <div class="flex items-center justify-center w-full">
            <label
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors relative text-center"
              :class="isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                <svg class="w-8 h-8 mb-3" :class="isDragging ? 'text-purple-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p class="mb-2 text-sm text-gray-600 font-medium whitespace-nowrap"><span class="text-purple-600">클릭하여 파일 선택</span> 또는 여기로 드래그</p>
                <p class="text-xs text-gray-400">최대 10개 파일 첨부 가능</p>
              </div>
              <input type="file" multiple class="hidden" @change="handleFileChange" />
            </label>
          </div>
          <!-- 새로 선택된 파일 목록 -->
          <ul v-if="form.newFiles.length > 0" class="mt-3 space-y-2">
            <li v-for="(file, index) in form.newFiles" :key="index" class="text-sm text-gray-700 flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded">
              <span class="truncate pr-4">{{ file.name }} <span class="text-gray-400">({{ formatBytes(file.size) }})</span></span>
              <button @click="removeNewFile(index)" class="text-red-500 hover:text-red-700 font-medium">삭제</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="mt-8 flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button
          @click="mode = form.id ? 'view' : 'list'"
          class="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          취소
        </button>
        <button
          @click="saveNotice"
          :disabled="isSaving"
          class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-wait"
        >
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

// 커스텀 툴바 정의 (풀 옵션에 한글 폰트 주입)
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
const isManager = computed(() => {
  const isDocAdmin = userStore.user?.roles?.some(r => r.role_name === '관리자');
  const isFinance = userStore.user?.deptName === '재정부';
  return isDocAdmin || isFinance;
});

const mode = ref('list'); // 'list', 'view', 'form'
const notices = ref([]);
const totalItems = ref(0);
const currentPage = ref(1);
const limit = ref(10);
const totalPages = ref(1);

const currentNotice = ref(null);
const isSaving = ref(false);

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

const fetchNotices = async () => {
  try {
    const res = await axios.get(`/api/notices?page=${currentPage.value}&limit=${limit.value}`);
    if (res.data.success) {
      notices.value = res.data.data;
      totalItems.value = res.data.total;
      totalPages.value = res.data.totalPages;
    }
  } catch (err) {
    console.error(err);
    alert('공지사항 목록을 불러오는데 실패했습니다.');
  }
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchNotices();
};

const viewNotice = async (id) => {
  try {
    const res = await axios.get(`/api/notices/${id}`);
    if (res.data.success) {
      currentNotice.value = res.data.data;
      mode.value = 'view';
    }
  } catch (err) {
    console.error(err);
    alert('공지사항을 불러오는데 실패했습니다.');
  }
};

const openForm = (notice = null) => {
  if (notice) {
    // 수정 시
    form.value = {
      id: notice.id,
      title: notice.title,
      // QuillEditor는 null/undefined 처리에 민감할 수 있으므로
      content: notice.content || '', 
      existingFiles: notice.files ? [...notice.files] : [],
      deletedFileIds: [],
      newFiles: [],
    };
    originalExistingFiles.value = notice.files ? [...notice.files] : [];
  } else {
    // 새 글
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
  // input 초기화
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

const saveNotice = async () => {
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
      res = await axios.put(`/api/notices/${form.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      res = await axios.post('/api/notices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    if (res.data.success) {
      alert(res.data.message);
      mode.value = 'list';
      currentPage.value = 1;
      fetchNotices();
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || '공지사항 저장에 실패했습니다.');
  } finally {
    isSaving.value = false;
  }
};

const deleteNotice = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  try {
    const res = await axios.delete(`/api/notices/${id}`);
    if (res.data.success) {
      alert(res.data.message);
      mode.value = 'list';
      currentPage.value = 1;
      fetchNotices();
    }
  } catch (err) {
    console.error(err);
    alert('공지사항 삭제에 실패했습니다.');
  }
};

onMounted(() => {
  fetchNotices();
});
</script>

<style>
/* =======================================
   Quill 에디터 폰트 커스텀 
======================================= */
/* 1. 에디터 메뉴명 매핑 (나눔고딕, 본고딕 등) */
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="nanum-gothic"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="nanum-gothic"]::before { content: '나눔고딕'; font-family: 'Nanum Gothic', sans-serif; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="nanum-myeongjo"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="nanum-myeongjo"]::before { content: '나눔명조'; font-family: 'Nanum Myeongjo', serif; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="noto-sans-kr"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="noto-sans-kr"]::before { content: '본고딕'; font-family: 'Noto Sans KR', sans-serif; }

/* 영문 기본 폰트도 한글로 표시 유도 */
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="sans-serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="sans-serif"]::before { content: '기본체 (Sans-Serif)'; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before { content: '바탕체 (Serif)'; }

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before { content: '고정폭 (Monospace)'; }

/* 2. 실제 본문 화면 출력 시 적용될 CSS 클래스 */
.ql-font-nanum-gothic { font-family: 'Nanum Gothic', sans-serif; }
.ql-font-nanum-myeongjo { font-family: 'Nanum Myeongjo', serif; }
.ql-font-noto-sans-kr { font-family: 'Noto Sans KR', sans-serif; }

/* 3. 에디터 폰트 너비 여백 확대 (폰트 이름이 길어져서 잘리는 것 방지) */
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
