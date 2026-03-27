<template>
  <div class="min-h-screen font-body transition-colors duration-500" :class="isNight ? 'bg-slate-950 text-white' : 'bg-surface text-on-surface'">
    
    <!-- ══ HEADER ══ -->
    <header class="max-w-[1440px] mx-auto px-8 py-10 flex items-center justify-between border-b transition-colors duration-500" 
            :class="isNight ? 'border-slate-800' : 'border-slate-200'">
      <div class="flex flex-col">
        <span class="text-xs font-bold uppercase tracking-[0.2em] opacity-50 mb-1 animate-fade-in">{{ greetingContext }}</span>
        <h1 class="text-5xl font-headline font-extrabold tracking-tight leading-none animate-slide-right">
          Hello, <span class="text-primary italic">{{ userName }}</span><span class="text-primary-container">.</span>
        </h1>
        <p class="mt-3 text-sm font-medium opacity-60 tracking-wider transition-colors" :class="isNight ? 'text-slate-400' : 'text-on-surface-variant'">
          {{ today }} • Today's Insight: <span class="text-tertiary">All systems optimal</span>
        </p>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex gap-2">
          <button v-for="s in shortcuts" :key="s.path"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 group"
                  :class="isNight ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5'"
                  @click="goTo(s.path)">
            <span class="text-xl group-hover:rotate-12 transition-transform">{{ s.icon }}</span>
            <span class="text-sm font-bold tracking-tight">{{ s.label }}</span>
          </button>
        </div>
        <div class="w-px h-10 bg-slate-200" :class="{ 'bg-slate-800': isNight }"></div>
        <div class="flex items-center gap-3 group cursor-pointer">
          <div class="text-right">
            <p class="text-sm font-extrabold leading-none">{{ userName }}</p>
            <p class="text-[10px] opacity-60 mt-1 font-bold">{{ userStore.user?.role || 'Senior Manager' }}</p>
          </div>
          <div class="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20 group-hover:border-primary transition-colors">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxoDwpCwQGC0grUgo7hcODOMqQGREA8tnF0psVRsIe3-JuO_r_OgfUP8-1Jvp8yUVPZ0a1DBGd81MdtUuuwuSJYq-E81TJgfYIOqAir820vSzAwLbcvRc9gbrhL9SIlFpis3DY_pPARpZiSKlMmj1R2tla19RGoyAaxnga_fPYTkiUo4qat3CHSzH1l6gI5phsR4zHlrW6ka66LFWikx5zYzxalhcjOpwCjMuX2b0IiXVi2Rkzmzky39Z1gK5tdm_r2ixhNpZhWKqQ" 
                 class="w-full h-full object-cover">
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-[1440px] mx-auto px-8 py-12 space-y-12">
      <!-- ══ KPI ROW ══ -->
      <section class="grid grid-cols-4 gap-6 animate-slide-up">
        <div v-for="(k, idx) in kpis" :key="k.key"
             class="relative group rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 cursor-pointer shadow-sm overflow-hidden"
             :class="isNight ? 'bg-slate-900 border border-slate-800 hover:border-slate-700' : 'bg-white border border-slate-50 hover:shadow-2xl hover:shadow-indigo-500/10'"
             @click="goTo(k.path)">
          
          <!-- Decorative Background Icon -->
          <div class="absolute -bottom-4 -right-4 text-primary opacity-5 transform group-hover:scale-125 transition-transform duration-700 pointer-events-none">
             <span class="material-symbols-outlined text-9xl">{{ k.icon_name }}</span>
          </div>

          <div class="flex items-center justify-between mb-8 relative z-10">
            <div class="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110"
                 :style="`background: ${k.color}15; color: ${k.color}`">
              <span class="material-symbols-outlined text-3xl">{{ k.icon_name }}</span>
            </div>
            <div class="flex flex-col items-end">
               <span class="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Status</span>
               <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-[10px] font-bold uppercase text-emerald-500">Live</span>
               </div>
            </div>
          </div>

          <div class="relative z-10">
            <p class="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 truncate" :class="isNight ? 'text-slate-400' : 'text-on-surface-variant'">{{ k.label }}</p>
            <div class="flex items-baseline gap-2">
              <h2 class="text-4xl font-headline font-extrabold tracking-tighter" :class="isNight ? 'text-white' : 'text-on-surface'">
                {{ summary ? summary[k.key] : '0' }}
              </h2>
              <span class="text-sm font-bold opacity-30">건</span>
            </div>
            <p v-if="k.suffix" class="text-[10px] mt-2 font-medium opacity-40">{{ k.suffix }}</p>
          </div>
          
          <!-- Accent Line -->
          <div class="absolute bottom-0 left-8 right-8 h-1 transition-all duration-500 group-hover:left-0 group-hover:right-0 group-hover:h-full group-hover:opacity-5"
               :style="`background: ${k.color}`"></div>
        </div>
      </section>

      <!-- ══ MAIN PANELS ══ -->
      <section class="grid grid-cols-12 gap-8 animate-slide-up delay-100 pb-20">
        
        <!-- Left Column: Approvals -->
        <div class="col-span-8 flex flex-col gap-8">
          
          <!-- 청구목록 Panel -->
          <div class="rounded-[2.5rem] p-10 border transition-all duration-500 shadow-sm"
               :class="isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/5'">
            <div class="flex items-center justify-between mb-10">
              <div class="flex items-center gap-4">
                <div class="w-2 h-10 bg-primary rounded-full"></div>
                <div>
                  <h2 class="text-2xl font-headline font-extrabold tracking-tight">청구목록 조회</h2>
                  <p class="text-xs opacity-50 font-medium">최근 한 달간의 모든 지출 결의 현황입니다.</p>
                </div>
              </div>
              <button class="px-6 py-2.5 rounded-2xl text-xs font-bold text-primary hover:bg-primary/5 transition-colors border-2 border-primary/10"
                      @click="goTo('/approvalList')">전체 보기 <span class="ml-1 tracking-tighter">→</span></button>
            </div>

            <div class="overflow-hidden">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-[11px] font-bold uppercase tracking-widest opacity-40 border-b overflow-hidden" :class="isNight ? 'border-slate-800' : 'border-slate-100'">
                    <th class="pb-4 px-4 font-bold">부서</th>
                    <th class="pb-4 px-4 font-bold">문서유형</th>
                    <th class="pb-4 px-4 font-bold">신청일</th>
                    <th class="pb-4 px-4 font-bold">상태</th>
                  </tr>
                </thead>
                <tbody class="divide-y" :class="isNight ? 'divide-slate-800' : 'divide-slate-50'">
                  <tr v-for="r in summary?.approvalRecent" :key="r.id"
                      class="group cursor-pointer transition-all hover:bg-slate-50/50"
                      :class="isNight ? 'hover:bg-white/5' : ''"
                      @click="goTo('/approvalList')">
                    <td class="py-5 px-4 text-sm font-bold">{{ r.dept_name }}</td>
                    <td class="py-5 px-4 text-sm font-medium opacity-80">{{ r.document_type }}</td>
                    <td class="py-5 px-4 text-sm font-medium opacity-50">{{ formatDate(r.request_date) }}</td>
                    <td class="py-5 px-4">
                      <span :class="['px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm', statusColor(r.status)]">
                        {{ r.status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!summary?.approvalRecent?.length">
                    <td colspan="4" class="py-20 text-center text-sm italic opacity-30 font-medium tracking-wide">활성 청구 리포트가 발견되지 않았습니다.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 내결재 대기 Panel -->
          <div class="rounded-[2.5rem] p-10 border transition-all duration-500 shadow-sm"
               :class="isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/5'">
            <div class="flex items-center justify-between mb-10">
              <div class="flex items-center gap-4">
                <div class="w-2 h-10 bg-amber-500 rounded-full"></div>
                <div>
                  <h2 class="text-2xl font-headline font-extrabold tracking-tight">결재 대기 목록</h2>
                  <p class="text-xs opacity-50 font-medium">부장님의 빠른 승인을 기다리는 문서들입니다.</p>
                </div>
              </div>
              <button class="px-6 py-2.5 rounded-2xl text-xs font-bold text-amber-600 hover:bg-amber-500/5 transition-colors border-2 border-amber-500/10"
                      @click="goTo('/approvalStatus')">전체 보기 <span class="ml-1 tracking-tighter">→</span></button>
            </div>
            
            <div class="overflow-hidden">
               <table class="w-full text-left">
                  <thead>
                    <tr class="text-[11px] font-bold uppercase tracking-widest opacity-40 border-b" :class="isNight ? 'border-slate-800' : 'border-slate-100'">
                      <th class="pb-4 px-4">부서</th><th class="pb-4 px-4">문서유형</th><th class="pb-4 px-4">신청일</th><th class="pb-4 px-4">금액</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y" :class="isNight ? 'divide-slate-800' : 'divide-slate-50'">
                    <tr v-for="r in summary?.myApprovalRecent" :key="r.id"
                        class="group cursor-pointer transition-all hover:bg-slate-50/50"
                        :class="isNight ? 'hover:bg-white/5' : ''"
                        @click="goTo('/approvalStatus')">
                      <td class="py-5 px-4 text-sm font-bold">{{ r.dept_name }}</td>
                      <td class="py-5 px-4 text-sm font-medium opacity-80">{{ r.document_type }}</td>
                      <td class="py-5 px-4 text-sm font-medium opacity-50">{{ formatDate(r.request_date) }}</td>
                      <td class="py-5 px-4 text-sm font-extrabold text-[#6b38d4]">{{ formatAmount(r.total_amount) }}</td>
                    </tr>
                    <tr v-if="!summary?.myApprovalRecent?.length">
                      <td colspan="4" class="py-20 text-center text-sm italic opacity-30 font-medium tracking-wide">대기 중인 검토 요청이 존재하지 않습니다.</td>
                    </tr>
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <!-- Right Column: Announcements & Boards -->
        <div class="col-span-4 space-y-8">
          <!-- 공지사항 Card -->
          <div class="rounded-[2.5rem] p-10 border transition-all duration-500 shadow-sm"
               :class="isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/5'">
            <div class="flex items-center justify-between mb-10">
               <h3 class="text-xl font-headline font-extrabold tracking-tight">Announcements</h3>
               <span v-if="summary?.unreadNoticeCount > 0" class="px-3 py-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-lg animate-bounce">{{ summary.unreadNoticeCount }}</span>
            </div>
            <ul class="space-y-6">
              <li v-for="n in summary?.noticeRecent" :key="n.id"
                  class="flex items-start gap-4 group cursor-pointer" @click="goTo('/notices')">
                <div class="w-1.5 h-1.5 rounded-full mt-1.5 transition-all group-hover:scale-[300%]" :style="`background: #10b981;`"></div >
                <div class="flex-1 space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{{ n.title }}</span>
                    <span v-if="isNew(n.created_at)" class="text-[8px] font-black text-rose-500 bg-rose-50 px-1 rounded-sm">NEW</span>
                  </div>
                  <p class="text-[10px] opacity-40 font-bold uppercase tracking-widest">{{ formatDate(n.created_at) }}</p>
                </div>
              </li>
              <li v-if="!summary?.noticeRecent?.length" class="text-sm opacity-30 italic text-center py-10">최근 공지가 없습니다.</li>
            </ul>
          </div>

          <!-- 게시판 Card -->
          <div class="rounded-[2.5rem] p-10 border transition-all duration-500 shadow-sm"
               :class="isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/5'">
            <div class="flex items-center justify-between mb-10">
               <h3 class="text-xl font-headline font-extrabold tracking-tight">Active Threads</h3>
               <span v-if="summary?.unreadBoardCount > 0" class="px-3 py-1 bg-primary text-white text-[10px] font-extrabold rounded-lg">{{ summary.unreadBoardCount }}</span>
            </div>
            <ul class="space-y-8">
              <li v-for="b in summary?.boardRecent" :key="b.id"
                  class="group cursor-pointer space-y-2" @click="goTo('/boards')">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{{ b.title }}</span>
                  <span v-if="b.comment_count > 0" class="text-[10px] font-black text-primary">({{ b.comment_count }})</span>
                </div>
                <div class="flex items-center gap-2 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                   <span>{{ b.author_name }}</span>
                   <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span>Board</span>
                </div>
              </li>
              <li v-if="!summary?.boardRecent?.length" class="text-sm opacity-30 italic text-center py-10">등록된 게시글이 없습니다.</li>
            </ul>
          </div>

          <!-- Brand Identity Card -->
          <div class="rounded-[2.5rem] p-10 bg-gradient-to-br from-primary via-primary-container to-secondary text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <h4 class="text-xl font-headline font-extrabold leading-tight relative z-10">Redesigning the Future of Finance.</h4>
            <p class="mt-4 text-[11px] opacity-80 leading-relaxed font-medium relative z-10 italic">
              "데이터는 힘을 실어주고, 디자인은 영감을 줍니다." <br>
              당신의 성과를 더욱 빛나게 만드는 프리미엄 아키텍처.
            </p>
            <div class="mt-10 flex justify-between items-end relative z-10">
               <div class="text-[9px] font-black tracking-widest uppercase opacity-40">System Ver 2.5</div>
               <span class="material-symbols-outlined text-4xl opacity-30">auto_awesome</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Material Design & Google Fonts -->
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

const userName = computed(() => userStore.user?.userName || '사용자');

// 주야간 감지 (18시 ~ 6시)
const isNight = computed(() => {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
});

const greetingContext = computed(() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Strategic Morning';
  if (h >= 12 && h < 18) return 'High Efficiency Afternoon';
  return 'Evening Overview';
});

const today = computed(() => {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
});

const shortcuts = [
  { icon: '🖋️', label: 'Create Report', path: '/reportForm' },
  { icon: '📊', label: 'Analysis', path: '/approvalList' },
  { icon: '🛡️', label: 'Security', path: '/roleAccess' },
];

const kpis = [
  { key: 'approvalCount',   label: 'Total Reports',    icon_name: 'receipt_long', color: '#4648d4', path: '/approvalList', suffix: '(최근 1개월 기준)'  },
  { key: 'myApprovalCount', label: 'Pending Task',    icon_name: 'verified_user', color: '#f59e0b', path: '/approvalStatus' },
  { key: 'unreadNoticeCount', label: 'Announcements', icon_name: 'campaign', color: '#10b981', path: '/notices'       },
  { key: 'unreadBoardCount', label: 'Community Feed', icon_name: 'forum', color: '#6b38d4', path: '/boards'        },
];

const formatDate = (s) => {
  if (!s) return '';
  return new Date(s).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
};

const formatAmount = (n) => {
  if (n == null) return '0원';
  return Number(n).toLocaleString('ko-KR') + '원';
};

const isNew = (s) => {
  if (!s) return false;
  return (Date.now() - new Date(s).getTime()) < 3 * 24 * 60 * 60 * 1000;
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

const goTo = (path) => router.push(path);

onMounted(async () => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, '0');
    const d = String(startDate.getDate()).padStart(2, '0');
    const res = await axios.get('/api/portal/summary', { params: { startDate: `${y}-${m}-${d}` } });
    if (res.data.success) summary.value = res.data.data;
  } catch (e) { console.error('Summary Error', e); }
});
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 0.5; transform: translateY(0); }
}

@keyframes slide-right {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 1s ease-out forwards; }
.animate-slide-right { animation: slide-right 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
.animate-slide-up { animation: slide-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

.delay-100 { animation-delay: 0.2s; }

.glass-card-dark {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
</style>
