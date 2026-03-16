import gsap from "gsap";
// loader.js — Black top layer with car SVG cutout, white bottom layer
// Reveals the scene through an expanding car silhouette mask

export function runLoader(onComplete) {
  const silhouette = document.getElementById("car-silhouette");
  const loaderWhite = document.getElementById("loader-white");
  const loader = document.getElementById("loader");
  const pctEl = document.getElementById("loader-pct");

  // Start with car mask tiny
  gsap.set(silhouette, { scale: 0.08, transformOrigin: "50% 50%" });
  gsap.set(loaderWhite, { opacity: 1 });

  const tl = gsap.timeline({
    onComplete: () => {
      // Hide loader entirely and re-enable interaction
      gsap.set(loader, { display: "none" });
      loader.style.pointerEvents = "none";
      onComplete?.();
    },
  });

  // ── 1. Count up percentage label while mask grows ──
  tl.to(
    { val: 0 },
    {
      val: 100,
      duration: 2.2,
      ease: "power1.inOut",
      onUpdate: function () {
        pctEl.textContent = Math.round(this.targets()[0].val);
      },
    },
    0,
  );

  // ── 2. Scale car mask from tiny to massive ──
  tl.to(
    silhouette,
    {
      scale: 28, // big enough to fill any screen
      duration: 2.4,
      ease: "power2.inOut",
      transformOrigin: "50% 50%",
    },
    0,
  );

  // ── 3. At 75% of the mask anim → fade white layer to 0 ──
  tl.to(
    loaderWhite,
    {
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    },
    1.8, // fires at 1.8s into the 2.4s mask anim (~75%)
  );

  // ── 4. Fade the whole black layer out after white is gone ──
  tl.to(
    document.getElementById("loader-black"),
    {
      opacity: 0,
      duration: 0.4,
      ease: "power1.out",
    },
    2.35,
  );

  return tl;
}
