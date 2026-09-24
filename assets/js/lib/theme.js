import { observeClass } from "./class-state.js";

const root = document.documentElement;

export const isDark = () => root.classList.contains("dark");

/** Subscribe to dark-mode changes. Fires immediately with the current state. */
export const onThemeChange = (callback) => observeClass(root, "dark", callback);
