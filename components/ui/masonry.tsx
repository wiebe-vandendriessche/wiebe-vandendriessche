"use client"

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

const useMedia = (
  queries: string[],
  values: number[],
  defaultValue: number
): number => {
  const get = () => {
    if (typeof window === "undefined") return defaultValue;
    return values[queries.findIndex((q) => window.matchMedia(q).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setValue(get());
    const mediaQueries = queries.map((q) => window.matchMedia(q));
    mediaQueries.forEach((mq) => mq.addEventListener("change", handler));
    return () => mediaQueries.forEach((mq) => mq.removeEventListener("change", handler));
  }, [queries]);

  return value;
};

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        })
    )
  );
};

interface Item {
  id: string;
  img: string;
  url: string;
  height: number;
}

interface GridItem extends Item {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MasonryProps {
  items: Item[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: "bottom" | "top" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
  /** Animate container height changes (smooth expansion/contraction) */
  animateContainerHeight?: boolean;
  /** Apply responsive height scaling instead of fixed division by 2 */
  responsiveScale?: boolean;
  /** Distance (px) items start offset from their final position for entrance animation */
  initialOffset?: number;
}

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  animateContainerHeight = true,
  responsiveScale = true,
  initialOffset = 80,
}) => {
  const columns = useMedia(
    [
      "(min-width:1500px)",
      "(min-width:1000px)",
      "(min-width:600px)",
      "(min-width:400px)",
    ],
    [5, 4, 3, 2],
    1
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === "random") {
      const dirs = ["top", "bottom", "left", "right"];
      direction = dirs[
        Math.floor(Math.random() * dirs.length)
      ] as typeof animateFrom;
    }

    switch (direction) {
      case "top":
        return { x: item.x, y: -200 };
      case "bottom":
        return { x: item.x, y: window.innerHeight + 200 };
      case "left":
        return { x: -200, y: item.y };
      case "right":
        return { x: window.innerWidth + 200, y: item.y };
      case "center":
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  useEffect(() => {
    preloadImages(items.map((i) => i.img)).then(() => setImagesReady(true));
  }, [items]);

  // Build grid layout and compute overall required container height so the parent can grow.
  const { grid, gridHeight } = useMemo(() => {
    if (!width) return { grid: [] as GridItem[], gridHeight: 0 };
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    const built: GridItem[] = items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      let scaleFactor = 0.5; // fallback similar to previous /2
      if (responsiveScale) {
        // Wider grids need smaller heights; single column shows full height
        if (columns >= 5) scaleFactor = 0.45;
        else if (columns === 4) scaleFactor = 0.5;
        else if (columns === 3) scaleFactor = 0.6;
        else if (columns === 2) scaleFactor = 0.75;
        else scaleFactor = 1; // 1 column, full height
      }
      const height = child.height * scaleFactor;
      const y = colHeights[col];
      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height };
    });

    const maxHeight = built.length
      ? Math.max(...built.map((i) => i.y + i.h))
      : 0;

    return { grid: built, gridHeight: maxHeight };
  }, [columns, items, width]);

  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!imagesReady) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        // Instead of animating from far outside the viewport (which caused scrollbar flicker),
        // we use a modest offset so elements stay within the container's predetermined height.
        const base = { x: item.x, y: item.y };
        let start = { ...base };
        switch (animateFrom) {
          case 'top':
            start.y = item.y - initialOffset;
            break;
          case 'bottom':
            start.y = item.y + initialOffset;
            break;
          case 'left':
            start.x = item.x - initialOffset;
            break;
          case 'right':
            start.x = item.x + initialOffset;
            break;
          case 'center':
            start = { x: item.x, y: item.y }; // could also add small scale/blur only
            break;
          case 'random': {
            const dirs = ['top','bottom','left','right'];
            const dir = dirs[Math.floor(Math.random()*dirs.length)];
            if (dir === 'top') start.y = item.y - initialOffset;
            else if (dir === 'bottom') start.y = item.y + initialOffset;
            else if (dir === 'left') start.x = item.x - initialOffset;
            else if (dir === 'right') start.x = item.x + initialOffset;
            break; }
          default:
            start.y = item.y + initialOffset * 0.5;
        }
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: start.x,
            y: start.y,
            width: item.w,
            height: item.h,
            ...(blurToFocus && { filter: "blur(10px)" }),
          },
          {
            opacity: 1,
            ...animProps,
            ...(blurToFocus && { filter: "blur(0px)" }),
            duration: 0.8,
            ease: "power3.out",
            delay: index * stagger,
          }
        );
      } else {
        gsap.to(selector, {
          ...animProps,
          duration,
          ease,
          overwrite: "auto",
        });
      }
    });

    hasMounted.current = true;
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease, initialOffset]);

  const handleMouseEnter = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector(".color-overlay") as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
    }
  };

  const handleMouseLeave = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector(".color-overlay") as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
    }
  };

  // Smoothly animate container height changes
  const previousHeight = useRef<number>(0);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const target = gridHeight ? gridHeight + 16 : 0; // include final gap
    if (animateContainerHeight && previousHeight.current && previousHeight.current !== target) {
      gsap.fromTo(
        containerRef.current,
        { height: previousHeight.current },
        { height: target, duration: 0.5, ease: "power2.out" }
      );
    } else {
      containerRef.current.style.height = `${target}px`;
    }
    previousHeight.current = target;
  }, [gridHeight, animateContainerHeight]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-max"
      // Height is updated via effect for smoother animation, no overflow clipping needed
      style={!animateContainerHeight ? { height: gridHeight ? gridHeight + 16 : undefined, overflowAnchor: 'none' } : { overflowAnchor: 'none' }}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="absolute box-content"
          style={{ willChange: "transform, width, height, opacity" }}
          onClick={() => window.open(item.url, "_blank", "noopener")}
          onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center rounded-[10px] shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-[10px]"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            {colorShiftOnHover && (
              <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Masonry;
