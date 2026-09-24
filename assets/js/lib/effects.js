// Single source of truth for the interactive-effects contract. The event name and
// storage key used to be hardcoded separately in three files.
export const STORAGE_KEY = "interactive-effects";
export const CHANGE_EVENT = "interactive-effects-change";

const root = document.documentElement;

export const effectsEnabled = () => root.dataset.interactiveEffects !== "off";

/**
 * Subscribe to the toggle. Fires immediately with the current state, then on change.
 *
 * The immediate call is load-bearing: interactive-effects.js is a blocking head
 * script that dispatches CHANGE_EVENT during its own evaluation, before any module
 * script has run, so a subscribe-only API would miss the initial state entirely.
 */
export function onEffectsChange(callback, { signal } = {}) {
  callback(effectsEnabled());
  const handler = (event) => callback(event.detail?.enabled !== false);
  window.addEventListener(CHANGE_EVENT, handler, { signal });
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
