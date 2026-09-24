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
  const label = enabled ? "Disable interactive effects" : "Enable interactive effects";
  document.querySelectorAll("[data-interactive-effects-toggle]").forEach((button) => {
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

const init = () => {
  updateControls(isEnabled());
  document.querySelectorAll("[data-interactive-effects-toggle]").forEach((button) => {
    button.addEventListener("click", () => setEnabled(!isEnabled(), true));
  });
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
