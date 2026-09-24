// Namespace import: esbuild elides it and tree-shakes three, but ONLY while `THREE`
// is never used as a value. Never pass it to a function, spread it, or index it
// dynamically -- any of those ships all of three.js.
import * as THREE from "three";
import { readScriptConfig } from "./lib/script-config.js";
import { observeClass } from "./lib/class-state.js";
import { onThemeChange } from "./lib/theme.js";
import { onEffectsChange } from "./lib/effects.js";
import { createRenderLoop } from "./lib/render-loop.js";

const canvasId = readScriptConfig("data-liquid-ether").canvasId || "liquid-ether-canvas";
const canvas = document.getElementById(canvasId);
if (!canvas) {
  throw new Error("liquid-ether.js: canvas not found");
}

const root = document.documentElement;

function parseCssTriplet(name, fallback) {
  const raw = getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const parts = raw
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite);
  return parts.length === 3 ? parts : fallback;
}

function rgbToHex(rgb) {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

function cssColorHex(name, fallback) {
  return rgbToHex(parseCssTriplet(name, fallback));
}

function cssColorVector(name, fallback) {
  const [r, g, b] = parseCssTriplet(name, fallback);
  return new THREE.Vector4(r / 255, g / 255, b / 255, 1);
}

function makePaletteTexture(stops) {
  const arr = Array.isArray(stops) && stops.length > 0 ? (stops.length === 1 ? [stops[0], stops[0]] : stops) : ["#ffffff", "#ffffff"];
  const w = arr.length;
  const data = new Uint8Array(w * 4);
  for (let i = 0; i < w; i += 1) {
    const c = new THREE.Color(arr[i]);
    data[i * 4 + 0] = Math.round(c.r * 255);
    data[i * 4 + 1] = Math.round(c.g * 255);
    data[i * 4 + 2] = Math.round(c.b * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const shaders = {
  faceVert: `
attribute vec3 position;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5) + pos.xy * 0.5;
  gl_Position = vec4(pos, 1.0);
}
`,
  mouseVert: `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,
  advectionFrag: `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  vec2 vel = texture2D(velocity, uv).xy;
  vec2 uv2 = uv - vel * dt * ratio;
  vec2 newVel = texture2D(velocity, uv2).xy;
  gl_FragColor = vec4(newVel, 0.0, 0.0);
}
`,
  colorFrag: `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
varying vec2 uv;
void main(){
  vec2 vel = texture2D(velocity, uv).xy;
  float lenv = clamp(length(vel), 0.0, 1.0);
  vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
  vec3 outRGB = mix(bgColor.rgb, c, lenv);
  float outA = mix(bgColor.a, 1.0, lenv);
  gl_FragColor = vec4(outRGB, outA);
}
`,
  divergenceFrag: `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main(){
  float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}
`,
  externalForceFrag: `
precision highp float;
uniform vec2 force;
varying vec2 vUv;
void main(){
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`,
  poissonFrag: `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
  gl_FragColor = vec4(newP);
}
`,
  pressureFrag: `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  float stepv = 1.0;
  float p0 = texture2D(pressure, uv + vec2(px.x * stepv, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * stepv, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * stepv)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * stepv)).r;
  vec2 v = texture2D(velocity, uv).xy;
  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
  v = v - gradP * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`,
};

let effectsStillOn = true;

const MOBILE_BREAKPOINT_PX = 768;
const DPR_CAP = 1.25;

const options = {
  mouseForce: 20,
  cursorSize: 100,
  iterationsPoisson: 12,
  dt: 0.014,
  resolution: 0.4,
  resolutionMobile: 0.42,
  resolutionMinDim: 256,
  resolutionMaxDim: 2048,
  autoDemo: true,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  takeoverDuration: 0.25,
  autoResumeDelay: 1000,
  autoRampDuration: 0.6,
  maxFPS: 45,
};

class CommonClass {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.aspect = 1;
    this.pixelRatio = 1;
    this.container = null;
    this.renderer = null;
    this.stage = null;
  }

  init(container, existingCanvas) {
    this.container = container;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    this.renderer = new THREE.WebGLRenderer({
      canvas: existingCanvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.autoClear = false;
    this.renderer.sortObjects = false;
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    this.renderer.setPixelRatio(this.pixelRatio);
    const el = this.renderer.domElement;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    this.resize();
    this.stage = new Stage(this);
  }

  resize() {
    if (!this.container) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    if (pixelRatio !== this.pixelRatio) {
      this.pixelRatio = pixelRatio;
      if (this.renderer) this.renderer.setPixelRatio(pixelRatio);
    }
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.aspect = this.width / this.height;
    if (this.renderer) this.renderer.setSize(this.width, this.height, false);
  }

}

class MouseClass {
  constructor() {
    this.coords = new THREE.Vector2();
    this.coordsOld = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.container = null;
    this.interactive = true; // corrected synchronously by onEffectsChange
    this.hasUserControl = false;
    this.isAutoActive = false;
    this.autoIntensity = 2;
    this.takeoverActive = false;
    this.takeoverStartTime = 0;
    this.takeoverDuration = 0.25;
    this.takeoverFrom = new THREE.Vector2();
    this.takeoverTo = new THREE.Vector2();
    this.onInteract = null;
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onTouch = this.handleTouch.bind(this);
  }

  init(container) {
    this.container = container;
    window.addEventListener("mousemove", this.onMouseMove, { passive: true });
    window.addEventListener("touchstart", this.onTouch, { passive: true });
    window.addEventListener("touchmove", this.onTouch, { passive: true });
  }

  setInteractive(enabled) {
    this.interactive = enabled;
    if (!enabled) {
      this.hasUserControl = false;
      this.takeoverActive = false;
      this.diff.set(0, 0);
      this.coordsOld.copy(this.coords);
    }
  }

  dispose() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("touchstart", this.onTouch);
    window.removeEventListener("touchmove", this.onTouch);
  }

  setCoords(x, y) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const nx = (x - rect.left) / rect.width;
    const ny = (y - rect.top) / rect.height;
    this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
  }

  setNormalized(nx, ny) {
    this.coords.set(nx, ny);
  }

  updateFromClient(x, y) {
    if (!this.interactive) return;
    this.setCoords(x, y);
    this.hasUserControl = true;
  }

  handleMouseMove(event) {
    if (!this.interactive || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) {
      return;
    }

    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
      this.takeoverFrom.copy(this.coords);
      this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
      this.takeoverStartTime = performance.now();
      this.takeoverActive = true;
      this.hasUserControl = true;
      this.isAutoActive = false;
    } else {
      this.updateFromClient(event.clientX, event.clientY);
    }
    if (this.onInteract) this.onInteract();
  }

  handleTouch(event) {
    if (!this.interactive || !event.touches || event.touches.length !== 1 || !this.container) return;
    const t = event.touches[0];
    this.updateFromClient(t.clientX, t.clientY);
    if (this.onInteract) this.onInteract();
  }

  update() {
    if (this.takeoverActive) {
      const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
      if (t >= 1) {
        this.takeoverActive = false;
        this.coords.copy(this.takeoverTo);
        this.coordsOld.copy(this.coords);
        this.diff.set(0, 0);
      } else {
        const k = t * t * (3 - 2 * t);
        this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
      }
    }

    this.diff.subVectors(this.coords, this.coordsOld);
    this.coordsOld.copy(this.coords);
    if (this.coordsOld.x === 0 && this.coordsOld.y === 0) this.diff.set(0, 0);
    if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
  }
}

class AutoDriver {
  constructor(mouse, manager, opts) {
    this.mouse = mouse;
    this.manager = manager;
    this.enabled = opts.enabled;
    this.speed = opts.speed;
    this.resumeDelay = opts.resumeDelay || 3000;
    this.rampDurationMs = (opts.rampDuration || 0) * 1000;
    this.active = false;
    this.current = new THREE.Vector2(0, 0);
    this.target = new THREE.Vector2();
    this.lastTime = performance.now();
    this.activationTime = 0;
    this.margin = 0.2;
    this.tmpDir = new THREE.Vector2();
    this.pickNewTarget();
  }

  pickNewTarget() {
    const r = Math.random;
    this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
  }

  forceStop() {
    this.active = false;
    this.mouse.isAutoActive = false;
  }

  update() {
    if (!this.enabled) return;
    const now = performance.now();
    const idle = now - this.manager.lastUserInteraction;
    if (idle < this.resumeDelay) {
      if (this.active) this.forceStop();
      return;
    }

    if (!this.active) {
      this.active = true;
      this.current.copy(this.mouse.coords);
      this.lastTime = now;
      this.activationTime = now;
    }

    this.mouse.isAutoActive = true;
    let dtSec = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dtSec > 0.2) dtSec = 0.016;

    const dir = this.tmpDir.subVectors(this.target, this.current);
    const dist = dir.length();
    if (dist < 0.01) {
      this.pickNewTarget();
      return;
    }

    dir.normalize();
    let ramp = 1;
    if (this.rampDurationMs > 0) {
      const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
      ramp = t * t * (3 - 2 * t);
    }

    const step = this.speed * dtSec * ramp;
    const move = Math.min(step, dist);
    this.current.addScaledVector(dir, move);
    this.mouse.setNormalized(this.current.x, this.current.y);
  }
}

// One scene, one camera, one quad, shared by every pass. Passes differ only in
// material and output target, so six Scene/Camera/PlaneGeometry triples were six
// copies of the same thing plus six render-list rebuilds per frame.
class Stage {
  constructor(common) {
    this.common = common;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, null);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    // Nothing here ever moves, so skip the per-frame matrix walk entirely.
    this.scene.matrixWorldAutoUpdate = false;
    this.camera.matrixWorldAutoUpdate = false;
    this.mesh.updateMatrixWorld();
    this.scene.updateMatrixWorld();
    this.camera.updateMatrixWorld();
  }

  // `target` of null means the canvas. We do NOT unbind afterwards: the next pass
  // binds its own target, so the old setRenderTarget(null) after every pass was
  // doubling the framebuffer binds for nothing.
  draw(material, target) {
    const renderer = this.common.renderer;
    if (!renderer || !material) return;
    this.mesh.material = material;
    renderer.setRenderTarget(target || null);
    renderer.render(this.scene, this.camera);
  }
}

class ShaderPass {
  constructor(common, props) {
    this.common = common;
    this.props = props || {};
    this.uniforms = this.props.material ? this.props.material.uniforms : null;
    this.material = null;
  }

  init() {
    if (this.uniforms) this.material = new THREE.RawShaderMaterial(this.props.material);
  }

  update() {
    this.common.stage.draw(this.material, this.props.output);
  }
}

class Advection extends ShaderPass {
  constructor(common, simProps) {
    super(common, {
      material: {
        vertexShader: shaders.faceVert,
        fragmentShader: shaders.advectionFrag,
        uniforms: {
          boundarySpace: { value: simProps.cellScale },
          px: { value: simProps.cellScale },
          fboSize: { value: simProps.fboSize },
          velocity: { value: simProps.src.texture },
          dt: { value: simProps.dt },
        },
      },
      output: simProps.dst,
    });
    this.init();
  }

  update(opts) {
    if (!this.uniforms) return;
    const p = opts || {};
    if (typeof p.dt === "number") this.uniforms.dt.value = p.dt;
    super.update();
  }
}

class ExternalForce extends ShaderPass {
  constructor(common, simProps, mouse) {
    super(common, { output: simProps.dst });
    this.mouseState = mouse;
    // Its own scene: a small additively-blended disc placed at the cursor, not the
    // shared fullscreen quad.
    this.scene = new THREE.Scene();
    this.scene.matrixWorldAutoUpdate = false;
    const mouseG = new THREE.PlaneGeometry(1, 1);
    const mouseM = new THREE.RawShaderMaterial({
      vertexShader: shaders.mouseVert,
      fragmentShader: shaders.externalForceFrag,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        px: { value: simProps.cellScale },
        force: { value: new THREE.Vector2(0, 0) },
        center: { value: new THREE.Vector2(0, 0) },
        scale: { value: new THREE.Vector2(simProps.cursorSize, simProps.cursorSize) },
      },
    });
    this.mouse = new THREE.Mesh(mouseG, mouseM);
    this.mouse.frustumCulled = false;
    this.scene.add(this.mouse);
    this.mouse.updateMatrixWorld();
    this.scene.updateMatrixWorld();

    // Constant for a given sim size; recomputed only in calcSize via setCellScale.
    this.clampX = 0;
    this.clampY = 0;
  }

  // cursorSize and cellScale only change on resize, so the clamp bounds and the
  // `scale` uniform belong here rather than in the frame loop.
  setCellScale(cellScale, cursorSize) {
    this.clampX = 1 - cursorSize * cellScale.x - cellScale.x * 2;
    this.clampY = 1 - cursorSize * cellScale.y - cellScale.y * 2;
    this.mouse.material.uniforms.scale.value.set(cursorSize, cursorSize);
  }

  update(mouseForce) {
    const uniforms = this.mouse.material.uniforms;
    uniforms.force.value.set(
      (this.mouseState.diff.x / 2) * mouseForce,
      (this.mouseState.diff.y / 2) * mouseForce
    );
    uniforms.center.value.set(
      Math.min(Math.max(this.mouseState.coords.x, -this.clampX), this.clampX),
      Math.min(Math.max(this.mouseState.coords.y, -this.clampY), this.clampY)
    );
    const renderer = this.common.renderer;
    renderer.setRenderTarget(this.props.output);
    renderer.render(this.scene, this.common.stage.camera);
  }
}

class Divergence extends ShaderPass {
  constructor(common, simProps) {
    super(common, {
      material: {
        vertexShader: shaders.faceVert,
        fragmentShader: shaders.divergenceFrag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt },
        },
      },
      output: simProps.dst,
    });
    this.init();
  }

  // velocity is always fbos.vel_1 and render-target textures survive setSize, so
  // the uniform set in the constructor stays correct for the page lifetime.
}

class Poisson extends ShaderPass {
  constructor(common, simProps) {
    super(common, {
      material: {
        vertexShader: shaders.faceVert,
        fragmentShader: shaders.poissonFrag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          pressure: { value: simProps.dstAux.texture },
          divergence: { value: simProps.src.texture },
          px: { value: simProps.cellScale },
        },
      },
      output: simProps.dst,
    });
    // The only true ping-pong in the sim. `read` is never cleared between frames,
    // which is deliberate: each frame warm-starts Jacobi from the previous frame's
    // converged pressure field. An even iteration count leaves the result in `read`.
    this.read = simProps.dstAux;
    this.write = simProps.dst;
    this.init();
  }

  update(iterations) {
    for (let i = 0; i < iterations; i += 1) {
      this.uniforms.pressure.value = this.read.texture;
      this.common.stage.draw(this.material, this.write);
      const swap = this.read;
      this.read = this.write;
      this.write = swap;
    }
    return this.read;
  }
}

class Pressure extends ShaderPass {
  constructor(common, simProps) {
    super(common, {
      material: {
        vertexShader: shaders.faceVert,
        fragmentShader: shaders.pressureFrag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          pressure: { value: simProps.srcPressure.texture },
          velocity: { value: simProps.srcVelocity.texture },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt },
        },
      },
      output: simProps.dst,
    });
    this.init();
  }

  // velocity is constant; pressure alternates with the Poisson ping-pong parity.
  update(pressure) {
    this.uniforms.pressure.value = pressure.texture;
    super.update();
  }
}

class Simulation {
  constructor(common, mouse, opts) {
    this.common = common;
    this.mouse = mouse;
    this.options = opts;

    this.fbos = {
      vel_0: null,
      vel_1: null,
      div: null,
      pressure_0: null,
      pressure_1: null,
    };

    this.fboSize = new THREE.Vector2();
    this.cellScale = new THREE.Vector2();
    this.boundarySpace = new THREE.Vector2();

    this.advection = null;
    this.externalForce = null;
    this.divergence = null;
    this.poisson = null;
    this.pressure = null;

    this.init();
  }

  calcSize() {
    const dpr = this.common.pixelRatio || 1;
    const baseW = this.options.resolution * this.common.width * dpr;
    const baseH = this.options.resolution * this.common.height * dpr;
    const minDim = this.options.resolutionMinDim;
    const maxDim = this.options.resolutionMaxDim;
    const width = Math.min(maxDim, Math.max(minDim, Math.round(baseW)));
    const height = Math.min(maxDim, Math.max(minDim, Math.round(baseH)));

    // These three are shared Vector2 INSTANCES held by many uniform objects.
    // Always mutate in place -- reassigning silently detaches every uniform.
    this.cellScale.set(1 / width, 1 / height);
    this.boundarySpace.copy(this.cellScale);
    this.fboSize.set(width, height);
    if (this.externalForce) this.externalForce.setCellScale(this.cellScale, this.options.cursorSize);
  }

  createAllFBO() {
    // RGBA16F rather than RGBA32F: the ExternalForce pass blends additively into
    // vel_1, and blending into a 32-bit float target needs the optional
    // EXT_float_blend extension (implicitly enabled in WebGL2, which Firefox
    // warns about, and absent on some Android GPUs). Blending into 16F is
    // guaranteed, and halving the bandwidth across these targets is free speed.
    const opts = {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };

    Object.keys(this.fbos).forEach((key) => {
      this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts);
    });
  }

  createShaderPasses() {
    this.advection = new Advection(this.common, {
      cellScale: this.cellScale,
      fboSize: this.fboSize,
      dt: this.options.dt,
      src: this.fbos.vel_0,
      dst: this.fbos.vel_1,
    });

    this.externalForce = new ExternalForce(
      this.common,
      {
        cellScale: this.cellScale,
        cursorSize: this.options.cursorSize,
        dst: this.fbos.vel_1,
      },
      this.mouse
    );
    this.externalForce.setCellScale(this.cellScale, this.options.cursorSize);

    this.divergence = new Divergence(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.vel_1,
      dst: this.fbos.div,
      dt: this.options.dt,
    });

    this.poisson = new Poisson(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.div,
      dst: this.fbos.pressure_1,
      dstAux: this.fbos.pressure_0,
    });

    this.pressure = new Pressure(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      srcPressure: this.fbos.pressure_0,
      srcVelocity: this.fbos.vel_1,
      dst: this.fbos.vel_0,
      dt: this.options.dt,
    });
  }

  init() {
    this.calcSize();
    this.createAllFBO();
    this.createShaderPasses();
  }

  resize() {
    this.calcSize();
    Object.keys(this.fbos).forEach((key) => {
      this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
    });
  }

  update() {
    this.advection.update({ dt: this.options.dt });
    this.externalForce.update(this.options.mouseForce);
    this.divergence.update();
    this.pressure.update(this.poisson.update(this.options.iterationsPoisson));
  }
}

class Output {
  constructor(common, mouse, simOptions) {
    this.common = common;
    this.mouse = mouse;

    this.paletteCache = { dark: null, light: null };
    this.bgColorVec = new THREE.Vector4(1, 1, 1, 1);

    this.simulation = new Simulation(common, mouse, simOptions);

    this.material = new THREE.RawShaderMaterial({
      vertexShader: shaders.faceVert,
      fragmentShader: shaders.colorFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        velocity: { value: this.simulation.fbos.vel_0.texture },
        boundarySpace: { value: new THREE.Vector2() },
        palette: { value: null },
        bgColor: { value: this.bgColorVec },
      },
    });

    this.updateThemePalette();
  }

  updateThemePalette(dark = root.classList.contains("dark")) {
    // The scheme defines --color-primary-* on :root with no .dark override, so each
    // theme's LUT is immutable for the page lifetime: build it once and keep it.
    // This used to dispose and reallocate a DataTexture on every <html> class
    // mutation, from an observer that was not filtered to actual theme changes.
    //
    // Widths stay distinct (3 stops dark, 2 light): with LinearFilter a 2-texel LUT
    // is flat below u=0.25 and above u=0.75 while a 3-texel LUT has knots at 1/6,
    // 1/2 and 5/6, so they cannot be made to sample identically.
    const key = dark ? "dark" : "light";
    if (!this.paletteCache[key]) {
      this.paletteCache[key] = makePaletteTexture(
        dark
          ? [
              cssColorHex("--color-primary-200", [147, 197, 253]),
              cssColorHex("--color-primary-300", [96, 165, 250]),
              cssColorHex("--color-primary-400", [59, 130, 246]),
            ]
          : [
              cssColorHex("--color-primary-100", [191, 219, 254]),
              // Was --color-primary-100 a second time, which made the light gradient
              // flat. -200 is the intended second stop.
              cssColorHex("--color-primary-200", [147, 197, 253]),
            ]
      );
    }
    this.material.uniforms.palette.value = this.paletteCache[key];

    if (dark) {
      this.bgColorVec.set(0, 0, 0, 0);
    } else {
      const lightBg = cssColorVector("--color-neutral-50", [249, 250, 251]);
      this.bgColorVec.copy(lightBg);
      this.bgColorVec.w = 1;
    }
  }

  resize() {
    this.simulation.resize();
  }

  render() {
    // null target == the canvas.
    this.common.stage.draw(this.material, null);
  }

  update() {
    this.simulation.update();
    this.render();
  }

  dispose() {
    for (const tex of Object.values(this.paletteCache)) if (tex) tex.dispose();
  }
}

class LiquidEtherManager {
  constructor(container, canvasEl) {
    this.common = new CommonClass();
    this.mouse = new MouseClass();
    this.output = null;
    this.autoDriver = null;
    this.lastUserInteraction = performance.now();
    this.loop = null;

    this.onResize = this.resize.bind(this);

    this.common.init(container, canvasEl);
    this.mouse.init(container);
    this.mouse.autoIntensity = options.autoIntensity;
    this.mouse.takeoverDuration = options.takeoverDuration;
    this.mouse.onInteract = () => {
      this.lastUserInteraction = performance.now();
      if (this.autoDriver) this.autoDriver.forceStop();
    };

    // Evaluated once, deliberately: re-picking the mobile resolution on rotate would
    // resize every render target mid-session, which is visible.
    const isMobileViewport = Math.min(window.innerWidth, window.innerHeight) < MOBILE_BREAKPOINT_PX;
    this.output = new Output(this.common, this.mouse, {
      ...options,
      resolution: isMobileViewport ? options.resolutionMobile : options.resolution,
    });

    this.autoDriver = new AutoDriver(this.mouse, this, {
      enabled: options.autoDemo,
      speed: options.autoSpeed,
      resumeDelay: options.autoResumeDelay,
      rampDuration: options.autoRampDuration,
    });

    window.addEventListener("resize", this.onResize);

    this.loop = createRenderLoop({ render: () => this.render(), fps: options.maxFPS });
    this.loop.addVisibilityGate();

    onEffectsChange((enabled) => this.handleInteractionChange(enabled));

    // Blowfish's zen mode toggles body.zen-mode-enable and dispatches no event, and
    // the theme is a submodule so we cannot add one -- observe the class instead,
    // which is also robust to whatever toggles it (button, a11y panel, future paths).
    // Gating on the button's presence means nothing is installed on pages where zen
    // mode cannot be entered, i.e. everything except single article pages.
    if (document.getElementById("zen-mode-button")) {
      this.unobserveZen = observeClass(document.body, "zen-mode-enable", (zen) => {
        this.loop.gate("zen", !zen);
        if (zen) {
          // Stop queueing force so exiting zen does not discharge a backlog at once.
          if (this.autoDriver) this.autoDriver.forceStop();
          this.mouse.setInteractive(false);
        } else {
          this.mouse.setInteractive(effectsStillOn);
        }
      });
    }
  }

  resize() {
    const previousWidth = this.common.width;
    const previousPixelRatio = this.common.pixelRatio;
    this.common.resize();

    const widthChanged = this.common.width !== previousWidth;
    const pixelRatioChanged = this.common.pixelRatio !== previousPixelRatio;
    const isMobileViewport = Math.min(window.innerWidth, window.innerHeight) < MOBILE_BREAKPOINT_PX;
    if (this.output && (!isMobileViewport || widthChanged || pixelRatioChanged)) {
      this.output.resize();
    }
  }

  handleInteractionChange(enabled) {
    effectsStillOn = enabled;
    this.mouse.setInteractive(enabled);
    if (!enabled) {
      if (this.autoDriver) this.autoDriver.forceStop();
      // Effects OFF disables pointer input only. The autopilot deliberately resumes
      // immediately so the background keeps flowing -- that is the existing
      // behaviour, and OFF is the first-visit default.
      this.lastUserInteraction = Number.NEGATIVE_INFINITY;
    }
  }

  render() {
    if (this.autoDriver) this.autoDriver.update();
    this.mouse.update();
    if (this.output) this.output.update();
  }

  start() {
    this.loop.gate("started", true);
  }

  refreshTheme(dark) {
    if (!this.output) return;
    this.output.updateThemePalette(dark);
    // Repaint once so a theme switch lands even while frozen (zen mode, hidden tab).
    if (!this.loop.running) this.loop.renderOnce();
  }

  dispose() {
    this.loop.dispose();
    if (this.unobserveZen) this.unobserveZen();
    window.removeEventListener("resize", this.onResize);
    this.mouse.dispose();
    if (this.output) this.output.dispose();
    if (this.common.renderer) this.common.renderer.dispose();
  }
}

canvas.style.position = canvas.style.position || "fixed";
canvas.style.inset = canvas.style.inset || "0";
canvas.style.pointerEvents = "none";

const manager = new LiquidEtherManager(canvas, canvas);
manager.start();

// One filtered observer, shared with threejs-hero, instead of two unfiltered ones.
onThemeChange((dark) => manager.refreshTheme(dark));
