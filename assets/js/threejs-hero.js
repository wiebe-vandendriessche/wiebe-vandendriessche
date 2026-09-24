import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { readScriptConfig } from "./lib/script-config.js";
import { readTriplet, applyTriplet } from "./lib/css-color.js";
import { onThemeChange } from "./lib/theme.js";
import { onEffectsChange } from "./lib/effects.js";
import { createRenderLoop } from "./lib/render-loop.js";

const dataset = readScriptConfig("data-threejs-hero");
const containerId = dataset.containerId || "threejs-canvas";
const rootId = dataset.rootId || "threejs-hero";
const modelUrl = dataset.modelUrl || "/models/avatar2export.glb";

const container = document.getElementById(containerId);
const root = document.getElementById(rootId);

if (!container || !root) {
  throw new Error("threejs-hero.js: required DOM nodes are missing");
}

let loop = null; // assigned at the bottom, once the frame function exists
let dragging = false;
let pointerDown = false;
let pointerX = 0;
let pointerY = 0;
let activePointerId = null;
let modelHovered = false;
let interactionEnabled = true; // set synchronously by onEffectsChange below

const config = {
  scale: 1.5,
  hoverScale: 1.06,
  idleSpinSpeed: 0.7,
  idleYawRange: Math.PI / 5,
  hoverAlignSpeed: 0.3,
  alignSnap: 0.012,
  hoverTilt: 0.22,
  hoverTiltY: 0.08,
  hoverYawRange: Math.PI / 6,
  facingOffset: Math.PI,
  colliderMargin: 1.28,
  dampTilt: 0.18,
  dampScale: 0.12,
  dragReach: 1.75,
};

const etherLightConfig = {
  keyBoost: 2.0,
  rimBoost: 2.35,
  shimmerDepth: 0.32,
};

const scene = new Scene();
const camera = new PerspectiveCamera(45, root.clientWidth / root.clientHeight, 0.1, 1000);
const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(root.clientWidth, root.clientHeight);
renderer.domElement.classList.add("threejs-hero-canvas");
renderer.domElement.classList.toggle("threejs-hero-canvas--disabled", !interactionEnabled);
container.appendChild(renderer.domElement);

const ambientLight = new AmbientLight(0xffffff, 0.22);
scene.add(ambientLight);

const hemisphereLight = new HemisphereLight(0xffffff, 0x1b2336, 0.3);
scene.add(hemisphereLight);

const etherKeyLight = new DirectionalLight(0xffffff, 1.1);
etherKeyLight.position.set(1.8, 2.0, -2.4);
scene.add(etherKeyLight);

const etherRimLight = new DirectionalLight(0xffffff, 0.8);
etherRimLight.position.set(-2.3, 1.1, 1.7);
scene.add(etherRimLight);

const mainWhitePointLight = new PointLight(0xffffff, 0.95, 20, 2.0);
mainWhitePointLight.position.set(0.25, 1.85, -2.4);
scene.add(mainWhitePointLight);

const raycaster = new Raycaster();
const pointer = new Vector2(2, 2);

let modelGroup = null;
let colliderMesh = null;
let tiltYaw = 0;
const baseScale = config.scale;
let aligning = false;
let targetYaw = 0;
let lastAlignedYaw = 0;
const keyLightTargetPos = new Vector3(1.8, 2.0, -2.4);

// Only these two are read by the frame loop (the shimmer multiplies them). The
// other intensities are applied directly in syncAmbient and never read back.
const baseLightIntensity = { key: 1.1, rim: 0.8 };

// Scratch colours reused across theme syncs so a recolour allocates nothing.
const scratch = { a: new Color(), b: new Color(), c: new Color(), d: new Color(), e: new Color() };
const readColor = (style, target, name, fallback) =>
  applyTriplet(target, readTriplet(style, name, fallback));

const normalizeAngle = (a) => {
  let angle = (a + Math.PI) % (Math.PI * 2);
  if (angle < 0) angle += Math.PI * 2;
  return angle - Math.PI;
};

const mix = (target, from, to, t) => target.copy(from).lerp(to, t);

const syncAmbient = (isDark) => {
  // One getComputedStyle for all five variables; this used to be five separate
  // resolutions, on every unrelated class mutation of <html>.
  const style = getComputedStyle(document.documentElement);
  const etherHigh = readColor(style, scratch.a, "--color-primary-300", isDark ? [147, 197, 253] : [255, 190, 80]);
  const etherMid = readColor(style, scratch.b, "--color-primary-400", isDark ? [96, 165, 250] : [255, 150, 30]);
  const etherDeep = readColor(style, scratch.c, "--color-primary-500", isDark ? [59, 130, 246] : [255, 110, 20]);
  const keyColor = mix(new Color(), etherHigh, etherMid, isDark ? 0.1 : 0.24);
  const rimColor = mix(new Color(), etherHigh, etherMid, isDark ? 0.06 : 0.14);
  const neutralHigh = readColor(style, scratch.d, isDark ? "--color-neutral-100" : "--color-neutral-200", isDark ? [245, 245, 245] : [250, 240, 230]);
  const neutralLow = readColor(style, scratch.e, isDark ? "--color-neutral-900" : "--color-neutral-700", isDark ? [23, 23, 23] : [64, 64, 64]);

  const ambientNeutralMix = isDark ? 0.24 : 0.28;
  const hemiNeutralMix = isDark ? 0.28 : 0.32;
  const keyNeutralMix = isDark ? 0.16 : 0.2;
  const rimNeutralMix = isDark ? 0.22 : 0.26;

  mix(ambientLight.color, keyColor, neutralHigh, ambientNeutralMix);
  mix(hemisphereLight.color, keyColor, neutralHigh, hemiNeutralMix);
  mix(hemisphereLight.groundColor, etherDeep, neutralLow, 0.72);
  mix(etherKeyLight.color, keyColor, neutralHigh, keyNeutralMix);
  mix(etherRimLight.color, rimColor, neutralHigh, rimNeutralMix);
  mainWhitePointLight.color.copy(neutralHigh);

  // key/rim are stored because the frame loop multiplies them by the shimmer.
  baseLightIntensity.key = (isDark ? 1.0 : 0.95) * etherLightConfig.keyBoost;
  baseLightIntensity.rim = (isDark ? 0.82 : 0.7) * etherLightConfig.rimBoost;

  ambientLight.intensity = isDark ? 0.14 : 0.6;
  hemisphereLight.intensity = isDark ? 0.2 : 0.18;
  etherKeyLight.intensity = baseLightIntensity.key;
  etherRimLight.intensity = baseLightIntensity.rim;
  mainWhitePointLight.intensity = isDark ? 0.34 : 0.4;
  renderer.toneMappingExposure = isDark ? 1.0 : 1.03;
};

// Inside the canvas this is the identity, so hover feel is unchanged. Outside it keeps
// responding with diminishing returns instead of running away or pinning to the edge.
const softLimit = (value) => {
  const magnitude = Math.abs(value);
  if (magnitude <= 1) return value;
  const reach = config.dragReach;
  return Math.sign(value) * (1 + (reach - 1) * (1 - Math.exp(-(magnitude - 1))));
};

const updatePointerFromEvent = (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerX = softLimit(pointer.x);
  pointerY = softLimit(pointer.y);
};

const raycastModel = () => {
  if (!interactionEnabled || !modelGroup || !colliderMesh) return false;
  // Parked off-canvas is exactly (2,2); nothing can be hit from there.
  if (pointer.x > 1 || pointer.x < -1 || pointer.y > 1 || pointer.y < -1) return false;
  raycaster.setFromCamera(pointer, camera);
  // colliderMesh is a childless Box3 proxy, so a recursive walk is wasted.
  return raycaster.intersectObject(colliderMesh, false).length > 0;
};

let facingYaw = 0;
const updateFacingYaw = () => {
  if (!modelGroup) return;
  const worldPos = new Vector3();
  modelGroup.getWorldPosition(worldPos);
  facingYaw =
    Math.atan2(camera.position.x - worldPos.x, camera.position.z - worldPos.z) + config.facingOffset;
};
const getModelFacingYaw = () => facingYaw;

const alignModelToCamera = () => {
  if (!modelGroup) return;
  targetYaw = getModelFacingYaw();
  aligning = true;
};

let lastDragClass = false;
let lastHoverClass = false;
const setHovered = (nextHovered) => {
  const drag = interactionEnabled && dragging;
  const hover = interactionEnabled && !dragging && nextHovered;
  if (drag !== lastDragClass) {
    lastDragClass = drag;
    document.body.classList.toggle("threejs-hero-dragging", drag);
  }
  if (hover !== lastHoverClass) {
    lastHoverClass = hover;
    document.body.classList.toggle("threejs-hero-hovering", hover);
  }
};

const releaseActivePointer = () => {
  if (activePointerId === null) return;
  const id = activePointerId;
  activePointerId = null;
  if (renderer.domElement.hasPointerCapture?.(id)) {
    renderer.domElement.releasePointerCapture(id);
  }
};

const resetInteractionState = () => {
  releaseActivePointer();
  if (loop && dragging) loop.fps = 45;
  pointerDown = false;
  dragging = false;
  aligning = false;
  modelHovered = false;
  setHovered(false);
};

onEffectsChange((enabled) => {
  interactionEnabled = enabled;
  if (!enabled) {
    pointer.set(2, 2);
    pointerX = 0;
    pointerY = 0;
    resetInteractionState();
  }
  renderer.domElement.classList.toggle("threejs-hero-canvas--disabled", !enabled);
});

let loaderOverlay = null;

const setLoaderVisible = (visible, failed = false) => {
  if (visible) {
    if (!loaderOverlay) {
      loaderOverlay = document.createElement("div");
      loaderOverlay.className = "threejs-hero-loader";

      const spinner = document.createElement("div");
      spinner.className = "threejs-hero-loader-spinner";
      loaderOverlay.appendChild(spinner);

      root.appendChild(loaderOverlay);
    }
    loaderOverlay.classList.remove("threejs-hero-loader--hidden");
    return;
  }

  if (!loaderOverlay) return;
  if (failed) {
    loaderOverlay.remove();
    loaderOverlay = null;
    return;
  }

  loaderOverlay.classList.add("threejs-hero-loader--hidden");
  window.setTimeout(() => {
    if (!loaderOverlay) return;
    loaderOverlay.remove();
    loaderOverlay = null;
  }, 220);
};

setLoaderVisible(true);

const loader = new GLTFLoader();
loader.load(
  modelUrl,
  (gltf) => {
    modelGroup = new Group();
    const model = gltf.scene;
    modelGroup.add(model);
    modelGroup.scale.set(baseScale, baseScale, baseScale);
    scene.add(modelGroup);

    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    size.multiplyScalar(config.colliderMargin);

    const colliderGeom = new BoxGeometry(size.x, size.y, size.z);
    const colliderMat = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    colliderMesh = new Mesh(colliderGeom, colliderMat);
    colliderMesh.position.copy(center);
    modelGroup.add(colliderMesh);
    updateFacingYaw();
    setLoaderVisible(false);
  },
  undefined,
  (error) => {
    console.error("threejs-hero.js: failed to load model", error);
    setLoaderVisible(false, true);
  }
);

renderer.domElement.addEventListener("pointermove", (event) => {
  if (!interactionEnabled) return;
  if (activePointerId !== null && event.pointerId !== activePointerId) return;
  updatePointerFromEvent(event);

  if (dragging) {
    // Pointer is captured, so it may be well outside the canvas; keep steering the model.
    setHovered(true);
    return;
  }

});

renderer.domElement.addEventListener("pointerleave", (event) => {
  // While dragging the pointer is captured and is allowed to roam the whole page.
  if (dragging || (activePointerId !== null && event.pointerId === activePointerId)) return;
  pointer.set(2, 2);
  pointerX = 0;
  pointerY = 0;
  resetInteractionState();
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (!interactionEnabled) return;
  updatePointerFromEvent(event);
  pointerDown = true;
  modelHovered = raycastModel();
  dragging = modelHovered;
  setHovered(modelHovered);
  if (dragging) {
    // Capture routes every later move/up to the canvas, even outside its bounds.
    activePointerId = event.pointerId;
    try {
      renderer.domElement.setPointerCapture(event.pointerId);
    } catch (error) {
      activePointerId = null;
    }
    event.preventDefault();
    if (loop) loop.fps = 0;
    alignModelToCamera();
  }
});

window.addEventListener("pointerup", () => {
  resetInteractionState();
});

window.addEventListener("pointercancel", () => {
  resetInteractionState();
});

window.addEventListener("blur", () => {
  resetInteractionState();
});

// Shimmer baselines: invariant, so they are not recomputed per frame.
const SHIMMER_KEY_BASE = 1.0 - etherLightConfig.shimmerDepth * 0.5;
const SHIMMER_RIM_BASE = 1.0 - etherLightConfig.shimmerDepth * 0.55;

const frame = () => {
  // Ether-like shimmer in the colored spill lights.
  const shimmerTime = performance.now() * 0.001;
  const shimmerKey = SHIMMER_KEY_BASE + etherLightConfig.shimmerDepth * Math.sin(shimmerTime * 1.25);
  const shimmerRim = SHIMMER_RIM_BASE + etherLightConfig.shimmerDepth * Math.sin(shimmerTime * 1.65 + 0.65);

  // Slight orbit motion makes the model feel lit by moving ether currents.
  keyLightTargetPos.set(
    2.0 + pointerX * 1.2,
    1.9 - pointerY * 0.4,
    -2.4
  );
  etherKeyLight.position.lerp(keyLightTargetPos, 0.12);
  etherRimLight.position.set(
    -2.35 + Math.sin(shimmerTime * 0.66 + 2.2) * 0.25,
    1.1 + Math.cos(shimmerTime * 1.32 + 0.4) * 0.2,
    1.85 + Math.cos(shimmerTime * 0.9 + 2.8) * 0.85
  );

  etherKeyLight.intensity = baseLightIntensity.key * shimmerKey;
  etherRimLight.intensity = baseLightIntensity.rim * shimmerRim;

  if (modelGroup) {
    modelHovered = interactionEnabled && !dragging && raycastModel();

    if (!dragging) {
      setHovered(modelHovered);
      if (!modelHovered) {
        aligning = false;
      }
    }

    let baseYaw = modelGroup.rotation.y;

    if (dragging) {
      if (aligning) {
        const delta = normalizeAngle(targetYaw - baseYaw);
        const step = delta * config.hoverAlignSpeed;
        if (Math.abs(delta) < config.alignSnap) {
          baseYaw = targetYaw;
          aligning = false;
          lastAlignedYaw = baseYaw;
        } else {
          baseYaw += step;
        }
      } else {
        const focusYaw = (lastAlignedYaw || baseYaw) + pointerX * config.hoverYawRange;
        baseYaw += (focusYaw - baseYaw) * 0.18;
      }
    } else {
      const idleCenterYaw = getModelFacingYaw();
      const idleTargetYaw = idleCenterYaw + Math.sin(shimmerTime * config.idleSpinSpeed) * config.idleYawRange;
      baseYaw += (idleTargetYaw - baseYaw) * 0.08;
    }

    const canTilt = interactionEnabled && dragging && !aligning;
    const targetTiltX = canTilt ? pointerY * config.hoverTilt : 0;
    const targetTiltZ = canTilt ? -pointerX * config.hoverTilt : 0;
    const targetTiltYaw = canTilt ? pointerX * config.hoverTiltY : 0;
    tiltYaw += (targetTiltYaw - tiltYaw) * config.dampTilt;
    modelGroup.rotation.x += (targetTiltX - modelGroup.rotation.x) * config.dampTilt;
    modelGroup.rotation.z += (targetTiltZ - modelGroup.rotation.z) * config.dampTilt;
    modelGroup.rotation.y = baseYaw + tiltYaw;

    const targetScale = dragging ? baseScale * config.hoverScale : baseScale;
    const currentScale = modelGroup.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * config.dampScale;
    modelGroup.scale.set(newScale, newScale, newScale);
  }

  renderer.render(scene, camera);
};

camera.position.set(-2, -0.3, -6);
// The camera never moves again, so its orientation is resolved once rather than
// recomputed on every frame.
camera.lookAt(0, camera.position.y, 0);
updateFacingYaw();

window.addEventListener("resize", () => {
  const w = root.clientWidth;
  const h = root.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// Capped to 45fps to match liquid-ether and paused while the tab is hidden. The cap
// is lifted during a drag so grabbing the model stays as responsive as before.
//
// No viewport gate: the homepage is the only page with the hero and it does not
// scroll (the document is ~892px against an 800px viewport), so the hero is never
// off screen and an IntersectionObserver would be pure overhead.
loop = createRenderLoop({ render: frame, fps: 45 });
loop.addVisibilityGate();

onThemeChange((dark) => {
  syncAmbient(dark);
  // Repaint once so a theme switch is not held until the hero scrolls back in.
  if (!loop.running) loop.renderOnce();
});
