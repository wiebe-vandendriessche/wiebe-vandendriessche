import { Vector2 } from "three";

// The ether's cursor: the user's pointer when it moves, an autopilot that wanders to
// random targets after a second of idleness, and a short eased takeover when the
// user grabs control back from the autopilot. Constants are reactbits' defaults.
const AUTO_SPEED = 0.5; // normalised units / s
const AUTO_INTENSITY = 2.2;
const AUTO_RESUME_MS = 1000;
const AUTO_RAMP_MS = 600;
const TAKEOVER_MS = 250;
const MARGIN = 0.2;

const smooth = (t) => t * t * (3 - 2 * t);

// `size` is the canvas' CSS size, kept current by the stage. Not innerWidth: that
// includes the scrollbar, which the fixed canvas does not cover.
export function createPointer(size) {
  const coords = new Vector2();
  const old = new Vector2();
  const diff = new Vector2();
  const auto = new Vector2();
  const target = new Vector2();
  const from = new Vector2();
  const to = new Vector2();
  const tmp = new Vector2();

  let interactive = true;
  let hasUserControl = false;
  let autoActive = false;
  let autoStart = 0;
  let takeoverStart = -1;
  let lastInteraction = performance.now();

  const pickTarget = () =>
    target.set((Math.random() * 2 - 1) * (1 - MARGIN), (Math.random() * 2 - 1) * (1 - MARGIN));
  pickTarget();

  const toNdc = (out, x, y) => out.set((x / size.width) * 2 - 1, -((y / size.height) * 2 - 1));

  const interact = () => {
    lastInteraction = performance.now();
    autoActive = false;
  };

  // pointermove rather than mousemove: the avatar's pointerdown calls
  // preventDefault(), which can suppress compatibility mouse events for the rest of
  // a drag, and the ether must keep following the cursor while the model is held.
  addEventListener(
    "pointermove",
    (e) => {
      if (!interactive || e.pointerType === "touch") return;
      if (autoActive && !hasUserControl && takeoverStart < 0) {
        from.copy(coords);
        toNdc(to, e.clientX, e.clientY);
        takeoverStart = performance.now();
      } else {
        toNdc(coords, e.clientX, e.clientY);
      }
      hasUserControl = true;
      interact();
    },
    { passive: true }
  );

  // Touch keeps touch events: pointer events are cancelled once the page scrolls,
  // and the ether follows a finger while scrolling today. Single touch only.
  const onTouch = (e) => {
    if (!interactive || e.touches.length !== 1) return;
    toNdc(coords, e.touches[0].clientX, e.touches[0].clientY);
    hasUserControl = true;
    interact();
  };
  addEventListener("touchstart", onTouch, { passive: true });
  addEventListener("touchmove", onTouch, { passive: true });

  const driveAuto = (now, dt) => {
    if (now - lastInteraction < AUTO_RESUME_MS) return;
    if (!autoActive) {
      autoActive = true;
      auto.copy(coords);
      autoStart = now;
    }
    const dir = tmp.subVectors(target, auto);
    const dist = dir.length();
    if (dist < 0.01) return void pickTarget();
    const ramp = smooth(Math.min(1, (now - autoStart) / AUTO_RAMP_MS));
    auto.addScaledVector(dir.normalize(), Math.min(AUTO_SPEED * dt * ramp, dist));
    coords.copy(auto);
  };

  return {
    coords,
    diff,
    // Smoothed cursor energy, for the avatar's key light.
    energy: 0,

    /** Effects OFF disables pointer input only; the autopilot resumes at once so the
     *  background keeps flowing (OFF is the first-visit default). */
    setInteractive(enabled) {
      interactive = enabled;
      if (!enabled) {
        hasUserControl = false;
        takeoverStart = -1;
        old.copy(coords);
        lastInteraction = -Infinity;
      }
    },

    /** Advance by one simulation step covering `dt` seconds of real time. */
    update(dt) {
      const now = performance.now();
      driveAuto(now, Math.min(dt, 0.2));
      if (takeoverStart >= 0) {
        const t = (now - takeoverStart) / TAKEOVER_MS;
        if (t >= 1) {
          takeoverStart = -1;
          coords.copy(to);
          old.copy(coords);
        } else {
          coords.copy(from).lerp(to, smooth(t));
        }
      }
      diff.subVectors(coords, old);
      old.copy(coords);
      if (old.x === 0 && old.y === 0) diff.set(0, 0);
      if (autoActive && takeoverStart < 0) diff.multiplyScalar(AUTO_INTENSITY);
      this.energy += (Math.min(diff.length() * 20, 1) - this.energy) * 0.15;
    },
  };
}
