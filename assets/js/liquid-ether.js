import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";

const scriptEl =
  document.currentScript ||
  document.querySelector("script[type='module'][data-liquid-ether]");
if (!scriptEl) {
  throw new Error("liquid-ether.js: script tag not found");
}

const canvasId = scriptEl.dataset.canvasId || "liquid-ether-canvas";
const canvas = document.getElementById(canvasId);
if (!canvas) {
  throw new Error("liquid-ether.js: canvas not found");
}

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

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
uniform vec2 px;
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
  lineVert: `
attribute vec3 position;
uniform vec2 px;
precision highp float;
varying vec2 uv;
void main(){
  vec3 pos = position;
  uv = 0.5 + pos.xy * 0.5;
  vec2 n = sign(pos.xy);
  pos.xy = abs(pos.xy) - px * 1.0;
  pos.xy *= n;
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
uniform bool isBFECC;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  if(isBFECC == false){
    vec2 vel = texture2D(velocity, uv).xy;
    vec2 uv2 = uv - vel * dt * ratio;
    vec2 newVel = texture2D(velocity, uv2).xy;
    gl_FragColor = vec4(newVel, 0.0, 0.0);
  } else {
    vec2 spot_new = uv;
    vec2 vel_old = texture2D(velocity, uv).xy;
    vec2 spot_old = spot_new - vel_old * dt * ratio;
    vec2 vel_new1 = texture2D(velocity, spot_old).xy;
    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
    vec2 error = spot_new2 - spot_new;
    vec2 spot_new3 = spot_new - error / 2.0;
    vec2 vel_2 = texture2D(velocity, spot_new3).xy;
    vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
    vec2 newVel2 = texture2D(velocity, spot_old2).xy;
    gl_FragColor = vec4(newVel2, 0.0, 0.0);
  }
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
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
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
  viscousFrag: `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D velocity_new;
uniform float v;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  vec2 old = texture2D(velocity, uv).xy;
  vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
  vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
  vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
  vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
  vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
  newv /= 4.0 * (1.0 + v * dt);
  gl_FragColor = vec4(newv, 0.0, 0.0);
}
`,
};

const options = {
  mouseForce: 20,
  cursorSize: 100,
  isViscous: false,
  viscous: 30,
  iterationsViscous: 32,
  iterationsPoisson: 32,
  dt: 0.014,
  BFECC: true,
  resolution: 0.4,
  resolutionMobile: 0.42,
  resolutionMinDim: 256,
  resolutionMaxDim: 2048,
  isBounce: false,
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
    this.time = 0;
    this.delta = 0;
    this.container = null;
    this.renderer = null;
    this.clock = null;
  }

  init(container, existingCanvas) {
    this.container = container;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    this.resize();
    this.renderer = new THREE.WebGLRenderer({
      canvas: existingCanvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    const el = this.renderer.domElement;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    this.clock = new THREE.Clock();
    this.clock.start();
  }

  resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.aspect = this.width / this.height;
    if (this.renderer) this.renderer.setSize(this.width, this.height, false);
  }

  update() {
    if (!this.clock) return;
    this.delta = this.clock.getDelta();
    this.time += this.delta;
  }
}

class MouseClass {
  constructor() {
    this.mouseMoved = false;
    this.coords = new THREE.Vector2();
    this.coordsOld = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.timer = null;
    this.container = null;
    this.isHoverInside = false;
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
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);
  }

  init(container) {
    this.container = container;
    window.addEventListener("mousemove", this.onMouseMove, { passive: true });
    window.addEventListener("touchstart", this.onTouchStart, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: true });
    window.addEventListener("touchend", this.onTouchEnd);
  }

  dispose() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
  }

  setCoords(x, y) {
    if (!this.container) return;
    if (this.timer) window.clearTimeout(this.timer);
    const rect = this.container.getBoundingClientRect();
    const nx = (x - rect.left) / rect.width;
    const ny = (y - rect.top) / rect.height;
    this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
    this.isHoverInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    this.mouseMoved = true;
    this.timer = window.setTimeout(() => {
      this.mouseMoved = false;
    }, 100);
  }

  setNormalized(nx, ny) {
    this.coords.set(nx, ny);
    this.mouseMoved = true;
  }

  handleMouseMove(event) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) {
      this.isHoverInside = false;
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
      this.setCoords(event.clientX, event.clientY);
      this.hasUserControl = true;
    }
    if (this.onInteract) this.onInteract();
  }

  handleTouchStart(event) {
    if (!event.touches || event.touches.length !== 1 || !this.container) return;
    const t = event.touches[0];
    this.setCoords(t.pageX, t.pageY);
    this.hasUserControl = true;
    if (this.onInteract) this.onInteract();
  }

  handleTouchMove(event) {
    if (!event.touches || event.touches.length !== 1 || !this.container) return;
    const t = event.touches[0];
    this.setCoords(t.pageX, t.pageY);
    this.hasUserControl = true;
    if (this.onInteract) this.onInteract();
  }

  handleTouchEnd() {
    this.isHoverInside = false;
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

class ShaderPass {
  constructor(common, props) {
    this.common = common;
    this.props = props || {};
    this.uniforms = this.props.material ? this.props.material.uniforms : null;
    this.scene = null;
    this.camera = null;
    this.material = null;
    this.geometry = null;
    this.plane = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    if (this.uniforms) {
      this.material = new THREE.RawShaderMaterial(this.props.material);
      this.geometry = new THREE.PlaneGeometry(2, 2);
      this.plane = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.plane);
    }
  }

  update() {
    if (!this.common.renderer || !this.scene || !this.camera) return;
    this.common.renderer.setRenderTarget(this.props.output || null);
    this.common.renderer.render(this.scene, this.camera);
    this.common.renderer.setRenderTarget(null);
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
          isBFECC: { value: true },
        },
      },
      output: simProps.dst,
    });
    this.line = null;
    this.init();
  }

  init() {
    super.init();
    const boundaryG = new THREE.BufferGeometry();
    boundaryG.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([-1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0]),
        3
      )
    );
    const boundaryM = new THREE.RawShaderMaterial({
      vertexShader: shaders.lineVert,
      fragmentShader: shaders.advectionFrag,
      uniforms: this.uniforms,
    });
    this.line = new THREE.LineSegments(boundaryG, boundaryM);
    this.scene.add(this.line);
  }

  update(opts) {
    if (!this.uniforms) return;
    const p = opts || {};
    if (typeof p.dt === "number") this.uniforms.dt.value = p.dt;
    if (typeof p.isBounce === "boolean") this.line.visible = p.isBounce;
    if (typeof p.BFECC === "boolean") this.uniforms.isBFECC.value = p.BFECC;
    super.update();
  }
}

class ExternalForce extends ShaderPass {
  constructor(common, simProps, mouse) {
    super(common, { output: simProps.dst });
    this.mouseState = mouse;
    this.mouse = null;
    super.init();
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
    this.scene.add(this.mouse);
  }

  update(props) {
    const p = props || {};
    const forceX = (this.mouseState.diff.x / 2) * (p.mouseForce || 0);
    const forceY = (this.mouseState.diff.y / 2) * (p.mouseForce || 0);
    const cellScale = p.cellScale || new THREE.Vector2(1, 1);
    const cursorSize = p.cursorSize || 0;

    const cursorSizeX = cursorSize * cellScale.x;
    const cursorSizeY = cursorSize * cellScale.y;
    const centerX = Math.min(Math.max(this.mouseState.coords.x, -1 + cursorSizeX + cellScale.x * 2), 1 - cursorSizeX - cellScale.x * 2);
    const centerY = Math.min(Math.max(this.mouseState.coords.y, -1 + cursorSizeY + cellScale.y * 2), 1 - cursorSizeY - cellScale.y * 2);

    const uniforms = this.mouse.material.uniforms;
    uniforms.force.value.set(forceX, forceY);
    uniforms.center.value.set(centerX, centerY);
    uniforms.scale.value.set(cursorSize, cursorSize);
    super.update();
  }
}

class Viscous extends ShaderPass {
  constructor(common, simProps) {
    super(common, {
      material: {
        vertexShader: shaders.faceVert,
        fragmentShader: shaders.viscousFrag,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          velocity_new: { value: simProps.dstAux.texture },
          v: { value: simProps.viscous },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt },
        },
      },
      output: simProps.dst,
      output0: simProps.dstAux,
      output1: simProps.dst,
    });
    this.init();
  }

  update(opts) {
    if (!this.uniforms) return null;
    const p = opts || {};
    if (typeof p.viscous === "number") this.uniforms.v.value = p.viscous;

    let fboIn = null;
    let fboOut = null;
    const iter = p.iterations || 0;
    for (let i = 0; i < iter; i += 1) {
      if (i % 2 === 0) {
        fboIn = this.props.output0;
        fboOut = this.props.output1;
      } else {
        fboIn = this.props.output1;
        fboOut = this.props.output0;
      }
      this.uniforms.velocity_new.value = fboIn.texture;
      this.props.output = fboOut;
      if (typeof p.dt === "number") this.uniforms.dt.value = p.dt;
      super.update();
    }
    return fboOut;
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

  update(opts) {
    if (this.uniforms && opts && opts.vel) {
      this.uniforms.velocity.value = opts.vel.texture;
    }
    super.update();
  }
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
      output0: simProps.dstAux,
      output1: simProps.dst,
    });
    this.init();
  }

  update(opts) {
    let pIn = null;
    let pOut = null;
    const iter = (opts && opts.iterations) || 0;
    for (let i = 0; i < iter; i += 1) {
      if (i % 2 === 0) {
        pIn = this.props.output0;
        pOut = this.props.output1;
      } else {
        pIn = this.props.output1;
        pOut = this.props.output0;
      }
      if (this.uniforms && pIn) this.uniforms.pressure.value = pIn.texture;
      this.props.output = pOut;
      super.update();
    }
    return pOut;
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

  update(opts) {
    if (this.uniforms && opts && opts.vel && opts.pressure) {
      this.uniforms.velocity.value = opts.vel.texture;
      this.uniforms.pressure.value = opts.pressure.texture;
    }
    super.update();
  }
}

class Simulation {
  constructor(common, mouse, opts) {
    this.common = common;
    this.mouse = mouse;
    this.options = Object.assign(
      {
        iterations_poisson: 32,
        iterations_viscous: 32,
        mouse_force: 20,
        resolution: 0.5,
        resolutionMaxDim: 2048,
        resolutionMinDim: 256,
        cursor_size: 100,
        viscous: 30,
        isBounce: false,
        dt: 0.014,
        isViscous: false,
        BFECC: true,
      },
      opts || {}
    );

    this.fbos = {
      vel_0: null,
      vel_1: null,
      vel_viscous0: null,
      vel_viscous1: null,
      div: null,
      pressure_0: null,
      pressure_1: null,
    };

    this.fboSize = new THREE.Vector2();
    this.cellScale = new THREE.Vector2();
    this.boundarySpace = new THREE.Vector2();

    this.advection = null;
    this.externalForce = null;
    this.viscous = null;
    this.divergence = null;
    this.poisson = null;
    this.pressure = null;

    this.init();
  }

  getFloatType() {
    const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
    return isIOS ? THREE.HalfFloatType : THREE.FloatType;
  }

  calcSize() {
    const dpr = this.common.pixelRatio || 1;
    const baseW = this.options.resolution * this.common.width * dpr;
    const baseH = this.options.resolution * this.common.height * dpr;
    const isSmallViewport = Math.min(this.common.width, this.common.height) < 768;

    const minDim = this.options.resolutionMinDim || (isSmallViewport ? 256 : 384);
    const maxDim = this.options.resolutionMaxDim || 2048;
    const width = Math.min(maxDim, Math.max(minDim, Math.round(baseW)));
    const height = Math.min(maxDim, Math.max(minDim, Math.round(baseH)));

    this.cellScale.set(1 / width, 1 / height);
    this.fboSize.set(width, height);
  }

  createAllFBO() {
    const type = this.getFloatType();
    const opts = {
      type,
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
        cursorSize: this.options.cursor_size,
        dst: this.fbos.vel_1,
      },
      this.mouse
    );

    this.viscous = new Viscous(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      viscous: this.options.viscous,
      src: this.fbos.vel_1,
      dst: this.fbos.vel_viscous1,
      dstAux: this.fbos.vel_viscous0,
      dt: this.options.dt,
    });

    this.divergence = new Divergence(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.vel_viscous0,
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
      srcVelocity: this.fbos.vel_viscous0,
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
    if (this.options.isBounce) this.boundarySpace.set(0, 0);
    else this.boundarySpace.copy(this.cellScale);

    this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC });
    this.externalForce.update({
      cursorSize: this.options.cursor_size,
      mouseForce: this.options.mouse_force,
      cellScale: this.cellScale,
    });

    let vel = this.fbos.vel_1;
    if (this.options.isViscous) {
      vel = this.viscous.update({
        viscous: this.options.viscous,
        iterations: this.options.iterations_viscous,
        dt: this.options.dt,
      });
    }

    this.divergence.update({ vel });
    const pressure = this.poisson.update({ iterations: this.options.iterations_poisson });
    this.pressure.update({ vel, pressure });
  }
}

class Output {
  constructor(common, mouse, simOptions) {
    this.common = common;
    this.mouse = mouse;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    this.paletteTexture = null;
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

    this.output = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.output);
    this.updateThemePalette();
  }

  updateThemePalette() {
    const dark = root.classList.contains("dark");
    const colors = dark
      ? [
          cssColorHex("--color-primary-200", [147, 197, 253]),
          cssColorHex("--color-primary-300", [96, 165, 250]),
          cssColorHex("--color-primary-400", [59, 130, 246]),
        ]
      : [
          cssColorHex("--color-primary-100", [191, 219, 254]),
          cssColorHex("--color-primary-100", [147, 197, 253]),
        ];

    const tex = makePaletteTexture(colors);
    if (this.paletteTexture) this.paletteTexture.dispose();
    this.paletteTexture = tex;
    this.material.uniforms.palette.value = tex;

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
    if (!this.common.renderer) return;
    this.common.renderer.setRenderTarget(null);
    this.common.renderer.render(this.scene, this.camera);
  }

  update() {
    this.simulation.update();
    this.render();
  }

  dispose() {
    if (this.paletteTexture) this.paletteTexture.dispose();
  }
}

class LiquidEtherManager {
  constructor(container, canvasEl) {
    this.common = new CommonClass();
    this.mouse = new MouseClass();
    this.output = null;
    this.autoDriver = null;
    this.lastUserInteraction = performance.now();
    this.running = false;
    this.frameIntervalMs = options.maxFPS > 0 ? 1000 / options.maxFPS : 0;
    this.lastFrameTime = 0;
    this.raf = 0;

    this.onResize = this.resize.bind(this);
    this.onVisibility = this.handleVisibility.bind(this);
    this.loop = this.loop.bind(this);

    this.common.init(container, canvasEl);
    this.mouse.init(container);
    this.mouse.autoIntensity = options.autoIntensity;
    this.mouse.takeoverDuration = options.takeoverDuration;
    this.mouse.onInteract = () => {
      this.lastUserInteraction = performance.now();
      if (this.autoDriver) this.autoDriver.forceStop();
    };

    this.output = new Output(this.common, this.mouse, {
      iterations_poisson: options.iterationsPoisson,
      iterations_viscous: options.iterationsViscous,
      mouse_force: options.mouseForce,
      resolution:
        Math.min(window.innerWidth, window.innerHeight) < 768 && typeof options.resolutionMobile === "number"
          ? options.resolutionMobile
          : options.resolution,
      resolutionMaxDim: options.resolutionMaxDim,
      resolutionMinDim: options.resolutionMinDim,
      cursor_size: options.cursorSize,
      viscous: options.viscous,
      isBounce: options.isBounce,
      dt: options.dt,
      isViscous: options.isViscous,
      BFECC: options.BFECC,
    });

    this.autoDriver = new AutoDriver(this.mouse, this, {
      enabled: options.autoDemo,
      speed: options.autoSpeed,
      resumeDelay: options.autoResumeDelay,
      rampDuration: options.autoRampDuration,
    });

    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  resize() {
    this.common.resize();
    if (this.output) this.output.resize();
  }

  handleVisibility() {
    if (document.hidden) this.pause();
    else this.start();
  }

  render() {
    if (this.autoDriver) this.autoDriver.update();
    this.mouse.update();
    this.common.update();
    if (this.output) this.output.update();
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    if (this.frameIntervalMs > 0 && this.lastFrameTime > 0) {
      const elapsed = now - this.lastFrameTime;
      if (elapsed < this.frameIntervalMs) {
        this.raf = requestAnimationFrame(this.loop);
        return;
      }
    }

    this.lastFrameTime = now;
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  }

  start() {
    if (this.running || reducedMotion.matches) return;
    this.running = true;
    this.loop();
  }

  pause() {
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  refreshTheme() {
    if (this.output) this.output.updateThemePalette();
  }

  dispose() {
    this.pause();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
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

const observer = new MutationObserver(() => {
  manager.refreshTheme();
});
observer.observe(root, { attributes: true, attributeFilter: ["class"] });

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) manager.pause();
  else manager.start();
});
