<template>
  <div class="mobile-portal font-nanum">

    <!-- 상단 인사 배너 (세련된 파스텔 톤) -->
    <div class="hero">
      <div class="hero__bg"></div>
      <div class="hero__content">
        <p class="hero__sub">{{ timeOfDay }},</p>
        <h1 class="hero__name">{{ userName }} <span>👋</span></h1>
        <p class="hero__date">{{ today }}</p>
      </div>
    </div>

    <!-- 2×2 카드 그리드 (카드별 파스텔 톤 적용) -->
    <div class="card-grid">

      <!-- ① 청구목록 -->
      <div class="big-card pastel-indigo" @click="goTo('/approvalList')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-indigo">📑</div>
          <span class="big-card__label">청구목록</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-indigo-600">{{ summary?.approvalCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>

      <!-- ② 내결재목록 -->
      <div class="big-card pastel-amber" @click="goTo('/approvalStatus')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-amber">⏳</div>
          <span class="big-card__label">결재 대기</span>
          <div class="big-card__badge" v-if="(summary?.myApprovalCount ?? 0) > 0">
            {{ summary.myApprovalCount }}
          </div>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-amber-600">{{ summary?.myApprovalCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>

      <!-- ③ 공지사항 -->
      <div class="big-card pastel-emerald" @click="goTo('/notices')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-emerald">📢</div>
          <span class="big-card__label">읽지 않은 공지</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-emerald-600">{{ summary?.unreadNoticeCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>

      <!-- ④ 게시판 -->
      <div class="big-card pastel-purple" @click="goTo('/boards')">
        <div class="big-card__head">
          <div class="big-card__icon-wrap icon-purple">💬</div>
          <span class="big-card__label">읽지 않은 게시글</span>
        </div>
        <div class="big-card__body">
          <span class="big-card__count text-purple-600">{{ summary?.unreadBoardCount ?? '0' }}</span>
          <span class="big-card__unit">건</span>
        </div>
      </div>

    </div>

    <!-- 바로가기 영역 (부드러운 디자인) -->
    <div class="px-5 mt-3">
      <button class="quick-btn" @click="goTo('/reportForm')">
        <span class="mr-2">📝</span> 지출결의서 작성하기
      </button>
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

const userName = computed(() => userStore.user?.userName || '');

const timeOfDay = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '안녕하세요';
  return '좋은 저녁이에요';
});

const today = computed(() => new Date().toLocaleDateString('ko-KR', {
  month: 'long', day: 'numeric', weekday: 'long'
}));

const goTo = (path) => router.push(path);

onMounted(async () => {
  try {
    const res = await axios.get('/api/portal/summary');
    if (res.data.success) summary.value = res.data.data;
  } catch (e) {
    console.error('포탈 요약 로드 실패', e);
  }
});
</script>

<style scoped>
.mobile-portal {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* ── 히어로 배너 (연한 파스텔 블루) ── */
.hero {
  position: relative;
  overflow: hidden;
  padding: 1.75rem 1.25rem 2.25rem;
  flex-shrink: 0;
}
.hero__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
  z-index: 0;
  border-bottom: 8px solid #fff;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
}
.hero__content { position: relative; z-index: 1; text-align: center; }
.hero__sub  { font-size: 0.75rem; color: #6b7280; font-weight: 600; margin-bottom: 0.2rem; }
.hero__name { font-size: 1.5rem; font-weight: 800; color: #1f2937; line-height: 1.2; margin-bottom: 0.3rem; }
.hero__date { font-size: 0.72rem; color: #9ca3af; font-weight: 500; }

/* ── 2×2 카드 그리드 ── */
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  padding: 1.25rem;
}

/* ── 파스텔 카드 공통 ── */
.big-card {
  position: relative;
  border-radius: 20px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 110px;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  border: 1px solid transparent;
}
.big-card:active {
  transform: scale(0.96);
  filter: brightness(0.98);
}

/* 각각의 파스텔 컬러링 */
.pastel-indigo  { background: #eff6ff; border-color: #dbeafe; }
.pastel-amber   { background: #fffbeb; border-color: #fef3c7; }
.pastel-emerald { background: #ecfdf5; border-color: #d1fae5; }
.pastel-purple  { background: #f5f3ff; border-color: #ede9fe; }

.big-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.big-card__icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.6);
}

.big-card__label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #4b5563;
}

.big-card__body {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.big-card__count {
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
}

.big-card__unit {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9ca3af;
}

.big-card__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff5a5a;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 2px 5px rgba(255, 90, 90, 0.3);
  border: 2px solid #fff;
}

/* 바로가기 버튼 (은은한 디자인) */
.quick-btn {
  width: 100%;
  background: #fdfdfd;
  color: #4b5563;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0.95rem;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  transition: all 0.1s;
}
.quick-btn:active {
  transform: scale(0.98);
  background: #f8fafc;
}
</style>
