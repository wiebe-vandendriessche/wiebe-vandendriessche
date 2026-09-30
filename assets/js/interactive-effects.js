import { STORAGE_KEY, CHANGE_EVENT } from "./lib/effects.js";

const root = document.documentElement;

const readPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
};

const isEnabled = () => root.dataset.interactiveEffects !== "off";

const updateControls = (enabled) => {
  document.querySelectorAll("[data-interactive-effects-toggle]").forEach((button) => {
    const label = enabled
      ? button.dataset.labelDisable || "Disable interactive effects"
      : button.dataset.labelEnable || "Enable interactive effects";
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  });
};

const setEnabled = (enabled, persist) => {
  root.dataset.interactiveEffects = enabled ? "on" : "off";
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
    }
  }
  updateControls(enabled);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { enabled } }));
};

setEnabled(readPreference(), false);

// Homepage hint pointing visitors at the wand. Shown once, until dismissed in any way.
const HINT_KEY = "interactive-effects-hint";
const HINT_DELAY_MS = 1500;

const hintDismissed = () => {
  try {
    return localStorage.getItem(HINT_KEY) === "dismissed";
  } catch {
    return false;
  }
};

let dismissHint = () => {};

const initHint = () => {
  const hint = document.querySelector("[data-effects-hint]");
  if (!hint || isEnabled() || hintDismissed()) return;

  let timer;

  // On wide screens, hang the card under whichever wand is actually visible (the
  // desktop header one) with its arrow on the icon. Narrow screens keep the CSS
  // bottom-sheet placement: there the wand is tucked inside the mobile menu.
  const place = () => {
    const wand = [...document.querySelectorAll("[data-interactive-effects-toggle]")].find(
      (el) => el.getClientRects().length > 0
    );
    const anchored = Boolean(wand) && window.innerWidth >= 768;
    hint.classList.toggle("is-anchored", anchored);
    if (!anchored) {
      hint.style.removeProperty("left");
      hint.style.removeProperty("top");
      return;
    }
    const rect = wand.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const width = hint.offsetWidth;
    const left = Math.min(Math.max(16, center - width + 32), window.innerWidth - width - 16);
    hint.style.left = `${left}px`;
    hint.style.top = `${rect.bottom + 14}px`;
    hint.style.setProperty("--effects-hint-arrow-x", `${center - left}px`);
  };

  const onKey = (event) => {
    if (event.key === "Escape") dismissHint();
  };

  dismissHint = () => {
    dismissHint = () => {};
    clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", place);
    try {
      localStorage.setItem(HINT_KEY, "dismissed");
    } catch {
    }
    delete root.dataset.effectsHintActive;
    hint.classList.remove("is-visible");
    // After the fade-out (a timer, not transitionend: reduced motion has no transition).
    setTimeout(() => (hint.hidden = true), 300);
  };

  hint.querySelector("[data-effects-hint-dismiss]").addEventListener("click", () => dismissHint());

  timer = setTimeout(() => {
    hint.hidden = false;
    place();
    root.dataset.effectsHintActive = "";
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    // Next frame, so the hidden -> visible change is painted before the transition.
    requestAnimationFrame(() => requestAnimationFrame(() => hint.classList.add("is-visible")));
  }, HINT_DELAY_MS);
};

const init = () => {
  updateControls(isEnabled());
  document.querySelectorAll("[data-interactive-effects-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      dismissHint();
      setEnabled(!isEnabled(), true);
    });
  });
  initHint();
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
