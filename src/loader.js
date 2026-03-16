import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
// loader.js — Black top layer with car SVG cutout, white bottom layer
// Reveals the scene through an expanding car silhouette mask

function getDiamondClipPath(width, height, sizePercent = 6) {
  const aspect = width / height;

  let xOffset = sizePercent;
  let yOffset = sizePercent;

  // Adjust offsets based on aspect ratio
  if (aspect > 1) {
    // wider element
    yOffset = sizePercent * aspect;
  } else {
    // taller element
    xOffset = sizePercent / aspect;
  }

  return `polygon(
    50% ${50 - yOffset}%,
    ${50 + xOffset}% 50%,
    50% ${50 + yOffset}%,
    ${50 - xOffset}% 50%
  )`;
}

export function runLoader(onComplete) {
  const loader = document.querySelector(".loader");
  const main = document.querySelector("main");

  gsap.set(main, {
    opacity: 0,
    clipPath: getDiamondClipPath(innerWidth, innerHeight, 0),
  });

  const { chars } = new SplitText(loader.querySelector("p"), {
    type: "chars",
  });

  const tl = gsap.timeline();

  tl.to(chars, {
    yPercent: 110,
    stagger: 0.01,
  });

  tl.to(main, {
    opacity: 1,
    duration: 0.5,
    ease: "power4.in",
    clipPath: getDiamondClipPath(innerWidth, innerHeight, 100),
    // clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  });

  tl.to(loader, {
    opacity: 0,
  });

  return tl;
}
