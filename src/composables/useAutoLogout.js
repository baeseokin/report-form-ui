// src/composables/useAutoLogout.js
import { ref, readonly } from "vue";

let installed = false;

export function useAutoLogout({
  timeoutMs = 5 * 60 * 1000,
  onLogout,
  excludePaths = ["/login", "/auth/*"],
  getCurrentPath = () => location.pathname,
  resetOnFetch = false,       // 프로덕션에서는 false 권장
  debug = false,
  tickMs = 1000,              // ⏱ 카운트다운 갱신 주기(1s)
} = {}) {
  if (typeof window === "undefined") {
    // SSR 안전 가드
    const zero = ref(0);
    return { start: noop, stop: noop, reset: noop, remainingMs: readonly(zero), isExcluded: () => false };
  }

  const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
  const bc = safeBroadcastChannel("auto-logout");

  let timerId = null;      // setTimeout 로그아웃 타이머
  let tickId = null;       // setInterval 카운트다운/heartbeat
  let started = false;
  let lastActivity = Date.now();

  const remainingMs = ref(timeoutMs); // ✅ 외부에서 바인딩해 표시
  const log = (...a) => { if (debug) console.log("[auto-logout]", ...a); };

  function start() {
    if (started) return;
    started = true;

    // 사용자 활동 감지
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility, { passive: true });

    // 탭 간 동기화
    if (bc) {
      bc.onmessage = (ev) => {
        if (ev?.data === "reset") reset(false);
        if (ev?.data === "logout") doLogout(false);
      };
    }

    // fetch 후킹(선택)
    if (resetOnFetch && !installed) {
      installed = true;
      hookFetch(onActivity);
    }

    // ⏱ Heartbeat / 카운트다운 시작
    startTicker();

    log("start");
    reset(); // 현재 경로가 제외면 타이머만 off, 카운트다운은 '—' 처리
  }

  function stop() {
    if (!started) return;
    started = false;

    events.forEach((e) => window.removeEventListener(e, onActivity));
    document.removeEventListener("visibilitychange", onVisibility);

    clearTimeout(timerId);
    timerId = null;

    stopTicker();

    if (bc) bc.onmessage = null;
    log("stop");
  }

  function onActivity() {
    lastActivity = Date.now();
    reset();
  }

  function reset(broadcast = true) {
    if (!started) return;
    const excluded = isExcluded();

    clearTimeout(timerId);

    if (excluded) {
      // 로그인/제외 경로에서는 타이머 off, 남은시간은 전체 시간으로 표시하지 않고 -1로 숨김 처리
      remainingMs.value = -1;
      log("reset skipped (excluded path)", getCurrentPath());
      timerId = null;
    } else {
      lastActivity = Date.now();       // ✅ 재로그인/재무장 시 기준시간 리셋
      // 현재 시점에서 다시 무장
      remainingMs.value = timeoutMs;
      timerId = setTimeout(doLogout, timeoutMs);
      log("reset armed for", timeoutMs, "ms");
    }

    if (broadcast && bc) bc.postMessage("reset");
  }

  function doLogout(broadcast = true) {
    stop(); // 리스너/타이머 정지
    try { if (broadcast && bc) bc.postMessage("logout"); } catch {}
    log("logout");
    onLogout?.();
  }

  function onVisibility() {
    if (!document.hidden) {
      // 포그라운드 복귀 시 즉시 평가
      onActivity();
    }
  }

  // ⏱ 1초마다 남은 시간 계산 + 타임아웃 보조
  function startTicker() {
    if (tickId) return;
    tickId = setInterval(() => {
      if (!started) return;

      if (isExcluded()) {
        remainingMs.value = -1; // 표시 숨김
        return;
      }

      const elapsed = Date.now() - lastActivity;
      const remain = timeoutMs - elapsed;

      remainingMs.value = remain > 0 ? remain : 0;

      if (remain <= 0) {
        log("ticker timeout reached");
        doLogout();
      }
    }, tickMs);
  }
  function stopTicker() {
    if (tickId) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function isExcluded() {
    const path = normalizePath(getCurrentPath());
    return excludePaths.some((p) => matchPath(p, path));
  }

  return {
    start,
    stop,
    reset,
    remainingMs: readonly(remainingMs), // ✅ 바깥에서 읽기 전용으로 표시
    isExcluded,
  };
}

// --- helpers ---
function noop() {}
function safeBroadcastChannel(name) {
  try { if (typeof BroadcastChannel !== "undefined") return new BroadcastChannel(name); } catch {}
  return null;
}
function normalizePath(raw) {
  try {
    const a = document.createElement("a");
    a.href = raw.startsWith("http") ? raw : (location.origin + raw);
    return (a.pathname || "/");
  } catch {
    return raw.split("?")[0].split("#")[0] || "/";
  }
}
// '/login' 또는 '/login/*' 지원
function matchPath(pattern, path) {
  const clean = pattern.replace(/[?#].*$/, "");
  if (clean.endsWith("/*")) {
    const base = clean.slice(0, -2);
    return path === base || path.startsWith(base + "/");
  }
  return path === clean || path.startsWith(clean + "/");
}
function hookFetch(onAnyFetch) {
  if (!window.fetch) return;
  const orig = window.fetch;
  window.fetch = async (...args) => {
    try {
      const res = await orig(...args);
      onAnyFetch?.();
      return res;
    } catch (e) {
      onAnyFetch?.();
      throw e;
    }
  };
}
