"use client"

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";

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

// Simple hook to detect mobile breakpoint (<=768px)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Initial
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
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
  /** Optional categories for filtering */
  categories?: string[];
  /** Optional human readable title */
  title?: string;
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
  /** Start images in grayscale and reveal color on hover */
  grayscaleToColor?: boolean;
  /** Active category to highlight. If provided and not 'all', non-matching items are blurred & disabled */
  activeCategory?: string;
  /** When true (default), on small screens (mobile) filtered-out items are completely removed instead of just dimmed */
  collapseFilteredOnMobile?: boolean;
  /** Callback when an item is clicked */
  onSelect?: (item: Item) => void;
  /** If true, use image aspect ratio for layout instead of item.height */
  useImageAspectRatio?: boolean;
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
  responsiveScale = false,
  initialOffset = 80,
  grayscaleToColor = true,
  activeCategory,
  collapseFilteredOnMobile = true,
  onSelect,
  useImageAspectRatio = false,
}) => {
  const columnsRaw = useMedia(
    [
      "(min-width:1500px)",
      "(min-width:1000px)",
      "(min-width:600px)",
      "(min-width:400px)",
    ],
    [5, 4, 3, 2],
    1
  );

  // If too few items, reduce columns so we always have at least 2 rows if possible
  const columns = useMemo(() => {
    if (items.length === 0) return 1;
    // Try to make at least 2 rows if possible
    const maxColumns = Math.max(1, Math.min(columnsRaw, Math.floor(items.length / 1.5) || 1));
    return Math.min(columnsRaw, maxColumns, items.length);
  }, [columnsRaw, items.length]);

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  // Detect mobile viewport (up to 768px width)
  const isMobile = useIsMobile();

  // Decide which items participate in layout (removing non-matching on mobile if requested)
  const layoutItems = useMemo(() => {
    if (collapseFilteredOnMobile && isMobile && activeCategory && activeCategory !== 'all') {
      return items.filter(i => (i.categories || []).includes(activeCategory));
    }
    return items;
  }, [items, collapseFilteredOnMobile, isMobile, activeCategory]);

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
    if (!useImageAspectRatio) {
      preloadImages(layoutItems.map((i) => i.img)).then(() => setImagesReady(true));
      return;
    }
    // Preload images and get aspect ratios
    const preloadImagesWithAspect = async (items: Item[]): Promise<Record<string, number>> => {
      const results: Record<string, number> = {};
      await Promise.all(
        items.map(
          (item) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.src = item.img;
              img.onload = () => {
                results[item.id] = img.naturalWidth / img.naturalHeight;
                resolve();
              };
              img.onerror = () => {
                results[item.id] = 1; // fallback to 1:1
                resolve();
              };
            })
        )
      );
      return results;
    };
    preloadImagesWithAspect(layoutItems).then((ratios) => {
      setAspectRatios(ratios);
      setImagesReady(true);
    });
  }, [layoutItems, useImageAspectRatio]);

  // Build grid layout and compute overall required container height so the parent can grow.
  const { grid, gridHeight } = useMemo(() => {
    if (!width) return { grid: [] as GridItem[], gridHeight: 0 };
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;
    const built: GridItem[] = layoutItems.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      let height: number;
      if (useImageAspectRatio) {
        const aspect = aspectRatios[child.id] || 1;
        height = columnWidth / aspect;
      } else {
        let scaleFactor = 0.5;
        if (responsiveScale) {
          if (columns >= 5) scaleFactor = 0.45;
          else if (columns === 4) scaleFactor = 0.5;
          else if (columns === 3) scaleFactor = 0.6;
          else if (columns === 2) scaleFactor = 0.75;
          else scaleFactor = 1;
        }
        height = child.height * scaleFactor;
      }
      const y = colHeights[col];
      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height };
    });

    const maxHeight = built.length
      ? Math.max(...built.map((i) => i.y + i.h))
      : 0;

    return { grid: built, gridHeight: maxHeight };
  }, [columns, layoutItems, width, responsiveScale, useImageAspectRatio, aspectRatios]);

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
            const dirs = ['top', 'bottom', 'left', 'right'];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            if (dir === 'top') start.y = item.y - initialOffset;
            else if (dir === 'bottom') start.y = item.y + initialOffset;
            else if (dir === 'left') start.x = item.x - initialOffset;
            else if (dir === 'right') start.x = item.x + initialOffset;
            break;
          }
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
      className="relative h-max"
      // Height is updated via effect for smoother animation, no overflow clipping needed
      style={!animateContainerHeight ? { height: gridHeight ? gridHeight + 16 : undefined, overflowAnchor: 'none' } : { overflowAnchor: 'none' }}
    >
      {grid.map((item) => (
        (() => {
          const dimmed = !!(activeCategory && activeCategory !== 'all' && !(item.categories || []).includes(activeCategory));
          const actuallyDimmed = dimmed && !(collapseFilteredOnMobile && isMobile);
          return (
            <div
              key={item.id}
              data-key={item.id}
              data-category={(item.categories && item.categories[0]) || ''}
              className={
                "group absolute box-content " +
                (actuallyDimmed ? "pointer-events-none" : "cursor-pointer")
              }
              style={{ willChange: "transform, width, height, opacity" }}
              onClick={(e) => {
                if (actuallyDimmed) return;
                if (onSelect) {
                  onSelect(item);
                } else if (item.url) {
                  // Fallback behaviour if no onSelect provided
                  window.open(item.url, "_blank", "noopener");
                }
              }}
              onMouseEnter={(e) => { if (!actuallyDimmed) handleMouseEnter(item.id, e.currentTarget); }}
              onMouseLeave={(e) => { if (!actuallyDimmed) handleMouseLeave(item.id, e.currentTarget); }}
            >
              <Card
                className={
                  "relative w-full h-full overflow-hidden transition-all duration-300 " +
                  (grayscaleToColor ? 'grayscale ease-out group-hover:grayscale-0 ' : '') +
                  (actuallyDimmed ? ' blur-[2px] opacity-30 scale-[0.98]' : '')
                }
                style={{ backgroundImage: `url(${item.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                {colorShiftOnHover && (
                  <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
                )}
                {(item.categories && item.categories.length > 0) && (
                  <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
                    {item.categories.slice(0, 3).map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="backdrop-blur-sm/10 bg-secondary/80 text-xs font-medium px-2 py-0.5"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
        <CardTitle className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-secondary/80 backdrop-blur-sm/10">
          {item.title || (item.categories && item.categories[0])}
        </CardTitle>
              </Card>

            </div>
          );
        })()
      ))}
    </div>
  );
};

export default Masonry;
