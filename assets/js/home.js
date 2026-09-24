// Homepage: the ether plus the avatar, drawn into the same canvas so the model can
// read the fluid behind it.
import { startEther } from "./ether/stage.js";
import { mountAvatar } from "./avatar.js";

const config = document.querySelector("script[data-liquid-ether]").dataset;
const ether = startEther({
  canvas: document.getElementById(config.canvasId),
  // Fixed at 2: on DPR-1 screens the browser's 2x downscale supersamples the
  // avatar's edges (full-canvas MSAA would cost far more memory); DPR-2 screens
  // get the same buffer they would anyway.
  pixelRatio: 2,
});
mountAvatar(ether, document.getElementById("threejs-hero"), config.modelUrl);
