import { useEffect } from "react";

/**
 * Hook to lock body scroll when a component is mounted with lock=true.
 * Uses a data-attribute on document.body to track the number of active locks.
 * This is safer than a global variable in environments with HMR or complex routing.
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    const body = document.body;
    const currentLocks = parseInt(
      body.getAttribute("data-scroll-locks") || "0",
      10,
    );
    const newLocks = currentLocks + 1;

    body.setAttribute("data-scroll-locks", newLocks.toString());

    if (newLocks === 1) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }

    return () => {
      const latestLocks = parseInt(
        body.getAttribute("data-scroll-locks") || "0",
        10,
      );
      const remainingLocks = Math.max(0, latestLocks - 1);

      body.setAttribute("data-scroll-locks", remainingLocks.toString());

      if (remainingLocks === 0) {
        body.removeAttribute("data-scroll-locks");
        body.style.overflow = "";
        body.style.paddingRight = "";
      }
    };
  }, [lock]);
}
