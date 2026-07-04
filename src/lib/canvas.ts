import { useEffect, useRef } from "react";

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

/**
 * Renders a canvas at devicePixelRatio resolution and re-runs the draw
 * callback whenever the color theme changes, since drawings read CSS
 * custom properties at draw time rather than caching them.
 */
export function useThemedCanvas(draw: DrawFn, deps: unknown[] = []) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    function render() {
      const el = canvas!;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth || el.width;
      const h = el.clientHeight || el.height;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h);
    }

    render();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", render);

    const observer = new MutationObserver(render);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("resize", render);

    return () => {
      mq.removeEventListener("change", render);
      observer.disconnect();
      window.removeEventListener("resize", render);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
