// Switch the header to the burger menu as soon as the site title would be
// truncated. The theme only switches below the md breakpoint (768px), but the
// menu width differs per language, so measure instead of guessing a breakpoint.
const row = document.querySelector("[data-nav-row]");
const title = row?.querySelector("[data-nav-title]");
const desktop = window.matchMedia("(min-width: 768px)");

if (row && title) {
  const update = () => {
    // Measure the desktop layout; the forced layout happens before any paint.
    row.removeAttribute("data-nav-collapsed");
    if (desktop.matches && title.scrollWidth > title.clientWidth) {
      row.setAttribute("data-nav-collapsed", "");
    }
  };

  new ResizeObserver(update).observe(row);
  document.fonts?.ready.then(update);
  update();
}
