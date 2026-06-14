import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";

const currentScript =
  document.currentScript ||
  document.querySelector("script[type='module'][data-threejs-hero]");
if (!currentScript) {
  throw new Error("threejs-hero.js: script tag not found");
}

const containerId = currentScript.dataset.containerId || "threejs-canvas";
const rootId = currentScript.dataset.rootId || "threejs-hero";
const modelUrl = currentScript.dataset.modelUrl || "/models/avatar2export.glb";

const container = document.getElementById(containerId);
const root = document.getElementById(rootId);

if (!container || !root) {
  throw new Error("threejs-hero.js: required DOM nodes are missing");
}

let dragging = false;
let pointerDown = false;
let pointerX = 0;
let pointerY = 0;
let modelHovered = false;

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
};

const etherLightConfig = {
  keyBoost: 2.0,
  rimBoost: 2.35,
  shimmerDepth: 0.32,
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, root.clientWidth / root.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(root.clientWidth, root.clientHeight);
container.appendChild(renderer.domElement);
renderer.domElement.style.touchAction = "none";

const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x1b2336, 0.3);
hemisphereLight.position.set(0, 3, 0);
scene.add(hemisphereLight);

const etherKeyLight = new THREE.DirectionalLight(0xffffff, 1.1);
etherKeyLight.position.set(1.8, 2.0, -2.4);
scene.add(etherKeyLight);

const etherRimLight = new THREE.DirectionalLight(0xffffff, 0.8);
etherRimLight.position.set(-2.3, 1.1, 1.7);
scene.add(etherRimLight);

const mainWhitePointLight = new THREE.PointLight(0xffffff, 0.95, 20, 2.0);
mainWhitePointLight.position.set(0.25, 1.85, -2.4);
scene.add(mainWhitePointLight);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(2, 2);

let modelGroup = null;
let colliderMesh = null;
let tiltYaw = 0;
const baseScale = config.scale;
let aligning = false;
let targetYaw = 0;
let lastAlignedYaw = 0;
let keyLightTargetPos = new THREE.Vector3(1.8, 2.0, -2.4);

const baseLightIntensity = {
  ambient: 0.2,
  hemi: 0.3,
  key: 1.1,
  rim: 0.8,
  whitePoint: 0.95,
};

const getCssVarTriplet = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw
    .split(/[\s,]+/)
    .map((v) => Number.parseFloat(v.trim()))
    .filter((n) => Number.isFinite(n));
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return parts;
  }
  return fallback;
};

const colorFromCssVar = (name, fallback) => {
  const [r, g, b] = getCssVarTriplet(name, fallback);
  return new THREE.Color(r / 255, g / 255, b / 255);
};

const normalizeAngle = (a) => {
  let angle = (a + Math.PI) % (Math.PI * 2);
  if (angle < 0) angle += Math.PI * 2;
  return angle - Math.PI;
};

const colorLerp = (from, to, t) => {
  const out = from.clone();
  out.lerp(to, t);
  return out;
};

const syncAmbient = () => {
  const isDark = document.documentElement.classList.contains("dark");
  const etherHigh = colorFromCssVar("--color-primary-300", isDark ? [147, 197, 253] : [255, 190, 80]);
  const etherMid = colorFromCssVar("--color-primary-400", isDark ? [96, 165, 250] : [255, 150, 30]);
  const etherDeep = colorFromCssVar("--color-primary-500", isDark ? [59, 130, 246] : [255, 110, 20]);
  const keyColor = isDark ? colorLerp(etherHigh, etherMid, 0.1) : colorLerp(etherHigh, etherMid, 0.24);
  const rimColor = isDark ? colorLerp(etherHigh, etherMid, 0.06) : colorLerp(etherHigh, etherMid, 0.14);
  const neutralHigh = colorFromCssVar(isDark ? "--color-neutral-100" : "--color-neutral-200", isDark ? [245, 245, 245] : [250, 240, 230]);
  const neutralLow = colorFromCssVar(isDark ? "--color-neutral-900" : "--color-neutral-700", isDark ? [23, 23, 23] : [64, 64, 64]);

  const ambientNeutralMix = isDark ? 0.24 : 0.28;
  const hemiNeutralMix = isDark ? 0.28 : 0.32;
  const keyNeutralMix = isDark ? 0.16 : 0.2;
  const rimNeutralMix = isDark ? 0.22 : 0.26;

  ambientLight.color.copy(colorLerp(keyColor, neutralHigh, ambientNeutralMix));
  hemisphereLight.color.copy(colorLerp(keyColor, neutralHigh, hemiNeutralMix));
  hemisphereLight.groundColor.copy(colorLerp(etherDeep, neutralLow, 0.72));
  etherKeyLight.color.copy(colorLerp(keyColor, neutralHigh, keyNeutralMix));
  etherRimLight.color.copy(colorLerp(rimColor, neutralHigh, rimNeutralMix));
  mainWhitePointLight.color.copy(neutralHigh);

  baseLightIntensity.ambient = isDark ? 0.14 : 0.6;
  baseLightIntensity.hemi = isDark ? 0.2 : 0.18;
  baseLightIntensity.key = (isDark ? 1.0 : 0.95) * etherLightConfig.keyBoost;
  baseLightIntensity.rim = (isDark ? 0.82 : 0.7) * etherLightConfig.rimBoost;
  baseLightIntensity.whitePoint = isDark ? 0.34 : 0.4;

  ambientLight.intensity = baseLightIntensity.ambient;
  hemisphereLight.intensity = baseLightIntensity.hemi;
  etherKeyLight.intensity = baseLightIntensity.key;
  etherRimLight.intensity = baseLightIntensity.rim;
  mainWhitePointLight.intensity = baseLightIntensity.whitePoint;
  renderer.toneMappingExposure = isDark ? 1.0 : 1.03;
};

const updatePointerFromEvent = (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerX = pointer.x;
  pointerY = pointer.y;
};

const raycastModel = () => {
  if (!modelGroup || !colliderMesh) return false;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(colliderMesh, true).length > 0;
};

const getModelFacingYaw = () => {
  if (!modelGroup) return 0;
  const worldPos = new THREE.Vector3();
  modelGroup.getWorldPosition(worldPos);
  const dx = camera.position.x - worldPos.x;
  const dz = camera.position.z - worldPos.z;
  return Math.atan2(dx, dz) + config.facingOffset;
};

const alignModelToCamera = () => {
  if (!modelGroup) return;
  targetYaw = getModelFacingYaw();
  aligning = true;
};

const setHovered = (nextHovered) => {
  document.body.style.cursor = dragging ? "grabbing" : nextHovered ? "pointer" : "";
};

const resetInteractionState = () => {
  pointerDown = false;
  dragging = false;
  aligning = false;
  modelHovered = false;
  setHovered(false);
};

const ensureLoaderStyles = () => {
  if (document.getElementById("threejs-hero-loader-style")) return;
  const style = document.createElement("style");
  style.id = "threejs-hero-loader-style";
  style.textContent = `
    @keyframes threejsHeroSpin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

let loaderOverlay = null;

const setLoaderVisible = (visible, failed = false) => {
  if (visible) {
    if (!loaderOverlay) {
      ensureLoaderStyles();
      if (getComputedStyle(root).position === "static") {
        root.style.position = "relative";
      }

      loaderOverlay = document.createElement("div");
      loaderOverlay.style.position = "absolute";
      loaderOverlay.style.inset = "0";
      loaderOverlay.style.display = "grid";
      loaderOverlay.style.placeItems = "center";
      loaderOverlay.style.pointerEvents = "none";
      loaderOverlay.style.zIndex = "3";

      const spinner = document.createElement("div");
      spinner.style.width = "34px";
      spinner.style.height = "34px";
      spinner.style.borderRadius = "9999px";
      spinner.style.border = "3px solid rgba(148, 163, 184, 0.3)";
      spinner.style.borderTopColor = "rgba(59, 130, 246, 0.95)";
      spinner.style.animation = "threejsHeroSpin 0.8s linear infinite";
      loaderOverlay.appendChild(spinner);

      root.appendChild(loaderOverlay);
    }
    loaderOverlay.style.opacity = "1";
    loaderOverlay.style.visibility = "visible";
    return;
  }

  if (!loaderOverlay) return;
  if (failed) {
    loaderOverlay.remove();
    loaderOverlay = null;
    return;
  }

  loaderOverlay.style.opacity = "0";
  loaderOverlay.style.transition = "opacity 180ms ease";
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
    modelGroup = new THREE.Group();
    const model = gltf.scene;
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    modelGroup.add(model);
    modelGroup.scale.set(baseScale, baseScale, baseScale);
    scene.add(modelGroup);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    size.multiplyScalar(config.colliderMargin);

    const colliderGeom = new THREE.BoxGeometry(size.x, size.y, size.z);
    const colliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    colliderMesh = new THREE.Mesh(colliderGeom, colliderMat);
    colliderMesh.position.copy(center);
    modelGroup.add(colliderMesh);
    setLoaderVisible(false);
  },
  undefined,
  (error) => {
    console.error("threejs-hero.js: failed to load model", error);
    setLoaderVisible(false, true);
  }
);

renderer.domElement.addEventListener("pointermove", (event) => {
  updatePointerFromEvent(event);
  modelHovered = raycastModel();
  if (!pointerDown && !dragging) {
    setHovered(modelHovered);
  }
  if (pointerDown && !dragging && modelHovered) {
    dragging = true;
    setHovered(true);
    alignModelToCamera();
  }
  if (dragging) {
    setHovered(true);
  }
});

renderer.domElement.addEventListener("pointerleave", () => {
  pointer.set(2, 2);
  pointerX = 0;
  pointerY = 0;
  resetInteractionState();
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  updatePointerFromEvent(event);
  pointerDown = true;
  modelHovered = raycastModel();
  dragging = modelHovered;
  setHovered(modelHovered);
  if (dragging) {
    setHovered(true);
    alignModelToCamera();
  }
});

window.addEventListener("pointerup", () => {
  resetInteractionState();
});

window.addEventListener("pointercancel", () => {
  resetInteractionState();
});

const themeObserver = new MutationObserver(() => {
  syncAmbient();
});
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
syncAmbient();

const animate = () => {
  requestAnimationFrame(animate);

  // Ether-like shimmer in the colored spill lights.
  const shimmerTime = performance.now() * 0.001;
  const shimmerA = 1.0 - etherLightConfig.shimmerDepth * 0.5 + etherLightConfig.shimmerDepth * Math.sin(shimmerTime * 1.25);
  const shimmerC = 1.0 - etherLightConfig.shimmerDepth * 0.55 + etherLightConfig.shimmerDepth * Math.sin(shimmerTime * 1.65 + 0.65);
  const lightPointerX = pointerX;
  const lightPointerY = pointerY;

  // Slight orbit motion makes the model feel lit by moving ether currents.
  keyLightTargetPos.set(
    2.0 + lightPointerX * 1.2,
    1.9 - lightPointerY * 0.4,
    -2.4
  );
  etherKeyLight.position.lerp(keyLightTargetPos, 0.12);
  etherRimLight.position.set(
    -2.35 + Math.sin(shimmerTime * 0.66 + 2.2) * 0.25,
    1.1 + Math.cos(shimmerTime * 1.32 + 0.4) * 0.2,
    1.85 + Math.cos(shimmerTime * 0.9 + 2.8) * 0.85
  );

  etherKeyLight.intensity = baseLightIntensity.key * shimmerA;
  etherRimLight.intensity = baseLightIntensity.rim * shimmerC;

  if (modelGroup) {
    modelHovered = raycastModel();

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

    const canTilt = dragging && !aligning;
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

  camera.lookAt(0, camera.position.y, 0);
  renderer.render(scene, camera);
};

camera.position.set(-2, -0.3, -6);
window.addEventListener("resize", () => {
  renderer.setSize(root.clientWidth, root.clientHeight);
  camera.aspect = root.clientWidth / root.clientHeight;
  camera.updateProjectionMatrix();
});

animate();
