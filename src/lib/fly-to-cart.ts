// Animates a small "package" flying from the add-to-cart button to the
// header's cart icon (id="cart-icon-target"), landing as a purely visual
// flourish — the cart state itself is unaffected. Uses the native Web
// Animations API instead of a library: one element, one animate() call.
export function flyToCart(originEl: Element) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.getElementById("cart-icon-target");
  if (!target) return;

  const originRect = originEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const originX = originRect.left + originRect.width / 2;
  const originY = originRect.top + originRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  const midX = (originX + targetX) / 2;
  const arcLift = Math.min(160, Math.abs(targetY - originY) + 80);

  const el = document.createElement("div");
  el.textContent = "📦";
  el.style.cssText =
    "position:fixed;left:0;top:0;font-size:28px;line-height:1;pointer-events:none;z-index:60;will-change:transform,opacity;";
  document.body.appendChild(el);

  const animation = el.animate(
    [
      { transform: `translate(${originX}px, ${originY}px) translate(-50%, -50%) scale(1) rotate(0deg)`, opacity: 1 },
      {
        transform: `translate(${midX}px, ${Math.min(originY, targetY) - arcLift}px) translate(-50%, -50%) scale(1.15) rotate(25deg)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${targetX}px, ${targetY}px) translate(-50%, -50%) scale(0.2) rotate(55deg)`,
        opacity: 0,
      },
    ],
    { duration: 650, easing: "cubic-bezier(.3,.6,.35,1)" }
  );

  animation.onfinish = () => el.remove();
  animation.oncancel = () => el.remove();
}
