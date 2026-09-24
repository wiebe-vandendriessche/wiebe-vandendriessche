// Overrides themes/blowfish/assets/js/zen-mode.js (Hugo resolves project assets
// before theme assets, and the theme is a git submodule so it is not edited).
// Zen mode here changes nothing on the page itself: no hidden table of contents and
// no wider text. It only sets body.zen-mode-enable, which freezes the liquid ether
// (see assets/js/ether/stage.js); custom.css undoes the theme's author-box hiding.
function _toggleZenMode(zendModeButton, options = { scrollToHeader: true }) {
  // Nodes selection
  const body = document.querySelector("body");
  const header = document.querySelector("#single_header");

  // Add semantic class into body tag
  body.classList.toggle("zen-mode-enable");

  // Read i18n title from data-attributes
  const titleI18nDisable = zendModeButton.getAttribute("data-title-i18n-disable");
  const titleI18nEnable = zendModeButton.getAttribute("data-title-i18n-enable");

  if (body.classList.contains("zen-mode-enable")) {
    // Persist configuration
    //localStorage.setItem('blowfish-zen-mode-enabled', 'true');

    // Change title to enable
    zendModeButton.setAttribute("title", titleI18nEnable);
    // Auto-scroll to title article
    if (options.scrollToHeader) {
      window.scrollTo(window.scrollX, header.getBoundingClientRect().top - 90);
    }
  } else {
    //localStorage.setItem('blowfish-zen-mode-enabled', 'false');
    zendModeButton.setAttribute("title", titleI18nDisable);
    if (options.scrollToHeader) {
      document.querySelector("body").scrollIntoView();
    }
  }
}

function _registerZendModeButtonClick(zendModeButton) {
  zendModeButton.addEventListener("click", function (event) {
    event.preventDefault();

    // Toggle zen-mode
    _toggleZenMode(zendModeButton);
  });
}

(function init() {
  window.addEventListener("DOMContentLoaded", (event) => {
    // Register click on 'zen-mode-button' node element
    const zendModeButton = document.getElementById("zen-mode-button");
    if (zendModeButton !== null && zendModeButton !== undefined) {
      _registerZendModeButtonClick(zendModeButton);
    }
  });
})();
