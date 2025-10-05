// src/composables/useAutoLogout.js
let installed = false;

export function useAutoLogout({
  timeoutMs = 5 * 60 * 1000,
  onLogout,
  excludePaths = ["/login"],
  getCurrentPath = () => location.pathname,
  resetOnFetch = true,
  debug = false,
} = {}) {
  if (typeof window === "undefined") return dummy();

  const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
  const bc = safeBroadcastChannel("auto-logout");
  let timerId = null;
  let started = false;

  function log(...args) { if (debug) console.log("[auto-logout]", ...args); }

  function start() {
    if (started) return;
    started = true;

    // ❌ (기존) isExcluded()면 여기서 return → 이후에도 영원히 시작 안 함
    // ✅ 항상 리스너는 등록하고, 타이머는 reset()에서만 경로 기준으로 관리
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility, { passive: true });

    if (bc) {
      bc.onmessage = (ev) => {
        if (ev?.data === "reset") reset(false);
        if (ev?.data === "logout") doLogout(false);
      };
    }

    if (resetOnFetch && !installed) {
      installed = true;
      hookFetch(reset);
    }

    log("start");
    reset(); // 현재 경로가 제외면 타이머만 멈춘 상태로 대기
  }

  function stop() {
    if (!started) return;
    started = false;
    events.forEach((e) => window.removeEventListener(e, reset));
    document.removeEventListener("visibilitychange", onVisibility);
    clearTimeout(timerId);
    timerId = null;
    if (bc) bc.onmessage = null;
    log("stop");
  }

  function reset(broadcast = true) {
    if (!started) return;
    const excluded = isExcluded();
    clearTimeout(timerId);
    if (excluded) {
      log("reset skipped (excluded path)", getCurrentPath());
      timerId = null; // 제외 경로면 타이머 미가동
    } else {
      timerId = setTimeout(doLogout, timeoutMs);
      log("reset armed for", timeoutMs, "ms");
    }
    if (broadcast && bc) bc.postMessage("reset");
  }

  function doLogout(broadcast = true) {
    stop();
    try { if (broadcast && bc) bc.postMessage("logout"); } catch {}
    log("logout");
    onLogout?.();
  }

  function onVisibility() {
    if (!document.hidden) reset();
  }

  function isExcluded() {
    const path = getCurrentPath();
    return excludePaths.some((p) => matchPath(p, path));
  }

  return { start, stop, reset };
}

function dummy() { return { start(){}, stop(){}, reset(){} }; }
function safeBroadcastChannel(name) {
  try { if (typeof BroadcastChannel !== "undefined") return new BroadcastChannel(name); } catch {}
  return null;
}
function matchPath(pattern, path) {
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    return path === base || path.startsWith(base + "/");
  }
  return pattern === path;
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
