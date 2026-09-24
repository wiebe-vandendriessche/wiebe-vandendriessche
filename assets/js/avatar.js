import {
  ACESFilmicToneMapping,
  Box3,
  BoxGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { onEffectsChange } from "./lib/effects.js";
import { ETHER_INK } from "./ether/palette.js";

// Interaction feel, carried over unchanged from the previous hero, including the
// per-frame damping. Keep it per-frame: the drag yaw feeds the tilt back into the
// next frame's rotation, so the angle the model settles at depends on the per-frame
// damping, and "frame-rate independent" damping made it turn noticeably further on
// high-refresh screens.
const FEEL = {
  scale: 1.5,
  dragScale: 1.06,
  idleSpeed: 0.7,
  idleYawRange: Math.PI / 5,
  alignRate: 0.3,
  alignSnap: 0.012,
  tilt: 0.22,
  tiltYaw: 0.08,
  yawRange: Math.PI / 6,
  colliderMargin: 1.28,
  dampTilt: 0.18,
  dampScale: 0.12,
  dampYaw: 0.18,
  dampIdle: 0.08,
  dragReach: 1.75,
};

// Lighting per theme. The key light takes the palette's warmest colour and follows
// the ether's cursor; the rim takes the coolest; the fluid itself adds bounce light
// and a rim in its on-screen colours through the material patch.
const LOOK = {
  dark: { exposure: 1.0, hemi: 0.35, key: 2.0, rim: 1.9, fill: 0.5, bounce: 0.35, rimInk: 0.8 },
  light: { exposure: 1.03, hemi: 0.8, key: 1.9, rim: 1.6, fill: 0.45, bounce: 0.25, rimInk: 0.45 },
};

// Inside the hero this is the identity; beyond it the response keeps growing with
// diminishing returns instead of running away or pinning to the edge.
const softLimit = (v) =>
  Math.abs(v) <= 1 ? v : Math.sign(v) * (1 + (FEEL.dragReach - 1) * (1 - Math.exp(1 - Math.abs(v))));
const normalizeAngle = (a) => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

// The fluid, sampled at this fragment's screen position, lights the model: bounce
// light weighted by albedo (so the peach skin reflects the pink stop more than the
// blue one), and a fresnel rim in the exact on-screen ink, added after tone mapping.
function patchMaterial(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `${ETHER_INK}
uniform vec2 uDrawSize;
uniform float uBounce;
uniform float uRimInk;
void main() {`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
  float etherL;
  vec3 etherC = etherInk(gl_FragCoord.xy / uDrawSize, etherL);
  float etherF = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
  totalEmissiveRadiance += diffuseColor.rgb * sRGBTransferEOTF(vec4(etherC, 1.0)).rgb * etherL * uBounce;`
      )
      .replace(
        "#include <colorspace_fragment>",
        `#include <colorspace_fragment>
  float etherRim = etherF * etherL * uRimInk;
  gl_FragColor.rgb = uLight > 0.5 ? mix(gl_FragColor.rgb, etherC, etherRim) : gl_FragColor.rgb + etherC * etherRim;`
      );
  };
}

export function mountAvatar(ether, hero, modelUrl) {
  const { renderer, pointer: etherPointer, size } = ether;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(-2, -0.3, -6);
  camera.lookAt(0, -0.3, 0);
  // The model sits at the origin and never moves, so its facing yaw is a constant.
  const facingYaw = Math.atan2(camera.position.x, camera.position.z) + Math.PI;

  const hemi = new HemisphereLight(0xffffff, 0x1b2336);
  const key = new DirectionalLight();
  const rim = new DirectionalLight();
  const fill = new DirectionalLight();
  key.position.set(1.8, 2.0, -2.4);
  rim.position.set(-2.35, 1.1, 1.85);
  fill.position.set(-1.6, -0.6, -3.0);
  scene.add(hemi, key, rim, fill);

  const uniforms = { ...ether.shared, uBounce: { value: 0 }, uRimInk: { value: 0 } };
  let look = LOOK.dark;
  const applyTheme = (dark, palette) => {
    look = dark ? LOOK.dark : LOOK.light;
    renderer.toneMappingExposure = look.exposure;
    hemi.intensity = look.hemi;
    rim.intensity = look.rim;
    fill.intensity = look.fill;
    key.color.copy(palette.lights.key);
    rim.color.copy(palette.lights.rim);
    fill.color.copy(palette.lights.fill);
    uniforms.uBounce.value = look.bounce;
    uniforms.uRimInk.value = look.rimInk;
  };
  applyTheme(document.documentElement.classList.contains("dark"), ether.palette);
  ether.onTheme = applyTheme;

  // --- model --------------------------------------------------------------------
  const group = new Group();
  group.scale.setScalar(FEEL.scale);
  scene.add(group);
  let collider = null;

  hero.dataset.loading = "";
  new GLTFLoader().load(
    modelUrl,
    (gltf) => {
      gltf.scene.traverse((o) => o.isMesh && patchMaterial(o.material, uniforms));
      group.add(gltf.scene);
      const box = new Box3().setFromObject(gltf.scene);
      const boxSize = box.getSize(new Vector3()).multiplyScalar(FEEL.colliderMargin);
      // Invisible proxy for raycasting: the raycaster ignores `visible`, the renderer
      // does not, so it costs nothing to draw.
      collider = new Mesh(new BoxGeometry(boxSize.x, boxSize.y, boxSize.z));
      collider.position.copy(box.getCenter(new Vector3()));
      collider.visible = false;
      group.add(collider);
      delete hero.dataset.loading;
    },
    undefined,
    (error) => {
      console.error("avatar: failed to load model", error);
      delete hero.dataset.loading;
    }
  );

  // --- pointer: hover, grab, drag anywhere --------------------------------------
  const raycaster = new Raycaster();
  const ndc = new Vector2(2, 2); // (2,2) = parked off the hero
  let px = 0;
  let py = 0;
  let enabled = true;
  let dragging = false;
  let activeId = null;
  let aligning = false;
  let targetYaw = 0;
  let lastAlignedYaw = 0;
  let tiltYaw = 0;
  let rect = hero.getBoundingClientRect();

  const setFromEvent = (e) => {
    rect = hero.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    px = softLimit(ndc.x);
    py = softLimit(ndc.y);
  };
  const hitModel = () => {
    if (!enabled || !collider || Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) return false;
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(collider, false).length > 0;
  };

  let dragClass = false;
  let hoverClass = false;
  const setClasses = (hover) => {
    const drag = enabled && dragging;
    hover = enabled && !dragging && hover;
    if (drag !== dragClass) document.body.classList.toggle("threejs-hero-dragging", (dragClass = drag));
    if (hover !== hoverClass) document.body.classList.toggle("threejs-hero-hovering", (hoverClass = hover));
  };

  const release = () => {
    if (activeId !== null && hero.hasPointerCapture?.(activeId)) hero.releasePointerCapture(activeId);
    activeId = null;
    dragging = false;
    aligning = false;
    setClasses(false);
  };
  const park = () => {
    ndc.set(2, 2);
    px = py = 0;
  };

  hero.addEventListener("pointermove", (e) => {
    if (enabled && (activeId === null || e.pointerId === activeId)) setFromEvent(e);
  });
  hero.addEventListener("pointerleave", (e) => {
    // While dragging, the captured pointer may roam the whole page.
    if (dragging || e.pointerId === activeId) return;
    park();
    release();
  });
  hero.addEventListener("pointerdown", (e) => {
    if (!enabled) return;
    setFromEvent(e);
    if (!hitModel()) return;
    dragging = true;
    activeId = e.pointerId;
    try {
      // Routes every later move/up to the hero, even far outside it.
      hero.setPointerCapture(e.pointerId);
    } catch {
      activeId = null;
    }
    e.preventDefault();
    targetYaw = facingYaw;
    aligning = true;
    setClasses(false);
  });
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  addEventListener("blur", release);

  onEffectsChange((on) => {
    enabled = on;
    if (!on) {
      park();
      release();
    }
  });

  // --- per frame ----------------------------------------------------------------
  const keyTarget = new Vector3();
  let aspectW = 0;
  let aspectH = 0;

  ether.layer = () => {
    rect = hero.getBoundingClientRect();
    if (!collider || rect.width === 0 || rect.height === 0) return;
    if (rect.width !== aspectW || rect.height !== aspectH) {
      aspectW = rect.width;
      aspectH = rect.height;
      camera.aspect = aspectW / aspectH;
      camera.updateProjectionMatrix();
    }

    // The key light comes from wherever the ether's cursor is (the user's pointer or
    // the autopilot), relative to the hero, and flares while the fluid is stirred.
    const cx = ((etherPointer.coords.x + 1) / 2) * size.width;
    const cy = ((1 - etherPointer.coords.y) / 2) * size.height;
    const hx = softLimit(((cx - rect.left) / rect.width) * 2 - 1);
    const hy = softLimit(-(((cy - rect.top) / rect.height) * 2 - 1));
    key.position.lerp(keyTarget.set(1.8 - hx * 3.0, 2.0 + hy * 1.4, -2.4), 0.12);
    key.intensity = look.key * (1 + 0.6 * etherPointer.energy);

    if (!dragging) {
      const hovered = hitModel();
      setClasses(hovered);
      if (!hovered) aligning = false;
    }

    let yaw = group.rotation.y;
    if (dragging && aligning) {
      const delta = normalizeAngle(targetYaw - yaw);
      if (Math.abs(delta) < FEEL.alignSnap) {
        yaw = lastAlignedYaw = targetYaw;
        aligning = false;
      } else {
        yaw += delta * FEEL.alignRate;
      }
    } else if (dragging) {
      yaw += ((lastAlignedYaw || yaw) + px * FEEL.yawRange - yaw) * FEEL.dampYaw;
    } else {
      const t = performance.now() / 1000;
      yaw += (facingYaw + Math.sin(t * FEEL.idleSpeed) * FEEL.idleYawRange - yaw) * FEEL.dampIdle;
    }

    const tilt = enabled && dragging && !aligning;
    const kt = FEEL.dampTilt;
    tiltYaw += ((tilt ? px * FEEL.tiltYaw : 0) - tiltYaw) * kt;
    group.rotation.x += ((tilt ? py * FEEL.tilt : 0) - group.rotation.x) * kt;
    group.rotation.z += ((tilt ? -px * FEEL.tilt : 0) - group.rotation.z) * kt;
    group.rotation.y = yaw + tiltYaw;

    const s = group.scale.x;
    group.scale.setScalar(s + ((dragging ? FEEL.scale * FEEL.dragScale : FEEL.scale) - s) * FEEL.dampScale);

    // Drawn straight into the ether's canvas, inside the hero's on-screen rectangle
    // (viewport y is measured from the bottom).
    renderer.setViewport(rect.left, size.height - rect.bottom, rect.width, rect.height);
    renderer.render(scene, camera);
  };
}
