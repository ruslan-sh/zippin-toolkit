import { useEffect } from "preact/hooks";

// App URL writers emit urlchange because pushState does not emit browser events.
export function useUrlChange(onChange: () => void): void {
  useEffect(() => {
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    window.addEventListener("urlchange", onChange);

    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("urlchange", onChange);
    };
  }, [onChange]);
}
