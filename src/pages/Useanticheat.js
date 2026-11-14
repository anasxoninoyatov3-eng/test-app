import { useEffect, useRef } from "react";

export const isFullscreenSupported = () =>
  typeof document !== "undefined" &&
  !!document.documentElement.requestFullscreen;

// Faqat foydalanuvchi bosgan tugma (click) ichida chaqirilishi kerak
export const enterFullscreen = async () => {
  await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  try {
    // Chrome/Edge: Esc ni 2 soniya bosib turmaguncha fullscreen'dan chiqarmaydi
    if (navigator.keyboard?.lock) await navigator.keyboard.lock(["Escape"]);
  } catch {
    /* qo'llab-quvvatlanmasa, e'tiborsiz */
  }
};

export const exitFullscreen = async () => {
  try {
    navigator.keyboard?.unlock?.();
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* e'tiborsiz */
  }
};

/**
 * enabled=true bo'lganda quyidagilar kuzatiladi:
 *  - fullscreen'dan chiqish (Esc, F11, ...)
 *  - tab/oyna almashish (Alt+Tab, Win, Ctrl+Win+Chap/O'ng, ...)
 *  - taqiqlangan tugmalar (Esc, F11, F12, Win, Alt+Tab, Ctrl+Shift+...)
 * Birinchi buzilishda onViolation(reason) FAQAT BIR MARTA chaqiriladi.
 * disarm() - testni qasddan tugatganda (fullscreen'dan chiqishdan oldin) chaqiring.
 */
export const useAntiCheat = ({ enabled, onViolation }) => {
  const cbRef = useRef(onViolation);
  const doneRef = useRef(false);

  useEffect(() => {
    cbRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    doneRef.current = false;
    let armed = false;
    // fullscreen'ga kirish paytidagi blur/resize hodisalarini o'tkazib yuborish
    const armTimer = setTimeout(() => {
      armed = true;
    }, 800);

    const fire = (reason) => {
      if (!armed || doneRef.current) return;
      doneRef.current = true;
      cbRef.current?.(reason);
    };

    const onFsChange = () => {
      if (!document.fullscreenElement) {
        fire("To'liq ekran rejimidan chiqdi (Esc / F11)");
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        fire("Boshqa oynaga yoki tabga o'tdi (Alt+Tab / Win)");
      }
    };
    const onBlur = () => {
      fire("Test oynasi fokusini yo'qotdi (Alt+Tab / Ctrl+Shift / boshqa dastur)");
    };
    const onKeyDown = (e) => {
      const key = e.key;
      const forbidden =
        key === "Escape" ||
        key === "F11" ||
        key === "F12" ||
        key === "Meta" ||
        (e.altKey && key === "Tab") ||
        (e.ctrlKey && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && ["u", "s", "p"].includes(key.toLowerCase()));
      if (forbidden) {
        e.preventDefault();
        fire(`Taqiqlangan tugma bosildi: ${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.altKey ? "Alt+" : ""}${key}`);
      }
    };
    const block = (e) => e.preventDefault();

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);

    return () => {
      doneRef.current = true;
      clearTimeout(armTimer);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
    };
  }, [enabled]);

  return {
    disarm: () => {
      doneRef.current = true;
    },
  };
<<<<<<< HEAD
};
=======
};
>>>>>>> 8ce8ad3 (Create a anticheat)
