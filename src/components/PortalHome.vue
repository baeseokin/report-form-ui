<template>
  <div class="portal font-nanum">

    <!-- ══ 헤더 ══ -->
    <div class="portal-header">
      <div class="portal-header__left">
        <span class="portal-header__greeting">Good {{ timeOfDay }},</span>
        <h1 class="portal-header__name">{{ userName }}<span class="portal-header__dot">.</span></h1>
        <p class="portal-header__date">{{ today }}</p>
      </div>
      <div class="portal-header__right">
        <button v-for="s in shortcuts" :key="s.path"
          class="shortcut-btn"
          @click="goTo(s.path)">
          <span class="shortcut-btn__icon">{{ s.icon }}</span>
          <span class="shortcut-btn__label">{{ s.label }}</span>
        </button>
      </div>
    </div>

    <!-- ══ KPI 스탯 바 ══ -->
    <div class="kpi-row">
      <div v-for="k in kpis" :key="k.key"
        class="kpi-card"
        :style="`--accent: ${k.color};`"
        @click="goTo(k.path)">
        <div class="kpi-card__icon">{{ k.icon }}</div>
        <div class="kpi-card__body">
          <p class="kpi-card__label">{{ k.label }}</p>
          <p class="kpi-card__value">
            <span class="kpi-card__num">{{ summary ? summary[k.key] : '–' }}</span>
            <span class="kpi-card__unit">건</span>
            <span v-if="k.suffix" class="kpi-card__suffix">{{ k.suffix }}</span>
          </p>
        </div>
        <div class="kpi-card__bar"></div>
      </div>
    </div>

    <!-- ══ 메인 패널 2×2 ══ -->
    <div class="panel-grid">

      <!-- 청구목록 -->
      <div class="panel">
        <div class="panel__head">
          <div class="panel__title-wrap">
            <span class="panel__indicator" style="background:#6366f1;"></span>
            <h2 class="panel__title">청구목록 조회</h2>
          </div>
          <button class="panel__more" @click="goTo('/approvalList')">전체 보기 →</button>
        </div>
        <table class="panel-table">
          <thead>
            <tr>
              <th>부서</th><th>문서유형</th><th>신청일</th><th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in summary?.approvalRecent" :key="r.id"
              class="panel-table__row" @click="goTo('/approvalList')">
              <td>{{ r.dept_name }}</td>
              <td>{{ r.document_type }}</td>
              <td>{{ formatDate(r.request_date) }}</td>
              <td><span :class="['status-chip', statusKey(r.status)]">{{ r.status }}</span></td>
            </tr>
            <tr v-if="!summary?.approvalRecent?.length">
              <td colspan="4" class="panel-table__empty">데이터가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 내결재목록 -->
      <div class="panel">
        <div class="panel__head">
          <div class="panel__title-wrap">
            <span class="panel__indicator" style="background:#f59e0b;"></span>
            <h2 class="panel__title">결재 대기 목록</h2>
          </div>
          <button class="panel__more" @click="goTo('/approvalStatus')">전체 보기 →</button>
        </div>
        <table class="panel-table">
          <thead>
            <tr>
              <th>부서</th><th>문서유형</th><th>신청일</th><th>금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in summary?.myApprovalRecent" :key="r.id"
              class="panel-table__row" @click="goTo('/approvalStatus')">
              <td>{{ r.dept_name }}</td>
              <td>{{ r.document_type }}</td>
              <td>{{ formatDate(r.request_date) }}</td>
              <td class="font-semibold text-amber-700">{{ formatAmount(r.total_amount) }}</td>
            </tr>
            <tr v-if="!summary?.myApprovalRecent?.length">
              <td colspan="4" class="panel-table__empty">대기 중인 결재가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 공지사항 -->
      <div class="panel">
        <div class="panel__head">
          <div class="panel__title-wrap">
            <span class="panel__indicator" style="background:#10b981;"></span>
            <h2 class="panel__title">공지사항 <span v-if="summary?.unreadNoticeCount > 0" class="text-red-500 text-xs ml-1">({{ summary.unreadNoticeCount }})</span></h2>
          </div>
          <button class="panel__more" @click="goTo('/notices')">전체 보기 →</button>
        </div>
        <ul class="notice-list">
          <li v-for="n in summary?.noticeRecent" :key="n.id"
            class="notice-list__item" @click="goTo('/notices')">
            <span class="notice-list__bullet" style="background:#10b981;"></span>
            <span class="notice-list__title">{{ n.title }}</span>
            <span v-if="isNew(n.created_at)" class="notice-list__new">NEW</span>
            <span class="notice-list__date">{{ formatDate(n.created_at) }}</span>
          </li>
          <li v-if="!summary?.noticeRecent?.length" class="panel-table__empty">공지사항이 없습니다.</li>
        </ul>
      </div>

      <!-- 게시판 -->
      <div class="panel">
        <div class="panel__head">
          <div class="panel__title-wrap">
            <span class="panel__indicator" style="background:#8b5cf6;"></span>
            <h2 class="panel__title">게시판 <span v-if="summary?.unreadBoardCount > 0" class="text-purple-500 text-xs ml-1">({{ summary.unreadBoardCount }})</span></h2>
          </div>
          <button class="panel__more" @click="goTo('/boards')">전체 보기 →</button>
        </div>
        <ul class="notice-list">
          <li v-for="b in summary?.boardRecent" :key="b.id"
            class="notice-list__item" @click="goTo('/boards')">
            <span class="notice-list__bullet" style="background:#8b5cf6;"></span>
            <span class="notice-list__title">{{ b.title }}</span>
            <span v-if="isNew(b.created_at)" class="notice-list__new">NEW</span>
            <span v-if="b.comment_count > 0" class="notice-list__comment">[{{ b.comment_count }}]</span>
            <span class="notice-list__date">{{ b.author_name }}</span>
          </li>
          <li v-if="!summary?.boardRecent?.length" class="panel-table__empty">게시글이 없습니다.</li>
        </ul>
      </div>

    </div><!-- /panel-grid -->
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
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
});

const today = computed(() => {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
});

const shortcuts = [
  { icon: '📝', label: '지출결의서', path: '/reportForm' },
  { icon: '📑', label: '청구목록', path: '/approvalList' },
  { icon: '✅', label: '내결재', path: '/approvalStatus' },
];

const kpis = [
  { key: 'approvalCount',   label: '청구목록',    icon: '📑', color: '#6366f1', path: '/approvalList', suffix: '(최근 1개월)'  },
  { key: 'myApprovalCount', label: '결재 대기',    icon: '⏳', color: '#f59e0b', path: '/approvalStatus' },
  { key: 'unreadNoticeCount', label: '읽지 않은 공지', icon: '📢', color: '#10b981', path: '/notices'       },
  { key: 'unreadBoardCount', label: '읽지 않은 게시글', icon: '💬', color: '#8b5cf6', path: '/boards'        },
];

const formatDate = (s) => {
  if (!s) return '';
  return new Date(s).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
};

const formatAmount = (n) => {
  if (n == null) return '';
  return Number(n).toLocaleString('ko-KR') + '원';
};

const isNew = (s) => {
  if (!s) return false;
  return (Date.now() - new Date(s).getTime()) < 7 * 24 * 60 * 60 * 1000;
};

const statusKey = (s) => {
  if (s === '결재완료')   return 'done';
  if (s === '결재진행중') return 'pending';
  if (s === '반려')       return 'rejected';
  return 'draft';
};

const goTo = (path) => router.push(path);

onMounted(async () => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, '0');
    const d = String(startDate.getDate()).padStart(2, '0');
    const startDateStr = `${y}-${m}-${d}`;
    
    const res = await axios.get('/api/portal/summary', { params: { startDate: startDateStr } });
    if (res.data.success) summary.value = res.data.data;
  } catch (e) {
    console.error('포탈 요약 로드 실패', e);
  }
});
</script>

<style scoped>
/* ══════════════════════════════ ROOT ══════════════════════════════ */
.portal {
  max-width: 1280px;
  margin: 0 auto;
}

/* ══════════════════════════════ HEADER ══════════════════════════════ */
.portal-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.portal-header__greeting {
  display: block;
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}
.portal-header__name {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
}
.portal-header__dot  { color: #6366f1; }
.portal-header__date {
  margin-top: 0.3rem;
  font-size: 0.78rem;
  color: #6b7280;
}

/* 바로가기 버튼 */
.portal-header__right { display: flex; gap: 0.6rem; align-items: center; }
.shortcut-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  color: #374151;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.shortcut-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #eef2ff;
  transform: translateY(-1px);
}
.shortcut-btn__icon { font-size: 1rem; }

/* ══════════════════════════════ KPI ROW ══════════════════════════════ */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.kpi-card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 1rem;
  padding: 1.2rem 1.3rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.kpi-card__icon {
  font-size: 1.75rem;
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--accent) 12%, white);
  border-radius: 12px;
  flex-shrink: 0;
}
.kpi-card__label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.15rem;
}
.kpi-card__value { display: flex; align-items: baseline; gap: 0.25rem; }
.kpi-card__num {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.kpi-card__unit { font-size: 0.8rem; font-weight: 600; color: #6b7280; }
.kpi-card__suffix { font-size: 0.7rem; color: #9ca3af; font-weight: 500; margin-left: 0.2rem; }
/* 하단 컬러 바 */
.kpi-card__bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent);
  opacity: 0.8;
}

/* ══════════════════════════════ PANEL GRID ══════════════════════════════ */
.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
.panel {
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
}
.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}
.panel__title-wrap { display: flex; align-items: center; gap: 0.5rem; }
.panel__indicator {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.panel__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
}
.panel__more {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}
.panel__more:hover { color: #6366f1; }

/* ── Panel Table ── */
.panel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.panel-table thead tr {
  background: #fafafa;
}
.panel-table th {
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #f3f4f6;
}
.panel-table__row {
  cursor: pointer;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.12s;
}
.panel-table__row:last-child { border-bottom: none; }
.panel-table__row:hover { background: #f9fafb; }
.panel-table td {
  padding: 0.6rem 1rem;
  color: #374151;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.panel-table__empty {
  text-align: center;
  color: #d1d5db;
  padding: 1.5rem !important;
  font-size: 0.78rem;
}

/* ── Status Chips ── */
.status-chip {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.status-chip.done     { background: #d1fae5; color: #065f46; }
.status-chip.pending  { background: #fef3c7; color: #92400e; }
.status-chip.rejected { background: #fee2e2; color: #991b1b; }
.status-chip.draft    { background: #e0e7ff; color: #3730a3; }

/* ── Notice List ── */
.notice-list { list-style: none; margin: 0; padding: 0.25rem 0; }
.notice-list__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.12s;
  font-size: 0.82rem;
}
.notice-list__item:last-child { border-bottom: none; }
.notice-list__item:hover { background: #f9fafb; }
.notice-list__bullet {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.notice-list__title {
  flex: 1;
  color: #374151;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice-list__new {
  font-size: 0.6rem;
  font-weight: 800;
  color: #ef4444;
  background: #fee2e2;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
.notice-list__comment {
  font-size: 0.72rem;
  font-weight: 700;
  color: #8b5cf6;
  flex-shrink: 0;
}
.notice-list__date {
  font-size: 0.7rem;
  color: #9ca3af;
  flex-shrink: 0;
}
</style>
