<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex">
    <div class="bg-white w-full h-full p-4 pt-3 relative overflow-hidden">
      <!-- 헤더 -->
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-bold">부서 선택</h3>
        <button class="text-2xl" @click="$emit('close')">✕</button>
      </div>

      <!-- 초성 필터 -->
      <div class="mb-2 flex flex-wrap gap-1">
        <button
          v-for="ch in chosungs"
          :key="ch"
          class="px-2 py-1 rounded border text-sm"
          :class="{'bg-purple-100 border-purple-300': ch === activeChosung}"
          @click="toggleChosung(ch)"
        >{{ ch }}</button>
        <button
          class="ml-2 px-2 py-1 rounded border text-sm"
          :class="{'bg-gray-100': !activeChosung}"
          @click="clearChosung"
        >전체</button>
      </div>

      <!-- 리스트 컨테이너 -->
      <div class="relative h-[70vh]">
        <!-- 스크롤 영역 -->
        <div ref="scrollArea" class="absolute inset-0 overflow-auto pr-6">
          <!-- ⭐🕘 상단 고정 바 (즐겨찾기/최근) -->
          <div class="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
            <div class="px-2 py-2 space-y-2">
              <div v-if="favoriteDepts.length" class="space-y-1">
                <div class="text-xs text-gray-500">⭐ 즐겨찾기</div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="d in favoriteDepts"
                    :key="'fav-'+d.id"
                    :data-testid="'dept-item-' + d.dept_name"
                    class="px-3 py-2 rounded-full bg-yellow-50 border border-yellow-200 text-sm active:bg-yellow-100"
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
                    :data-testid="'dept-item-' + d.dept_name"
                    class="px-3 py-2 rounded-full bg-gray-50 border text-sm active:bg-gray-100"
                    @click="select(d)"
                  >
                    {{ d.dept_name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 섹션별 리스트 -->
          <div
            v-for="group in grouped"
            :key="group.key"
            :ref="el => setSectionRef(group.key, el)"
            class="mb-2"
          >
            <div class="sticky top-[0] bg-white/90 backdrop-blur px-1 py-1 text-xs text-gray-500 border-b">
              {{ group.key }}
            </div>
            <div class="divide-y">
              <div
                v-for="d in group.items"
                :key="d.id"
                :data-testid="'dept-item-' + d.dept_name"
                class="px-1 py-3 flex items-center justify-between active:bg-purple-50"
                @click="select(d)"
              >
                <div class="text-base">{{ d.dept_name }}</div>
                <div class="flex items-center gap-2">
                  <div class="text-xs text-gray-400">{{ d.dept_cd }}</div>
                  <button
                    class="ml-2 text-yellow-500 text-lg"
                    @click.stop="toggleFavorite(d)"
                    :aria-label="isFavorite(d) ? '즐겨찾기 제거' : '즐겨찾기 추가'"
                  >{{ isFavorite(d) ? '★' : '☆' }}</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!grouped.length" class="p-6 text-center text-gray-500">
            결과가 없습니다
          </div>
        </div>

        <!-- 오른쪽 인덱스 바 -->
        <div class="absolute right-0 top-0 h-full flex flex-col items-center justify-center gap-1 pr-1">
          <button
            v-for="i in indexLabels"
            :key="i"
            class="text-[10px] px-1 py-0.5 rounded text-gray-500 active:bg-gray-100"
            @click="jump(i)"
          >{{ i }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  departments: { type: Array, default: () => [] },
  favorites: { type: Array, default: () => [] }, // [deptId]
  recent: { type: Array, default: () => [] },    // [deptId]
});
const emit = defineEmits(["close", "select", "update:favorites"]);

const chosungs = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const activeChosung = ref("");
const scrollArea = ref(null);

// 초성 추출
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

function isFavorite(d) { return props.favorites.includes(d.id); }
function toggleFavorite(d) {
  const next = isFavorite(d) ? props.favorites.filter(x => x !== d.id) : [d.id, ...props.favorites];
  emit("update:favorites", next.slice(0,50));
}

function select(d) {
  emit("select", d);
}

// 초성 토글
function toggleChosung(ch) {
  activeChosung.value = (activeChosung.value === ch) ? "" : ch;
}
function clearChosung() { activeChosung.value = ""; }

// 그룹핑
const grouped = computed(() => {
  let list = props.departments;
  if (activeChosung.value) {
    list = list.filter(d => getChosung(d.dept_name?.[0]) === activeChosung.value);
  }
  const map = new Map();
  for (const d of list) {
    const first = (d.dept_name || d.dept_cd || "").charAt(0);
    const key = /^[A-Za-z]$/.test(first) ? first.toUpperCase() : getChosung(first) || "기타";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  const arr = Array.from(map.entries()).map(([key, items]) => ({
    key,
    items: items.sort((a,b) => a.dept_name.localeCompare(b.dept_name, "ko"))
  }));
  const order = (k) => {
    const i = chosungs.indexOf(k);
    if (i >= 0) return i;
    if (/^[A-Z]$/.test(k)) return 100 + k.charCodeAt(0);
    return 1000;
  };
  return arr.sort((a,b) => order(a.key)-order(b.key));
});

// 섹션 점프
const sectionRefs = {};
function setSectionRef(key, el) { if (el) sectionRefs[key] = el; }
const indexLabels = computed(() => [...chosungs, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "기타"]);
function jump(label) {
  const el = sectionRefs[label];
  if (el && scrollArea.value) {
    scrollArea.value.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
  }
}
</script>

<style scoped>
/* 모바일 터치 UX에 최적화된 기본 스타일 */
</style>
