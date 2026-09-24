// Article and list pages: the ether background only.
import { startEther } from "./ether/stage.js";

const config = document.querySelector("script[data-liquid-ether]").dataset;
startEther({
  canvas: document.getElementById(config.canvasId),
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
});
