// Watch a class on an element and report only real transitions.
//
// Both the dark-mode observer and the zen-mode observer need exactly this. The two
// observers this replaces were unfiltered, so every unrelated class mutation on
// <html> (Blowfish's appearance.js, a11y.js and layout-switcher.js all touch it)
// triggered a full colour resync and a GPU texture rebuild for nothing.
export function observeClass(target, className, callback) {
  let last = target.classList.contains(className);
  callback(last);
  const observer = new MutationObserver(() => {
    const now = target.classList.contains(className);
    if (now === last) return;
    last = now;
    callback(now);
  });
  observer.observe(target, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
