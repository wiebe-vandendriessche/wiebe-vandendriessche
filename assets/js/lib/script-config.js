// Reads the data-* configuration off a bundle's own <script> tag.
//
// NOTE: document.currentScript is ALWAYS null while a type="module" script is
// evaluating, so the marker-attribute query is the only mechanism -- not a fallback.
// Both entry points used to carry a `document.currentScript || querySelector(...)`
// expression whose left operand could never be truthy.
export function readScriptConfig(markerAttr) {
  const el = document.querySelector(`script[type="module"][${markerAttr}]`);
  if (!el) throw new Error(`${markerAttr}: script tag not found`);
  return el.dataset;
}
