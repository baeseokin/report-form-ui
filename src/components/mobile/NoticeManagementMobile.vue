<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen">

    <!-- ✅ 목록 화면 -->
    <div v-if="mode === 'list'" class="space-y-4">
      <!-- 상단 컨트롤 영역 (등록버튼 위치) -->
      <div v-if="isManager" class="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm py-3 px-4 flex justify-end">
        <button
          @click="openForm()"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg active:bg-gray-800 transition font-medium"
        >
          공지 등록
        </button>
      </div>

      <!-- 모바일 카드형 목록 -->
      <div v-if="notices.length > 0" class="space-y-3">
        <div
          v-for="(n, index) in notices"
          :key="n.id"
          class="border rounded-lg shadow-sm p-4 bg-white active:bg-gray-50 transition cursor-pointer"
          @click="viewNotice(n.id)"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 pr-2">
              <span class="font-bold text-gray-900 line-clamp-2 leading-snug">{{ n.title }}</span>
            </div>
            <span v-if="isNew(n.created_at)" class="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              New
            </span>
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
        등록된 공지사항이 없습니다.
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
        <h2 class="text-lg font-bold text-gray-900 break-words mb-2 leading-tight">{{ currentNotice.title }}</h2>
        <div class="flex flex-wrap items-center text-xs text-gray-500 gap-y-1 gap-x-3 mt-2">
          <div><span class="font-semibold text-gray-700">작성자:</span> {{ currentNotice.author_name }}</div>
          <div><span class="font-semibold text-gray-700">작성일:</span> {{ formatDateTime(currentNotice.created_at) }}</div>
          <div><span class="font-semibold text-gray-700">조회수:</span> {{ currentNotice.view_count }}</div>
        </div>
      </div>

      <!-- 본문 영역 -->
      <div class="px-4 py-6 prose prose-sm max-w-none text-gray-800 quill-content ql-editor min-h-[200px]" v-html="currentNotice.content"></div>

      <!-- 첨부파일 영역 -->
      <div v-if="currentNotice.files && currentNotice.files.length > 0" class="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-700 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          첨부파일
        </h3>
        <ul class="space-y-2">
          <li v-for="file in currentNotice.files" :key="file.id" class="text-sm">
            <a :href="'/api/files/' + encodeURIComponent(file.file_name) + '?downloadName=' + encodeURIComponent(file.original_name)" :download="file.original_name" class="text-purple-600 active:text-purple-800 underline active:bg-purple-50 p-1 -ml-1 rounded flex items-start break-all">
              <span class="mr-1">🔗</span>
              <span>{{ file.original_name }} <span class="text-gray-400 whitespace-nowrap">({{ formatBytes(file.file_size) }})</span></span>
            </a>
          </li>
        </ul>
      </div>

      <!-- 하단 버튼 영역 -->
      <div class="px-4 py-4 bg-white border-t border-gray-200 flex flex-wrap gap-2 justify-between items-center">
        <button
          @click="mode = 'list'; fetchNotices();"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg active:bg-gray-800 transition font-medium"
        >
          목록
        </button>
        <div v-if="isManager" class="flex gap-2">
          <button
            @click="openForm(currentNotice)"
            class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg active:bg-purple-700 transition font-medium"
          >
            수정
          </button>
          <button
            @click="deleteNotice(currentNotice.id)"
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
        {{ form.id ? '공지사항 수정' : '공지사항 등록' }}
      </h2>

      <div class="space-y-4 flex flex-col">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">제목</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2 rounded border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-sm"
            placeholder="제목 입력"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">내용</label>
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
          <label class="block text-sm font-semibold text-gray-700 mb-1">기존 첨부파일</label>
          <ul class="space-y-2">
            <li v-for="file in form.existingFiles" :key="file.id" class="flex justify-between items-center bg-gray-50 px-2 py-2 rounded border border-gray-200 text-xs">
              <span class="truncate pr-2 text-gray-700">{{ file.original_name }}</span>
              <button @click="markFileForDeletion(file.id)" class="text-red-500 hover:text-red-700 font-medium whitespace-nowrap px-2 py-1 bg-red-50 rounded">
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
          <label class="block text-sm font-semibold text-gray-700 mb-1">첨부파일</label>
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
          @click="saveNotice"
          :disabled="isSaving"
          class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg active:bg-purple-700 transition font-medium flex-1 text-center disabled:opacity-50"
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

// 모바일용 커스텀 툴바 정의 (가로 폭이 좁으므로 필수 요소 위주로 간소화)
const customToolbar = [
  [{ 'font': Font.whitelist }, { 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
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

<style scoped>
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

/* 3. 에디터 폰트 너비 여백 확대 (모바일에서는 조금 작게) */
.ql-snow .ql-picker.ql-font { width: 100px; }
.ql-toolbar.ql-snow .ql-picker-label { padding-left: 4px; padding-right: 2px; }

/* 터치 버튼 피드백 */
button {
  transition: background-color 0.2s;
}
button:active {
  transform: scale(0.97);
}

/* 기본 Quill 컨테이너 커스텀 (모바일형) */
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
