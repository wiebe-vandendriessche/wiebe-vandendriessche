import { Vector2, WebGLRenderer } from "three";
import { effectsEnabled, onEffectsChange } from "../lib/effects.js";
import { createFluid } from "./fluid.js";
import { readPalette } from "./palette.js";
import { createPointer } from "./pointer.js";

// Frame pacing. reactbits steps with a fixed dt of 0.014 every frame, which is its
// intended speed at 60Hz but twice that at 120Hz. Here the sim steps at most once
// per 9.5ms with dt proportional to the real time elapsed: 60Hz and 120Hz both get
// exactly 0.014 at 60 steps/s, 90/144Hz get even steps with a smaller dt, and the
// flow speed is the same on every display.
const MIN_STEP_S = 0.0095;
const DT_PER_SECOND = 0.014 * 60;
const MOBILE_PX = 768;

// Report real transitions of a class only. Blowfish touches <html>'s class list for
// unrelated reasons, and each unfiltered call would be a full recolour.
function watchClass(el, name, callback) {
  let on = el.classList.contains(name);
  callback(on);
  new MutationObserver(() => {
    if (el.classList.contains(name) !== on) callback((on = !on));
  }).observe(el, { attributes: true, attributeFilter: ["class"] });
}

export function startEther({ canvas, pixelRatio }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.autoClear = false;
  renderer.setPixelRatio(pixelRatio);

  const size = { width: 0, height: 0 };
  // Uniforms shared by the fluid composite and anything drawn on top that wants to
  // read the fluid (the avatar).
  const shared = {
    uFluid: { value: null },
    uPalette: { value: null },
    uLight: { value: 0 },
    uDrawSize: { value: new Vector2() },
  };
  const pointer = createPointer(size);
  const fluid = createFluid(renderer, pointer, shared);
  const ether = { renderer, pointer, shared, size, palette: null, layer: null, onTheme: null };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // On phones the URL bar changes only the height as you scroll; resizing the
    // render targets would wipe the fluid each time, so only a width change counts.
    if (!size.width || w !== size.width || Math.min(w, h) >= MOBILE_PX) fluid.resize(w, h);
    size.width = w;
    size.height = h;
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(shared.uDrawSize.value);
  };

  const draw = (elapsed) => {
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, size.width, size.height);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    fluid.composite();
    ether.layer?.(elapsed);
  };

  let raf = 0;
  let last = 0;
  let acc = 0;
  let zen = false;

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;
    acc += elapsed;
    const stepped = acc >= MIN_STEP_S;
    if (stepped) {
      pointer.update(acc);
      fluid.step(DT_PER_SECOND * Math.min(acc, 1 / 30));
      acc = 0;
    }
    // With a layer (the avatar) draw every frame so it stays smooth at high refresh
    // rates; otherwise nothing changed and the canvas keeps its last frame.
    if (stepped || ether.layer) draw(elapsed);
  };

  const sync = () => {
    const run = !document.hidden && !zen;
    if (run && !raf) {
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(tick);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  resize();
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", sync);

  watchClass(document.documentElement, "dark", (dark) => {
    const palette = readPalette(dark);
    shared.uPalette.value = palette.texture;
    shared.uLight.value = palette.light;
    fluid.setTheme(palette);
    ether.palette = palette;
    ether.onTheme?.(dark, palette);
    // Repaint once even while frozen, so a theme switch is never held back.
    if (!raf) draw(0);
  });

  onEffectsChange((enabled) => pointer.setInteractive(enabled && !zen));

  // Blowfish's zen mode only toggles body.zen-mode-enable (the theme is a submodule,
  // so there is no event to listen for). The button exists only on article pages.
  if (document.getElementById("zen-mode-button")) {
    watchClass(document.body, "zen-mode-enable", (on) => {
      zen = on;
      // No input while frozen, or the backlog would all land at once on exit.
      pointer.setInteractive(!on && effectsEnabled());
      sync();
    });
  }

  sync();
  return ether;
}
