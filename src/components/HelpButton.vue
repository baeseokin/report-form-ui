<template>
  <div
    v-if="content"
    class="inline-block relative"
  >
    <div
      class="relative"
      @mouseenter="showBubble = true"
      @mouseleave="showBubble = false"
    >
      <!-- HELP 버튼 -->
      <button
        ref="buttonRef"
        type="button"
        class="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide shadow transition-all duration-200 select-none"
        :class="buttonClass"
        aria-label="화면 사용법 도움말"
      >
        HELP
      </button>

      <!-- 말풍선: 모바일=fixed로 화면 안(좌우 여백), lg 이상=버튼 왼쪽·하단 -->
      <Transition name="bubble">
        <div
          v-show="showBubble"
          class="p-4 rounded-xl shadow-xl border-2 border-amber-200 bg-amber-50 text-gray-800 text-left z-[101] fixed left-4 right-4 lg:absolute lg:top-full lg:mt-2 lg:left-0 lg:right-auto lg:w-80 lg:max-w-[calc(100vw-2rem)]"
          role="tooltip"
          :style="bubbleTopStyle"
        >
          <div class="absolute -top-2 right-6 left-auto w-4 h-4 rotate-45 border-l border-t border-amber-200 bg-amber-50 lg:right-auto lg:left-6 pointer-events-none"></div>
          <p class="font-bold text-amber-800 text-sm mb-2">📌 화면 용도</p>
          <p class="text-sm leading-relaxed mb-3">{{ content.purpose }}</p>
          <p class="font-bold text-amber-800 text-sm mb-1">📋 사용 순서</p>
          <ol class="text-sm leading-relaxed list-decimal list-inside space-y-1">
            <li v-for="(step, i) in content.steps" :key="i" class="pl-0">
              {{ step.replace(/^\d+\.\s*/, "") }}
            </li>
          </ol>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";

const props = defineProps({
  content: {
    type: Object,
    default: null,
  },
  /** 버튼 스타일: 'amber' | 'purple' | 'indigo' */
  variant: {
    type: String,
    default: "amber",
  },
});

const showBubble = ref(false);
const buttonRef = ref(null);
const bubbleTopPx = ref(0);
const isMobile = ref(false);

const MOBILE_MAX = 1023;

function checkMobile() {
  isMobile.value = window.innerWidth <= MOBILE_MAX;
}

function updateBubbleTop() {
  nextTick(() => {
    const el = buttonRef.value;
    if (el) {
      const rect = el.getBoundingClientRect();
      bubbleTopPx.value = rect.bottom + 8;
    }
  });
}

watch(showBubble, (v) => {
  if (v) updateBubbleTop();
});

const bubbleTopStyle = computed(() => {
  if (!showBubble.value || !isMobile.value) return {};
  return { top: `${bubbleTopPx.value}px` };
});

const buttonClass = computed(() => {
  const base = "bg-slate-500 hover:bg-slate-600 text-white hover:shadow-md";
  if (props.variant === "purple") return "bg-slate-500 hover:bg-slate-600 text-white hover:shadow-md";
  if (props.variant === "indigo") return "bg-slate-500 hover:bg-slate-600 text-white hover:shadow-md";
  return base;
});

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});
onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
