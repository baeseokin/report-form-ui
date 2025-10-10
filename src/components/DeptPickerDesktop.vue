<template>
  <!-- 오버레이 -->
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <!-- 모달 카드 -->
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-[560px] h-[70vh] flex flex-col overflow-hidden">
      <!-- 헤더 -->
      <div class="flex items-center justify-between border-b p-4">
        <h3 class="text-lg font-bold">부서 선택</h3>
        <button class="text-2xl text-gray-500 hover:text-black" @click="$emit('close')">✕</button>
      </div>

      <!-- 즐겨찾기 & 최근 (상단 고정) -->
      <div class="border-b bg-white sticky top-0 z-10 px-4 py-3 space-y-2">
        <div v-if="favoriteDepts.length" class="space-y-1">
          <div class="text-xs text-gray-500">⭐ 즐겨찾기</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in favoriteDepts"
              :key="'fav-'+d.id"
              class="px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-sm hover:bg-yellow-100"
              @click="select(d)"
            >
              {{ d.dept_name }}
            </button>
          </div>
        </div>

        <div v-if="recentDepts.length" class="space-y-1">
          <div class="text-xs text-gray-500">🕘 최근</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in recentDepts"
              :key="'recent-'+d.id"
              class="px-3 py-1 rounded-full bg-gray-50 border text-sm hover:bg-gray-100"
              @click="select(d)"
            >
              {{ d.dept_name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 검색 입력 -->
      <div class="px-4 py-3 border-b">
        <input
          v-model="query"
          type="text"
          placeholder="부서명 또는 코드 검색..."
          class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-purple-300"
        />
      </div>

      <!-- 리스트 -->
      <div class="flex-1 overflow-auto px-4 py-2">
        <div
          v-for="group in grouped"
          :key="group.key"
          class="mb-2"
        >
          <div class="sticky top-0 bg-white text-xs text-gray-500 py-1">{{ group.key }}</div>
          <div class="divide-y">
            <div
              v-for="d in group.items"
              :key="d.id"
              class="py-2 flex justify-between items-center cursor-pointer hover:bg-purple-50"
              @click="select(d)"
            >
              <div>{{ d.dept_name }}</div>
              <div class="flex items-center gap-2">
                <div class="text-xs text-gray-400">{{ d.dept_cd }}</div>
                <button
                  class="text-yellow-500 text-lg"
                  @click.stop="toggleFavorite(d)"
                  :aria-label="isFavorite(d) ? '즐겨찾기 제거' : '즐겨찾기 추가'"
                >{{ isFavorite(d) ? '★' : '☆' }}</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!grouped.length" class="p-6 text-center text-gray-500 text-sm">
          검색 결과가 없습니다.
        </div>
      </div>

      <!-- 하단 닫기 버튼 -->
      <div class="border-t p-3 flex justify-end bg-gray-50">
        <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm font-semibold" @click="$emit('close')">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  departments: { type: Array, default: () => [] },
  favorites: { type: Array, default: () => [] },
  recent: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "select", "update:favorites"]);

const query = ref("");

// 초성 목록
const chosungs = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// 초성 계산
function getChosung(kor) {
  const base = 0xac00;
  const code = kor?.charCodeAt(0) ?? 0;
  if (code < 0xac00 || code > 0xd7a3) return "";
  const idx = Math.floor((code - base) / 588);
  return chosungs[idx] || "";
}

// 즐겨찾기/최근 계산
const favoriteDepts = computed(() => props.favorites.map(id => props.departments.find(d => d.id === id)).filter(Boolean));
const recentDepts   = computed(() => props.recent.map(id => props.departments.find(d => d.id === id)).filter(Boolean));

// 검색 결과 필터링
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.departments;
  return props.departments.filter(d =>
    d.dept_name.toLowerCase().includes(q) || d.dept_cd.toLowerCase().includes(q)
  );
});

// 초성 그룹화
const grouped = computed(() => {
  const map = new Map();
  for (const d of filtered.value) {
    const first = (d.dept_name || d.dept_cd || "").charAt(0);
    const key = /^[A-Za-z]$/.test(first)
      ? first.toUpperCase()
      : getChosung(first) || "기타";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  const arr = Array.from(map.entries()).map(([key, items]) => ({
    key,
    items: items.sort((a, b) => a.dept_name.localeCompare(b.dept_name, "ko")),
  }));
  const order = (k) => {
    const i = chosungs.indexOf(k);
    if (i >= 0) return i;
    if (/^[A-Z]$/.test(k)) return 100 + k.charCodeAt(0);
    return 1000;
  };
  return arr.sort((a, b) => order(a.key) - order(b.key));
});

// 이벤트
function select(d) {
  emit("select", d);
}

function toggleFavorite(d) {
  const next = isFavorite(d)
    ? props.favorites.filter(x => x !== d.id)
    : [d.id, ...props.favorites];
  emit("update:favorites", next.slice(0, 50));
}

function isFavorite(d) {
  return props.favorites.includes(d.id);
}
</script>

<style scoped>
/* 부드러운 스크롤 및 반응형 조정 */
@media (max-width: 640px) {
  .max-w-\[560px\] {
    width: 90vw !important;
    height: 80vh !important;
  }
}
</style>
