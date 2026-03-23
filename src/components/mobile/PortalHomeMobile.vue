<template>
  <div class="mobile-portal font-nanum">
    <!-- 상단 인사 배너 (주야간 자동 전환) -->
    <div class="hero" :class="{ 'is-night': isNight }">
      <div class="hero__bg"></div>
      <div class="hero__content">
        <p class="hero__sub">{{ refinedGreeting }},</p>
        <h1 class="hero__name">{{ userName }}님 <span>👋</span></h1>
        <p class="hero__date">{{ today }}</p>
      </div>
    </div>

    <!-- 2×2 고정 메뉴 그리드 -->
    <div class="card-grid">
      <div class="big-card pastel-indigo" @click="goTo('/approvalList')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-indigo">📑</div>
          <span class="big-card__label">청구목록</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-indigo-600">{{ summary?.approvalCount ?? '0' }}</span>
          <span class="big-card__unit">건 <span class="big-card__suffix">(최근 1개월)</span></span>
        </div>
      </div>

      <div class="big-card pastel-amber" @click="goTo('/approvalStatus')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-amber">⏳</div>
          <span class="big-card__label">결재 대기</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-amber-600">{{ summary?.myApprovalCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>

      <div class="big-card pastel-emerald" @click="goTo('/notices')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-emerald">📢</div>
          <span class="big-card__label">새 공지</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-emerald-600">{{ summary?.unreadNoticeCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>

      <div class="big-card pastel-purple" @click="goTo('/boards')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-purple">💬</div>
          <span class="big-card__label">새 게시글</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-purple-600">{{ summary?.unreadBoardCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>
    </div>

    <!-- 🌟 즐겨찾기 섹션 -->
    <div class="fav-section">
      <div class="fav-section__head">
        <h3 class="fav-section__title">⭐ 나의 즐겨찾기</h3>
        <button class="fav-section__edit" @click="showEdit = true">⚙️ 설정</button>
      </div>

      <div class="fav-grid" v-if="favoriteMenus.length > 0">
        <div
          v-for="menu in favoriteMenus"
          :key="menu.name"
          class="fav-item"
          @click="goTo(menu.path)"
        >
          <div class="fav-item__icon">{{ menu.icon }}</div>
          <span class="fav-item__label">{{ menu.name }}</span>
        </div>
      </div>

      <div v-else class="fav-empty" @click="showEdit = true">
        <div class="fav-empty__icon">➕</div>
        <p>자주 사용하는 메뉴를 등록해 보세요</p>
      </div>
    </div>

    <!-- 하단 여백 -->
    <div class="py-8"></div>

    <!-- ⚙️ 즐겨찾기 설정 모달 -->
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
      <div class="modal-content">
        <div class="modal-head">
          <h3 class="modal-title">즐겨찾기 설정</h3>
          <button class="modal-close" @click="showEdit = false">✕</button>
        </div>
        <p class="modal-desc">자주 사용하는 메뉴를 선택해 주세요 (최대 6개)</p>
        
        <div class="modal-list">
          <button
            v-for="menu in availableMenus"
            :key="menu.name"
            class="modal-item"
            :class="{ 'is-active': isFavorite(menu.name) }"
            @click="toggleFavorite(menu.name)"
          >
            <span class="modal-item__icon">{{ menu.icon }}</span>
            <span class="modal-item__name">{{ menu.name }}</span>
            <span class="modal-item__check" v-if="isFavorite(menu.name)">✔️</span>
          </button>
        </div>

        <div class="modal-foot">
          <button class="modal-btn-save" @click="saveFavorites">저장하기</button>
        </div>
      </div>
    </div>
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

const userName = computed(() => userStore.user?.userName || '');

// 주야간 감지
const isNight = computed(() => {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
});

// 시간대별 세분화된 인사말
const refinedGreeting = computed(() => {
  const h = new Date().getHours();
  if (h >= 6 && h < 9) return '상쾌하고 기분 좋은 아침이에요';
  if (h >= 9 && h < 12) return '오늘 하루도 힘차게 파이팅!';
  if (h >= 12 && h < 18) return '나른한 오후, 잠시 쉬어가며 해요';
  if (h >= 18 && h < 21) return '오늘 하루 정말 고생 많으셨어요';
  return '따뜻하고 편안한 밤 보내세요';
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
    if (userFavorites.value.length >= 6) {
      alert('즐겨찾기는 최대 6개까지만 등록 가능합니다.');
      return;
    }
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
    console.error('즐겨찾기 저장 실패', e);
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
.mobile-portal {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* ── 히어로 배너 ── */
.hero {
  position: relative;
  overflow: visible;
  padding: 2.5rem 1.5rem 4.5rem;
  text-align: center;
}
.hero__bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  border-bottom-left-radius: 45px;
  border-bottom-right-radius: 45px;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.15);
  z-index: 0;
}
.hero__bg::after {
  content: ''; position: absolute; top: -50%; left: -20%; width: 140%; height: 140%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); z-index: 0;
}

/* 밤 테마 스타일 */
.hero.is-night .hero__bg {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.hero.is-night .hero__bg::after {
  background: radial-gradient(circle, rgba(165,180,252,0.1) 0%, transparent 60%);
}

.hero__content { position: relative; z-index: 1; }
.hero__sub { font-size: 0.85rem; color: rgba(255, 255, 255, 0.85); font-weight: 500; margin-bottom: 0.4rem; }
.hero__name { font-size: 1.8rem; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 0.5rem; text-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.hero__name span { display: inline-block; animation: wave 1.5s infinite; transform-origin: 70% 70%; }
.hero__date { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); font-weight: 600; background: rgba(0,0,0,0.1); display: inline-block; padding: 4px 12px; border-radius: 999px; }

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(20deg); }
}

/* ── 카드 그리드 ── */
.card-grid {
  position: relative; z-index: 2; margin-top: -3.5rem;
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.25rem;
}
.big-card {
  border-radius: 20px; padding: 1.1rem; min-height: 110px; cursor: pointer;
  display: flex; flex-direction: column; justify-content: space-between;
  background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;
}
.pastel-indigo  { background: #eff6ff; border: 1px solid #dbeafe; }
.pastel-amber   { background: #fffbeb; border: 1px solid #fef3c7; }
.pastel-emerald { background: #ecfdf5; border: 1px solid #d1fae5; }
.pastel-purple  { background: #f5f3ff; border: 1px solid #ede9fe; }

.big-card__head { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.big-card__icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.6); }
.big-card__label { font-size: 0.8rem; font-weight: 700; color: #4b5563; }
.big-card__body { display: flex; align-items: baseline; justify-content: center; gap: 0.2rem; }
.big-card__count { font-size: 1.75rem; font-weight: 900; }
.big-card__unit { font-size: 0.75rem; font-weight: 700; color: #9ca3af; }
.big-card__suffix { font-size: 0.65rem; color: #94a3b8; font-weight: 500; margin-left: 2px; }

/* 🌟 즐겨찾기 섹션 */
.fav-section { padding: 0.5rem 1.25rem; }
.fav-section__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.fav-section__title { font-size: 1rem; font-weight: 800; color: #374151; }
.fav-section__edit { font-size: 0.8rem; font-weight: 600; color: #6366f1; background: #eef2ff; padding: 4px 10px; border-radius: 8px; }

.fav-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.fav-item {
  background: #fdfdfd; border: 1px solid #f1f5f9; border-radius: 16px; 
  padding: 1rem 0.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.fav-item__icon { font-size: 1.5rem; }
.fav-item__label { font-size: 0.72rem; font-weight: 700; color: #4b5563; text-align: center; }

.fav-empty {
  border: 2px dashed #e2e8f0; border-radius: 20px; padding: 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #94a3b8;
}

/* 모달 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 100; }
.modal-content { 
  width: 100%; background: #fff; border-top-left-radius: 30px; border-top-right-radius: 30px; 
  padding: 1.5rem; max-height: 80vh; overflow-y: auto;
}
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.modal-title { font-size: 1.2rem; font-weight: 800; }
.modal-desc { font-size: 0.85rem; color: #6b7280; margin-bottom: 1.5rem; }

.modal-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
.modal-item {
  display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 15px;
  background: #f9fafb; border: 1px solid #f3f4f6; text-align: left; transition: all 0.2s;
}
.modal-item.is-active { background: #eff6ff; border-color: #3b82f6; }
.modal-item__name { flex: 1; font-weight: 700; color: #374151; }
.modal-item__check { color: #3b82f6; font-weight: 900; }

.modal-btn-save {
  width: 100%; background: #1f2937; color: #fff; padding: 1rem; border-radius: 15px; font-weight: 700;
}
</style>
