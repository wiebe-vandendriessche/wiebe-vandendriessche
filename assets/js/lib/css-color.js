// CSS custom property -> colour, shared by both effects.
//
// `style` is a caller-supplied CSSStyleDeclaration so a caller that needs several
// variables reads getComputedStyle ONCE. threejs-hero previously called it five
// times per theme change, once per variable.
//
// Deliberately imports nothing from three: callers pass the target object in, which
// keeps this module out of any dependency graph it does not belong in.

/** Parse a "r, g, b" custom property into a 0-255 triplet. */
export function readTriplet(style, varName, fallback) {
  const raw = style.getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const parts = raw.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return fallback;
  return [parts[0], parts[1], parts[2]];
}

export function tripletToHex([r, g, b]) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
}

/** Write a triplet into a caller-owned THREE.Color, allocating nothing. */
export function applyTriplet(target, triplet) {
  return target.setHex(tripletToHex(triplet));
}
