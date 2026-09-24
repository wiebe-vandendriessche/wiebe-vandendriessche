import { ClampToEdgeWrapping, Color, DataTexture, LinearFilter, RGBAFormat, SRGBColorSpace, Vector4 } from "three";

// Three theme blues per mode, ordered slow -> fast flow: deep indigo at rest,
// through a vivid mid blue, to a pale blue where the fluid moves fastest.
const PALETTES = {
  dark: ["--color-primary-900", "--color-primary-500", "--color-primary-200"],
  light: ["--color-primary-900", "--color-primary-600", "--color-primary-300"],
};

// Shared by the fluid composite and the avatar, so the model's rim light is exactly
// the colour the ether shows at that pixel. Light mode uses reactbits' lightMode
// ink: peak-normalised chroma, so colours stay saturated over a pale background.
export const ETHER_INK = /* glsl */ `
uniform sampler2D uFluid;
uniform sampler2D uPalette;
uniform float uLight;
vec3 etherInk(vec2 uv, out float lenv) {
  lenv = clamp(length(texture2D(uFluid, uv).xy), 0.0, 1.0);
  vec3 c = texture2D(uPalette, vec2(lenv, 0.5)).rgb;
  if (uLight > 0.5) c = pow(clamp(c / max(max(c.r, max(c.g, c.b)), 1e-4), 0.0, 1.0), vec3(1.25));
  return c;
}
`;

const cache = {};

const readHex = (style, name) => {
  const [r, g, b] = style.getPropertyValue(name).split(/[\s,]+/).filter(Boolean).map(Number);
  return (r << 16) | (g << 8) | b;
};

export function readPalette(dark) {
  const key = dark ? "dark" : "light";
  if (cache[key]) return cache[key];

  const style = getComputedStyle(document.documentElement);
  // reactbits' colour path, kept on purpose: Color(hex) converts sRGB to linear and
  // the raw bytes go straight to the canvas, so the ether shows the linear value --
  // darker and more saturated than the hex. That is how the example looks.
  const stops = PALETTES[key].map((name) => new Color().setHex(readHex(style, name)));
  const bytes = new Uint8Array(stops.flatMap((c) => [c.r * 255, c.g * 255, c.b * 255, 255].map(Math.round)));
  const texture = new DataTexture(bytes, stops.length, 1, RGBAFormat);
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;

  // Dark: transparent, so the page background shows. Light: the page's own
  // neutral-50 used as the raw display value, so it matches the site exactly.
  const [r, g, b] = style.getPropertyValue("--color-neutral-50").split(/[\s,]+/).filter(Boolean).map(Number);
  const background = dark ? new Vector4(0, 0, 0, 0) : new Vector4(r / 255, g / 255, b / 255, 1);

  // Light colours for the avatar: the colour each stop DISPLAYS as (its linear value
  // shown raw), converted into lighting space, normalised to peak 1 and softened
  // towards white. The palette is all blue, so the key light stays close to white:
  // a blue key light is what turns the peach skin grey and cold. The blue belongs
  // on the rim and in the fluid's bounce light instead.
  const [slow, mid, fast] = stops.map((c) => {
    const l = new Color().setRGB(c.r, c.g, c.b, SRGBColorSpace);
    return l.multiplyScalar(1 / Math.max(l.r, l.g, l.b, 1e-4));
  });
  const white = new Color(1, 1, 1);
  const lights = {
    key: fast.clone().lerp(white, 0.8),
    rim: mid.clone().lerp(white, 0.2),
    fill: slow.clone().lerp(white, 0.5),
  };

  // How much ink covers the background at full flow. reactbits' light mode pushes
  // every colour to full saturation, which is loud over a white page; letting part
  // of the background through keeps it calm.
  const strength = dark ? 1 : 0.55;

  return (cache[key] = { texture, background, lights, strength, light: dark ? 0 : 1 });
}
