<template>
  <div class="font-body transition-colors duration-500 min-h-screen pb-32" :class="isNight ? 'bg-slate-950 text-white' : 'bg-surface text-on-surface'">
    <!-- ══ 헤더 ══ -->
    <header class="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40 transition-colors duration-500" :class="isNight ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-[#f8f9ff]/80 backdrop-blur-md'">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl overflow-hidden shadow-lg border-2 border-primary/20">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxoDwpCwQGC0grUgo7hcODOMqQGREA8tnF0psVRsIe3-JuO_r_OgfUP8-1Jvp8yUVPZ0a1DBGd81MdtUuuwuSJYq-E81TJgfYIOqAir820vSzAwLbcvRc9gbrhL9SIlFpis3DY_pPARpZiSKlMmj1R2tla19RGoyAaxnga_fPYTkiUo4qat3CHSzH1l6gI5phsR4zHlrW6ka66LFWikx5zYzxalhcjOpwCjMuX2b0IiXVi2Rkzmzky39Z1gK5tdm_r2ixhNpZhWKqQ" 
               alt="User Profile" class="w-full h-full object-cover">
        </div>
        <span class="text-xl font-headline font-extrabold tracking-tighter" :class="isNight ? 'text-white' : 'text-on-surface'">
          <span class="text-primary italic">Financial</span> Architect
        </span>
      </div>
      <button class="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 duration-200"
              :class="isNight ? 'text-rose-400 bg-rose-400/10 hover:bg-rose-400/20' : 'text-rose-500 bg-rose-50 hover:bg-rose-100'"
              @click="handleLogout">
        <span class="material-symbols-outlined text-2xl font-bold">logout</span>
      </button>
    </header>

    <main class="px-6 space-y-10 max-w-2xl mx-auto pt-4">
      <!-- ══ 인사 섹션 ══ -->
      <section class="animate-fade-in">
        <h1 class="font-headline font-extrabold text-3xl tracking-tight leading-tight">
          {{ refinedGreeting }}, <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{{ userName }}님<span class="ml-1 inline-block animate-wave origin-[70%_70%]">👋</span></span>
        </h1>
        <p class="text-sm mt-2 opacity-70 tracking-wide font-medium" :class="isNight ? 'text-slate-400' : 'text-on-surface-variant'">
          {{ today }}
        </p>
      </section>

      <!-- ══ KPI 대시보드 ══ -->
      <section class="relative animate-slide-up">
        <div class="grid grid-cols-12 gap-4">
          <!-- 청구목록 (Large Card) -->
          <div class="col-span-8 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[180px] transition-all duration-300 relative overflow-hidden group"
               :class="isNight ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-[0_20px_40px_rgba(70,72,212,0.08)]'"
               @click="goTo('/approvalList')">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors"></div>
            <div class="relative z-10">
              <span class="text-[10px] font-bold uppercase tracking-widest opacity-60" :class="isNight ? 'text-slate-400' : 'text-on-surface-variant'">청구목록 (최근 1개월)</span>
              <div class="flex items-baseline gap-2 mt-2">
                <span class="text-4xl font-headline font-extrabold" :class="isNight ? 'text-white' : 'text-on-surface'">{{ summary?.approvalCount ?? '0' }}</span>
                <span class="text-sm font-bold opacity-60">건</span>
              </div>
            </div>
            <!-- Sparkline visualization -->
            <div class="relative z-10 w-full h-12 mt-6 rounded-xl overflow-hidden bg-opacity-10" :class="isNight ? 'bg-slate-800' : 'bg-primary/5'">
              <div class="absolute inset-0 flex items-end px-1 gap-1.5 pt-2">
                <div v-for="i in 7" :key="i" class="bg-primary/30 w-full rounded-t-lg transition-all duration-700"
                     :class="`animate-pulse-delay-${i}`" 
                     :style="{ height: [40, 60, 30, 80, 50, 90, 100][i-1] + '%' }"></div>
              </div>
            </div>
          </div>
          
          <!-- 보조 KPI (Vertical Stack) -->
          <div class="col-span-4 flex flex-col gap-4">
            <!-- 결재대기 -->
            <div class="rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                 :class="isNight ? 'bg-slate-900 border border-slate-800' : 'bg-surface-container-low shadow-slate-200/50'"
                 @click="goTo('/approvalStatus')">
              <div class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <span class="material-symbols-outlined text-amber-500 text-xl font-bold">hourglass_empty</span>
              </div>
              <span class="text-lg font-headline font-extrabold leading-none" :class="isNight ? 'text-white' : 'text-on-surface'">{{ summary?.myApprovalCount ?? '0' }}</span>
              <span class="text-[9px] uppercase tracking-tighter font-bold opacity-60 mt-1">Pending</span>
            </div>
            <!-- 공지사항 -->
            <div class="bg-primary text-on-primary rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300"
                 @click="goTo('/notices')">
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings: 'FILL' 1;">notifications_active</span>
              </div>
              <span class="text-lg font-headline font-extrabold leading-none">{{ summary?.unreadNoticeCount ?? '0' }}</span>
              <span class="text-[9px] uppercase tracking-tighter font-bold opacity-80 mt-1">Notice</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ 즐겨찾기 메뉴 ══ -->
      <section class="animate-slide-up delay-100">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-headline font-extrabold text-xl tracking-tight">Quick Connect</h2>
          <button class="text-xs font-bold text-primary flex items-center gap-1 hover:underline" @click="showEdit = true">
            <span class="material-symbols-outlined text-sm">settings_suggest</span>
            Customize
          </button>
        </div>
        <div class="grid grid-cols-4 gap-y-6 gap-x-4">
          <div v-for="menu in favoriteMenus" :key="menu.name" 
               class="flex flex-col items-center group" @click="goTo(menu.path)">
            <button class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all active:scale-90 hover:shadow-lg duration-200 relative mb-2"
                    :class="isNight ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'">
              <span class="z-10">{{ menu.icon }}</span>
              <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded-2xl transition-colors"></div>
            </button>
            <span class="text-[10px] font-bold text-center leading-tight tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{{ menu.name }}</span>
          </div>
          <!-- 즐겨찾기 비었을 때 -->
          <div v-if="favoriteMenus.length === 0" 
               class="col-span-4 py-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-300" 
               :class="isNight ? 'border-slate-800 bg-slate-900/40 text-slate-600' : 'border-slate-200 bg-slate-50 text-slate-400'"
               @click="showEdit = true">
            <span class="material-symbols-outlined text-4xl animate-bounce">add_reaction</span>
            <span class="text-xs font-bold">자주 쓰는 메뉴를 담아보세요</span>
          </div>
        </div>
      </section>

      <!-- ══ 예산 브리핑 카드 ══ -->
      <section class="animate-slide-up delay-200">
        <div class="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl shadow-indigo-500/10">
          <!-- Background decorations -->
          <div class="absolute -top-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]"></div>
          <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-[60px]"></div>
          
          <div class="relative z-10 glass-card-dark p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <div class="flex justify-between items-start mb-6">
              <div>
                <span class="text-[9px] font-bold uppercase tracking-widest text-[#6063ee] py-1 px-3 bg-[#6063ee]/10 rounded-full">Budget Health AI</span>
                <h3 class="text-2xl font-headline font-extrabold text-white mt-2">안정적 집행</h3>
              </div>
              <div class="w-12 h-12 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span class="material-symbols-outlined text-white text-2xl">insights</span>
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="flex justify-between items-end">
                <span class="text-[11px] font-medium text-slate-400 italic">Financial Insight</span>
                <span class="text-2xl font-headline font-extrabold text-white">72<span class="text-[10px] text-slate-500 ml-0.5">%</span></span>
              </div>
              <div class="w-full h-4 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_15px_rgba(70,72,212,0.5)] transition-all duration-1000" style="width: 72%"></div>
              </div>
            </div>
            
            <p class="mt-6 text-[11px] text-slate-400 leading-relaxed font-medium">
              이번 달 예산 소진 속도는 저번 달 동기 대비 <span class="text-tertiary">12% 더 건전하게</span> 관리되고 있습니다.
            </p>
          </div>
        </div>
      </section>

      <!-- ══ 최근 승인 내역 ══ -->
      <section class="pb-12 animate-slide-up delay-300">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-headline font-extrabold text-xl tracking-tight">Recent Activity</h2>
          <button class="text-[11px] font-bold text-primary tracking-widest uppercase hover:underline" @click="goTo('/approvalList')">View All</button>
        </div>
        <div class="space-y-4">
          <div v-for="r in summary?.approvalRecent" :key="r.id"
               class="p-5 rounded-3xl flex items-center justify-between group transition-all duration-300 shadow-sm border"
               :class="isNight ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-800' : 'bg-white hover:bg-slate-50 border-slate-100'"
               @click="goTo('/approvalList')">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                   :class="isNight ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-on-surface-variant'">
                <span class="material-symbols-outlined text-2xl">{{ r.document_type === '지출결의서' ? 'receipt_long' : 'description' }}</span>
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-extrabold tracking-tight">{{ r.document_type }}</h4>
                <div class="flex items-center gap-2 opacity-60 text-[10px] font-medium">
                  <span>{{ formatDate(r.request_date) }}</span>
                  <span class="w-1 h-1 rounded-full bg-slate-400"></span>
                  <span>{{ r.dept_name }}</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-headline font-extrabold mb-1.5">{{ formatAmount(r.total_amount) }}</div>
              <span :class="['px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm', statusColor(r.status)]">
                {{ r.status }}
              </span>
            </div>
          </div>
          <!-- 비었을 때 -->
          <div v-if="!summary?.approvalRecent?.length" class="py-16 text-center text-sm italic opacity-40 font-medium">
            최근 내역이 비어 있습니다.
          </div>
        </div>
      </section>
    </main>

    <!-- ══ 하단 고정 내비게이션 ══ -->
    <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 transition-all duration-500 rounded-t-[3rem]"
         :class="isNight ? 'bg-slate-950/90 border-t border-slate-900 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' : 'bg-white/90 border-t border-slate-100 shadow-[0_-15px_40px_rgba(0,0,0,0.03)]'"
         style="backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);">
      <button v-for="nav in navMenus" :key="nav.id" 
              class="flex flex-col items-center justify-center p-3 transition-all duration-300 relative group"
              :class="activeNav === nav.id ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'"
              @click="handleNav(nav)">
        <span class="material-symbols-outlined text-[1.75rem]" :style="activeNav === nav.id ? 'font-variation-settings: \'FILL\' 1;' : ''">{{ nav.icon }}</span>
        <span class="text-[9px] font-extrabold tracking-widest uppercase mt-1.5">{{ nav.name }}</span>
        <div v-if="activeNav === nav.id" class="absolute -top-1 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
      </button>
    </nav>

    <!-- ══ 플로팅 액션 버튼 ══ -->
    <button class="fixed bottom-28 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-90 hover:scale-105 transition-all duration-200 z-[60] group"
            @click="goTo('/reportForm')">
      <span class="material-symbols-outlined text-3xl transition-transform group-hover:rotate-90">add</span>
      <div class="absolute inset-x-0 -bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div class="bg-primary text-[8px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm">NEW REPORT</div>
      </div>
    </button>

    <!-- ══ 즐겨찾기 설정 모달 ══ -->
    <div v-if="showEdit" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300" @click.self="showEdit = false">
      <div class="w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-12 sm:pb-8 shadow-2xl transform transition-transform duration-300 animate-slide-up-modal"
           :class="isNight ? 'bg-slate-900 text-white' : 'bg-white text-on-surface'">
        <div class="w-12 h-1.5 bg-slate-300/30 rounded-full mx-auto mb-6 sm:hidden"></div>
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-headline font-extrabold tracking-tight">Customize Portal</h3>
          <button class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/10 hover:bg-slate-100/20" @click="showEdit = false">✕</button>
        </div>
        <p class="text-sm opacity-60 mb-8 font-medium leading-relaxed">최대 6개의 메뉴를 선택하여 대시보드를 자유롭게 구성하세요.</p>
        
        <div class="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          <button
            v-for="menu in availableMenus"
            :key="menu.name"
            class="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden group"
            :class="[
              isFavorite(menu.name) 
                ? 'border-primary bg-primary/5' 
                : (isNight ? 'border-slate-800 bg-slate-800/30 hover:border-slate-700' : 'border-slate-100 bg-slate-50 hover:border-slate-200')
            ]"
            @click="toggleFavorite(menu.name)"
          >
            <span class="text-3xl filter transition-transform group-hover:scale-125 duration-300">{{ menu.icon }}</span>
            <span class="flex-1 text-sm font-extrabold tracking-tight">{{ menu.name }}</span>
            <div v-if="isFavorite(menu.name)" class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span class="material-symbols-outlined text-white text-sm font-bold">check</span>
            </div>
            <div v-else class="w-6 h-6 rounded-full border-2" :class="isNight ? 'border-slate-700' : 'border-slate-200'"></div>
          </button>
        </div>

        <div class="mt-10">
          <button class="w-full py-4 bg-primary hover:bg-[#6063ee] text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-primary/30 active:scale-[0.98] transition-all duration-200" @click="saveFavorites">
            Apply Changes
          </button>
        </div>
      </div>
    </div>

    <!-- External Fonts & Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import axios from 'axios';

const router = useRouter();
const userStore = useUserStore();
const summary = ref(null);
const userFavorites = ref([]); 
const showEdit = ref(false);
const activeNav = ref('portal');

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

const navMenus = [
  { id: 'portal', name: 'Dashboard', icon: 'dashboard_customize', path: '/portal' },
  { id: 'new', name: 'New Case', icon: 'post_add', path: '/reportForm' },
  { id: 'approvals', name: 'Pending', icon: 'verified_user', path: '/approvalStatus' },
  { id: 'budget', name: 'Status', icon: 'analytics', path: '/deptBudgetStatus' },
];

const userName = computed(() => userStore.user?.userName || '사용자');

// 주야간 감지 (18시 ~ 6시)
const isNight = computed(() => {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
});

const refinedGreeting = computed(() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Morning Master';
  if (h >= 11 && h < 14) return 'Efficient Day';
  if (h >= 14 && h < 18) return 'Great Afternoon';
  if (h >= 18 && h < 22) return 'Evening Insight';
  return 'Night Shift';
});

const today = computed(() => {
  return new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'long'
  });
});

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
    if (userFavorites.value.length >= 6) return;
    userFavorites.value.push(name);
  }
};

const goTo = (path) => router.push(path);

const handleNav = (nav) => {
  activeNav.value = nav.id;
  goTo(nav.path);
};

const formatDate = (s) => {
  if (!s) return '';
  return new Date(s).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
};

const formatAmount = (n) => {
  if (n == null) return '0원';
  return Number(n).toLocaleString('ko-KR') + '원';
};

const statusColor = (s) => {
  const colors = {
    '결재완료': 'bg-emerald-500/10 text-emerald-600',
    '반려': 'bg-rose-500/10 text-rose-600',
    '결재진행중': 'bg-amber-500/10 text-amber-600',
    '대기': 'bg-slate-500/10 text-slate-600'
  };
  return colors[s] || 'bg-primary/10 text-primary';
};

const fetchFavorites = async () => {
  try {
    const res = await axios.get('/api/user/favorites');
    if (res.data.success) userFavorites.value = res.data.favorites;
  } catch (e) { console.error(e); }
};

const saveFavorites = async () => {
  try {
    const res = await axios.post('/api/user/favorites', { menus: userFavorites.value });
    if (res.data.success) showEdit.value = false;
  } catch (e) { alert('저장에 실패했습니다.'); }
};

const handleLogout = async () => {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  try {
    await axios.post("/api/logout", {}, { withCredentials: true });
    userStore.clearUser();
    router.push("/login");
  } catch (e) {
    console.error('Logout failed', e);
    // 폴백: 세션 만료 등으로 실패해도 클라이언트 정보는 삭제
    userStore.clearUser();
    router.push("/login");
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
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  75% { transform: rotate(-10deg); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up-modal {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-wave { animation: wave 2s infinite; }
.animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
.animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

.animate-pulse-delay-1 { animation: pulse 3s infinite; animation-delay: 0.1s; }
.animate-pulse-delay-2 { animation: pulse 3s infinite; animation-delay: 0.3s; }
.animate-pulse-delay-3 { animation: pulse 3s infinite; animation-delay: 0.5s; }
.animate-pulse-delay-4 { animation: pulse 3s infinite; animation-delay: 0.2s; }
.animate-pulse-delay-5 { animation: pulse 3s infinite; animation-delay: 0.4s; }
.animate-pulse-delay-6 { animation: pulse 3s infinite; animation-delay: 0.6s; }
.animate-pulse-delay-7 { animation: pulse 3s infinite; animation-delay: 0.35s; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(70, 72, 212, 0.2); border-radius: 10px; }

.animate-slide-up-modal { animation: slide-up-modal 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
</style>
