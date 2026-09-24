// A requestAnimationFrame loop with an FPS cap and a set of named gates.
//
// The loop runs iff EVERY gate is open. This is why it exists rather than exposing
// start()/pause(): liquid-ether has two independent reasons to stop (tab hidden and
// zen mode), and with imperative start/pause the last caller wins. Tabbing back into a zen-mode article would call
// start() and un-freeze a background the reader deliberately froze. Gates cannot
// express that bug.
//
// FPS capping keeps the existing skip-a-vsync semantics on purpose. `dt` in the fluid
// sim is a fixed constant per RENDERED frame, so cadence is apparent flow speed: a
// drift-compensated accumulator would deliver a true 45fps average but alternate
// 16.7/33.3ms frames and visibly change the speed of the effect. Skipping keeps an
// even cadence (30fps on a 60Hz display, 40 on 120Hz). The one-millisecond epsilon
// only resolves a floating-point tie on 90Hz displays, where 2 x 11.11ms lands
// exactly on the 22.22ms interval and the cadence would otherwise flicker.
const FRAME_EPSILON_MS = 1;

export function createRenderLoop({ render, fps = 0 }) {
  const gates = new Map();
  const controller = new AbortController();
  let raf = 0;
  let last = 0;
  let intervalMs = fps > 0 ? 1000 / fps : 0;

  const open = () => {
    for (const v of gates.values()) if (!v) return false;
    return true;
  };

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (intervalMs > 0 && last > 0 && now - last < intervalMs - FRAME_EPSILON_MS) return;
    last = now;
    render();
  };

  const sync = () => {
    if (open()) {
      // Schedule before rendering so a thrown error cannot permanently kill the loop.
      if (!raf) raf = requestAnimationFrame(tick);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  };

  const loop = {
    gate(name, isOpen) {
      if (gates.get(name) === isOpen) return;
      gates.set(name, isOpen);
      sync();
    },

    get running() {
      return raf !== 0;
    },

    set fps(next) {
      intervalMs = next > 0 ? 1000 / next : 0;
    },

    /** Draw exactly one frame regardless of gates (e.g. recolour while frozen). */
    renderOnce() {
      render();
    },

    addVisibilityGate() {
      const update = () => loop.gate("visibility", !document.hidden);
      document.addEventListener("visibilitychange", update, { signal: controller.signal });
      update();
    },

    dispose() {
      controller.abort();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      gates.clear();
    },
  };

  return loop;
}
