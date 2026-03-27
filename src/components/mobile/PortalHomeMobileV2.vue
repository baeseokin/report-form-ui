<template>
  <div class="min-h-screen bg-[#F8F9FD] text-slate-800 font-sans pb-24 transition-colors duration-500" :class="{ 'dark-mode-overlay': isNight }">
    <!-- ══ HEADER (Subtle Glassmorphism) ══ -->
    <header class="relative px-6 pt-12 pb-20 overflow-hidden">
      <div class="absolute inset-0 z-0 bg-gradient-to-br transition-all duration-700"
           :class="isNight ? 'from-slate-900 via-indigo-950 to-slate-950' : 'from-indigo-600 via-violet-500 to-fuchsia-500'">
      </div>
      <div class="absolute inset-0 z-0 opacity-20" 
           :style="`background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;`"
           v-if="!isNight">
      </div>
      
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-6">
          <span class="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase">Woncheon Finance</span>
          <div class="h-px w-8 bg-white/20"></div>
        </div>
        <p class="text-white/80 text-sm font-medium mb-1 animate-fade-in">{{ refinedGreeting }}</p>
        <h1 class="text-3xl font-headline font-black text-white tracking-tight animate-slide-up">
          {{ userName }}님 <span class="inline-block origin-[70%_70%] animate-wave">👋</span>
        </h1>
        <div class="mt-4 inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
          <span class="text-[10px] font-bold text-white/90 tracking-wide">{{ today }}</span>
        </div>
      </div>
    </header>

    <!-- ══ MAIN DASHBOARD (2x2 Glass Cards) ══ -->
    <main class="relative z-20 px-4 -mt-10">
      <div class="grid grid-cols-2 gap-4">
        <!-- Dashboard Card 1 -->
        <div class="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 active:scale-95 transition-all duration-200 group"
             @click="goTo('/approvalList')">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 transition-transform group-hover:rotate-6">
            <span class="material-symbols-outlined text-indigo-500 font-bold">description</span>
          </div>
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">청구목록</span>
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-headline font-black text-slate-800">{{ summary?.approvalCount ?? '0' }}</span>
              <span class="text-[10px] font-bold text-slate-400">건</span>
            </div>
          </div>
          <div class="mt-3 text-[9px] font-bold text-indigo-400/80 bg-indigo-50/50 inline-block px-2 py-0.5 rounded-md">최근 1개월</div>
        </div>

        <!-- Dashboard Card 2 -->
        <div class="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 active:scale-95 transition-all duration-200 group"
             @click="goTo('/approvalStatus')">
          <div class="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 transition-transform group-hover:rotate-6">
            <span class="material-symbols-outlined text-amber-500 font-bold">hourglass_empty</span>
          </div>
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">결재 대기</span>
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-headline font-black text-slate-800">{{ summary?.myApprovalCount ?? '0' }}</span>
              <span class="text-[10px] font-bold text-slate-400">건</span>
            </div>
          </div>
        </div>

        <!-- Dashboard Card 3 -->
        <div class="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 active:scale-95 transition-all duration-200 group"
             @click="goTo('/notices')">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 transition-transform group-hover:rotate-6">
            <span class="material-symbols-outlined text-emerald-500 font-bold">campaign</span>
          </div>
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">새 공지</span>
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-headline font-black text-slate-800">{{ summary?.unreadNoticeCount ?? '0' }}</span>
              <span class="text-[10px] font-bold text-slate-400">건</span>
            </div>
          </div>
        </div>

        <!-- Dashboard Card 4 -->
        <div class="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 active:scale-95 transition-all duration-200 group"
             @click="goTo('/boards')">
          <div class="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 transition-transform group-hover:rotate-6">
            <span class="material-symbols-outlined text-purple-500 font-bold">forum</span>
          </div>
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">새 게시글</span>
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-headline font-black text-slate-800">{{ summary?.unreadBoardCount ?? '0' }}</span>
              <span class="text-[10px] font-bold text-slate-400">건</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ══ FAVORITES SECTION (Minimalist Pill Grid) ══ -->
    <section class="mt-10 px-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-headline font-extrabold tracking-tight">즐겨찾기 메뉴</h3>
        <button class="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm active:scale-90" @click="showEdit = true">
          <span class="material-symbols-outlined text-slate-400 text-lg">settings</span>
        </button>
      </div>

      <div v-if="favoriteMenus.length > 0" class="grid grid-cols-4 gap-4">
        <div v-for="menu in favoriteMenus" :key="menu.name"
             class="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
             @click="goTo(menu.path)">
          <div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
            <span class="text-2xl transition-transform group-hover:scale-110">{{ menu.icon }}</span>
          </div>
          <span class="text-[10px] font-bold text-slate-500 text-center leading-tight">{{ menu.name }}</span>
        </div>
      </div>

      <button v-else class="w-full py-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 bg-slate-50/50 active:bg-slate-100 transition-colors"
              @click="showEdit = true">
        <span class="material-symbols-outlined text-slate-300 text-3xl">add_circle</span>
        <p class="text-xs font-bold text-slate-400">자주 사용하는 메뉴를 등록하세요</p>
      </button>
    </section>

    <!-- ══ BOTTOM NAV (REMOVED: User Request) ══ -->


    <!-- ══ FAVORITE EDIT MODAL (Full Height Drawer Style) ══ -->
    <Transition name="slide-up">
      <div v-if="showEdit" class="fixed inset-0 z-[100] flex items-end">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showEdit = false"></div>
        <div class="relative w-full bg-white rounded-t-[40px] px-6 pt-10 pb-12 shadow-2xl max-h-[85vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden"></div>
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-headline font-black tracking-tight">포탈 편집</h3>
            <button class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors" @click="showEdit = false">✕</button>
          </div>
          <p class="text-sm text-slate-500 mb-8 font-medium">자주 사용하는 메뉴를 선택해 주세요.</p>
          
          <div class="grid grid-cols-1 gap-3 mb-10 overflow-hidden">
            <button
              v-for="menu in availableMenus"
              :key="menu.name"
              class="flex items-center gap-4 p-5 rounded-3xl transition-all duration-200 border-2"
              :class="isFavorite(menu.name) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-200'"
              @click="toggleFavorite(menu.name)"
            >
              <span class="text-2xl">{{ menu.icon }}</span>
              <span class="flex-1 font-bold text-slate-700 text-left">{{ menu.name }}</span>
              <span v-if="isFavorite(menu.name)" class="material-symbols-outlined text-indigo-500 font-black">check</span>
            </button>
          </div>

          <button class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all"
                  @click="saveFavorites">
            저장하기
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const summary = ref(null);
const userFavorites = ref([]); 
const showEdit = ref(false);

const menuMeta = {
  '지출결의서 작성': { icon: '📝', path: '/reportForm' },
  '청구목록 조회': { icon: '📑', path: '/approvalList' },
  '내결재목록 조회': { icon: '⏳', path: '/approvalStatus' },
  '사용자 관리': { icon: '👥', path: '/userManagement' },
  '권한 관리': { icon: '🔐', path: '/roleAccess' },
  '결재선 관리': { icon: '⛓️', path: '/approval-lines' },
  '계정과목 관리': { icon: '📂', path: '/accountCategories' },
  '예산 관리': { icon: '💰', path: '/budgets' },
  '예산집행 현황': { icon: '📈', path: '/budgetStatus' },
  '부서 예산집행 현황': { icon: '🏢', path: '/deptBudgetStatus' },
  '부서 관리': { icon: '🏗️', path: '/departments' },
  '공지사항': { icon: '📢', path: '/notices' },
  '게시판': { icon: '💬', path: '/boards' },
};

const userName = computed(() => userStore.user?.userName || '사용자');

const isNight = computed(() => {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
});

const refinedGreeting = computed(() => {
  const h = new Date().getHours();
  if (h >= 6 && h < 9) return '좋은 아침이에요';
  if (h >= 9 && h < 12) return '오늘 하루도 파이팅!';
  if (h >= 12 && h < 18) return '즐거운 오후입니다';
  if (h >= 18 && h < 21) return '수고 많으셨어요';
  return '편안한 밤 되세요';
});

const today = computed(() => new Date().toLocaleDateString('ko-KR', {
  month: 'long', day: 'numeric', weekday: 'long'
}));

const availableMenus = computed(() => {
  const access = userStore.access || [];
  const uniqueNames = [...new Set(access.map(a => a.menu_name))];
  return uniqueNames
    .filter(name => menuMeta[name])
    .map(name => ({ name, ...menuMeta[name] }));
});

const favoriteMenus = computed(() => {
  return userFavorites.value
    .filter(name => menuMeta[name])
    .map(name => ({ name, ...menuMeta[name] }));
});

const isFavorite = (name) => userFavorites.value.includes(name);

const toggleFavorite = (name) => {
  const idx = userFavorites.value.indexOf(name);
  if (idx > -1) {
    userFavorites.value.splice(idx, 1);
  } else {
    userFavorites.value.push(name);
  }
};

const goTo = (path) => router.push(path);

const fetchFavorites = async () => {
  try {
    const res = await axios.get('/api/user/favorites');
    if (res.data.success) userFavorites.value = res.data.favorites;
  } catch (e) {
    console.error('즐겨찾기 조회 실패', e);
  }
};

const saveFavorites = async () => {
  try {
    const res = await axios.post('/api/user/favorites', { menus: userFavorites.value });
    if (res.data.success) { showEdit.value = false; }
  } catch (e) {
    alert('저장에 실패했습니다.');
  }
};

onMounted(async () => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, "0");
    const d = String(startDate.getDate()).padStart(2, "0");
    const res = await axios.get('/api/portal/summary', { params: { startDate: `${y}-${m}-${d}` } });
    if (res.data.success) summary.value = res.data.data;
  } catch (e) { console.error(e); }
  fetchFavorites();
});
</script>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.font-sans { font-family: 'Inter', sans-serif; }

.dark-mode-overlay {
  background-color: #0f172a;
  color: #f1f5f9;
}
.dark-mode-overlay .bg-white {
  background-color: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.dark-mode-overlay .text-slate-800 { color: #f1f5f9; }
.dark-mode-overlay .text-slate-400 { color: #94a3b8; }
.dark-mode-overlay .bg-[#F8F9FD] { background-color: #020617; }
.dark-mode-overlay .border-slate-100 { border-color: #334155; }
.dark-mode-overlay .shadow-sm { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}
.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(20deg); }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}
.font-variation-fill {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}
</style>
