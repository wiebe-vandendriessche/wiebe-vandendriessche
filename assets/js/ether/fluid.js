import {
  AdditiveBlending,
  Camera,
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  Vector2,
  Vector4,
  WebGLRenderTarget,
} from "three";
import { ETHER_INK } from "./palette.js";

// Stable-fluids solver ported from reactbits' LiquidEther, with its defaults.
// Dropped: the viscous and bounce paths (both off by default in reactbits).
// Changed: /dt in divergence and *dt in pressure are removed. They cancel exactly,
// and without them the pressure warm-start does not depend on the (now variable) dt.
const OPTIONS = { mouseForce: 20, cursorSize: 100, iterations: 32, resolution: 0.5 };

const faceVert = `
attribute vec3 position;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
  vec3 pos = position;
  pos.xy *= 1.0 - boundarySpace * 2.0;
  uv = vec2(0.5) + pos.xy * 0.5;
  gl_Position = vec4(pos, 1.0);
}`;

const mouseVert = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy * scale * 2.0 * px + center, 0.0, 1.0);
}`;

// BFECC advection (reactbits default).
const advectionFrag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 fboSize;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  vec2 spotOld = uv - texture2D(velocity, uv).xy * dt * ratio;
  vec2 spotNew2 = spotOld + texture2D(velocity, spotOld).xy * dt * ratio;
  vec2 spotNew3 = uv - (spotNew2 - uv) / 2.0;
  vec2 spotOld2 = spotNew3 - texture2D(velocity, spotNew3).xy * dt * ratio;
  gl_FragColor = vec4(texture2D(velocity, spotOld2).xy, 0.0, 0.0);
}`;

const forceFrag = `
precision highp float;
uniform vec2 force;
varying vec2 vUv;
void main(){
  float d = 1.0 - min(length((vUv - 0.5) * 2.0), 1.0);
  gl_FragColor = vec4(force * d * d, 0.0, 1.0);
}`;

const divergenceFrag = `
precision highp float;
uniform sampler2D velocity;
uniform vec2 px;
varying vec2 uv;
void main(){
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  gl_FragColor = vec4((x1 - x0 + y1 - y0) / 2.0);
}`;

const poissonFrag = `
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
  gl_FragColor = vec4((p0 + p1 + p2 + p3) / 4.0 - texture2D(divergence, uv).r);
}`;

const pressureFrag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 v = texture2D(velocity, uv).xy - vec2(p0 - p1, p2 - p3) * 0.5;
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

const compositeFrag = `
precision highp float;
${ETHER_INK}
uniform vec4 bgColor;
uniform float strength;
varying vec2 uv;
void main(){
  float lenv;
  vec3 ink = etherInk(uv, lenv);
  float k = lenv * strength;
  gl_FragColor = vec4(mix(bgColor.rgb, ink, k), mix(bgColor.a, 1.0, k));
}`;

export function createFluid(renderer, pointer, shared) {
  // HalfFloat, not reactbits' Float: blending the force pass into RGBA32F needs
  // EXT_float_blend, which some Android GPUs lack, and half-float halves bandwidth.
  const target = () =>
    new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      depthBuffer: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
    });
  const vel0 = target();
  const vel1 = target();
  const div = target();
  let pRead = target();
  let pWrite = target();

  // Shared Vector2 instances: many uniforms hold these objects, so always mutate
  // them in place.
  const cell = new Vector2();
  const fboSize = new Vector2();

  const scene = new Scene();
  const camera = new Camera();
  const quad = new Mesh(new PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  const pass = (fragmentShader, uniforms, extra) =>
    new RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader,
      uniforms: { boundarySpace: { value: cell }, px: { value: cell }, ...uniforms },
      depthTest: false,
      depthWrite: false,
      ...extra,
    });
  const draw = (material, out) => {
    quad.material = material;
    renderer.setRenderTarget(out);
    renderer.render(scene, camera);
  };

  const advection = pass(advectionFrag, {
    velocity: { value: vel0.texture },
    dt: { value: 0 },
    fboSize: { value: fboSize },
  });
  const divergence = pass(divergenceFrag, { velocity: { value: vel1.texture } });
  const poisson = pass(poissonFrag, { pressure: { value: null }, divergence: { value: div.texture } });
  const pressure = pass(pressureFrag, { pressure: { value: null }, velocity: { value: vel1.texture } });

  // reactbits' composite is transparent: normal blending multiplies by alpha a second
  // time, so over the cleared buffer the canvas holds ink * lenv^2 with alpha lenv.
  // That squared falloff is part of the dark-mode look; keep the material as is.
  shared.uFluid.value = vel0.texture;
  const composite = new RawShaderMaterial({
    vertexShader: faceVert,
    fragmentShader: compositeFrag,
    uniforms: {
      ...shared,
      boundarySpace: { value: new Vector2() },
      bgColor: { value: new Vector4() },
      strength: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  // The cursor splat is a small positioned quad, not the fullscreen one.
  const forceScene = new Scene();
  const splat = new Mesh(
    new PlaneGeometry(1, 1),
    new RawShaderMaterial({
      vertexShader: mouseVert,
      fragmentShader: forceFrag,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        px: { value: cell },
        force: { value: new Vector2() },
        center: { value: new Vector2() },
        scale: { value: new Vector2(OPTIONS.cursorSize, OPTIONS.cursorSize) },
      },
    })
  );
  splat.frustumCulled = false;
  forceScene.add(splat);

  return {
    resize(width, height) {
      const w = Math.max(1, Math.round(OPTIONS.resolution * width));
      const h = Math.max(1, Math.round(OPTIONS.resolution * height));
      cell.set(1 / w, 1 / h);
      fboSize.set(w, h);
      for (const t of [vel0, vel1, div, pRead, pWrite]) t.setSize(w, h);
    },

    step(dt) {
      advection.uniforms.dt.value = dt;
      draw(advection, vel1);

      // Keep the splat fully inside the grid, as reactbits does.
      const u = splat.material.uniforms;
      const sx = OPTIONS.cursorSize * cell.x + cell.x * 2;
      const sy = OPTIONS.cursorSize * cell.y + cell.y * 2;
      u.force.value.set((pointer.diff.x / 2) * OPTIONS.mouseForce, (pointer.diff.y / 2) * OPTIONS.mouseForce);
      u.center.value.set(
        Math.min(Math.max(pointer.coords.x, -1 + sx), 1 - sx),
        Math.min(Math.max(pointer.coords.y, -1 + sy), 1 - sy)
      );
      renderer.setRenderTarget(vel1);
      renderer.render(forceScene, camera);

      draw(divergence, div);
      // Jacobi, warm-started from last frame's pressure (never cleared). An even
      // iteration count leaves the result in pRead.
      for (let i = 0; i < OPTIONS.iterations; i++) {
        poisson.uniforms.pressure.value = pRead.texture;
        draw(poisson, pWrite);
        [pRead, pWrite] = [pWrite, pRead];
      }
      pressure.uniforms.pressure.value = pRead.texture;
      draw(pressure, vel0);
    },

    setTheme({ background, strength }) {
      composite.uniforms.bgColor.value = background;
      composite.uniforms.strength.value = strength;
    },

    composite() {
      draw(composite, null);
    },
  };
}
