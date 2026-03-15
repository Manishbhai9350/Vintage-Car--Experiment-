import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

// ─── Theme Content ────────────────────────────────────────────────────────────

const THEME_CONTENT = {
  0: {
    eyebrow: "Series I — 2025",
    line1: "Inferno",
    line2: "Edition",
    body: "Forged in controlled chaos. The Inferno Edition channels raw thermal energy into every surface — a machine that doesn't just move, it burns.",
    stats: [
      { value: "720", label: "Horsepower" },
      { value: "2.8s", label: "0 – 100 km/h" },
      { value: "340", label: "Top km/h" },
    ],
    tagLabel: "Colorway",
    tagEdition: "Ember & Void",
  },
  1: {
    eyebrow: "Series I — 2025",
    line1: "Glacier",
    line2: "Edition",
    body: "Precision distilled to its purest form. The Glacier Edition embodies stillness at speed — aerodynamic silence wrapped in iridescent cool.",
    stats: [
      { value: "680", label: "Horsepower" },
      { value: "3.1s", label: "0 – 100 km/h" },
      { value: "318", label: "Top km/h" },
    ],
    tagLabel: "Colorway",
    tagEdition: "Arctic & Dusk",
  },
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const els = {
  eyebrowText: document.getElementById("eyebrowText"),
  eyebrowLine: document.querySelector(".eyebrow-line"),
  titleLine1: document.getElementById("titleLine1"),
  titleLine2: document.getElementById("titleLine2"),
  heroBody: document.getElementById("heroBody"),
  stat1Val: document.getElementById("stat1Val"),
  stat1Lab: document.getElementById("stat1Lab"),
  stat2Val: document.getElementById("stat2Val"),
  stat2Lab: document.getElementById("stat2Lab"),
  stat3Val: document.getElementById("stat3Val"),
  stat3Lab: document.getElementById("stat3Lab"),
  tagLabel: document.getElementById("tagLabel"),
  tagEdition: document.getElementById("tagEdition"),
  heroStats: document.getElementById("heroStats"),
  heroLeft: document.getElementById("heroLeft"),
  bottomTag: document.getElementById("bottomTag"),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Wrap each character in a span for per-char animation
function splitChars(el) {
  const text = el.textContent;
  el.innerHTML = text
    .split("")
    .map(
      (ch) =>
        `<span class="char" style="display:inline-block; overflow:hidden;">${ch === " " ? "&nbsp;" : `<span class="char-inner" style="display:inline-block;">${ch}</span>`}</span>`,
    )
    .join("");
  return el.querySelectorAll(".char-inner");
}

// Wrap each word
function splitWords(el) {
  const text = el.textContent;
  el.innerHTML = text
    .split(" ")
    .map(
      (w) =>
        `<span class="word" style="display:inline-block; overflow:hidden; margin-right:0.28em;"><span class="word-inner" style="display:inline-block;">${w}</span></span>`,
    )
    .join("");
  return el.querySelectorAll(".word-inner");
}

// ─── Intro Animation (runs once on load) ─────────────────────────────────────

function introAnimate(index) {
  const content = THEME_CONTENT[index];
  populateContent(content);

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Eyebrow line + text
  tl.fromTo(
    els.eyebrowLine,
    { scaleX: 0 },
    { scaleX: 1, duration: 0.9, transformOrigin: "left" },
    0,
  );
  tl.fromTo(
    els.eyebrowText,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.7 },
    0.3,
  );

  // Title line 1 — chars fly up
  const chars1 = splitChars(els.titleLine1);
  tl.fromTo(
    chars1,
    { y: "110%", opacity: 0 },
    { y: "0%", opacity: 1, duration: 0.9, stagger: 0.03 },
    0.4,
  );

  // Title line 2 — chars fly up with slight delay
  const chars2 = splitChars(els.titleLine2);
  tl.fromTo(
    chars2,
    { y: "110%", opacity: 0 },
    { y: "0%", opacity: 1, duration: 0.9, stagger: 0.03 },
    0.6,
  );

  // Body text — words slide up
  const words = splitWords(els.heroBody);
  tl.fromTo(
    words,
    { y: "100%", opacity: 0 },
    { y: "0%", opacity: 1, duration: 0.7, stagger: 0.04 },
    0.9,
  );

  // Stats — slide up staggered
  const statEls = [
    els.stat1Val,
    els.stat1Lab,
    els.stat2Val,
    els.stat2Lab,
    els.stat3Val,
    els.stat3Lab,
  ];
  tl.fromTo(
    statEls,
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.07 },
    1.1,
  );

  // Bottom tag
  tl.fromTo(
    [els.tagLabel, els.tagEdition],
    { x: 16, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
    1.0,
  );
}

// ─── Transition Animation (on theme switch) ───────────────────────────────────

function switchUI(newIndex) {
  const content = THEME_CONTENT[newIndex];
  const outTl = gsap.timeline({
    defaults: { ease: "power2.in" },
    onComplete: () => inAnimate(content),
  });

  // Title chars slam down
  const chars1 = els.titleLine1.querySelectorAll(".char-inner");
  const chars2 = els.titleLine2.querySelectorAll(".char-inner");

  if (chars1.length) {
    outTl.to(
      chars1,
      { y: "110%", opacity: 0, duration: 0.45, stagger: 0.015 },
      0,
    );
  }
  if (chars2.length) {
    outTl.to(
      chars2,
      { y: "110%", opacity: 0, duration: 0.45, stagger: 0.015 },
      0.05,
    );
  }

  // Body words drop
  const words = els.heroBody.querySelectorAll(".word-inner");
  if (words.length) {
    outTl.to(
      words,
      { y: "100%", opacity: 0, duration: 0.35, stagger: 0.02 },
      0,
    );
  }

  // Stats fade
  outTl.to(
    [
      els.stat1Val,
      els.stat2Val,
      els.stat3Val,
      els.stat1Lab,
      els.stat2Lab,
      els.stat3Lab,
    ],
    { y: -12, opacity: 0, duration: 0.3, stagger: 0.04 },
    0,
  );

  // Tag slide out
  outTl.to(
    [els.tagEdition, els.tagLabel],
    { x: 20, opacity: 0, duration: 0.3 },
    0,
  );

  // Eyebrow
  outTl.to(els.eyebrowText, { opacity: 0, y: -6, duration: 0.3 }, 0);
}

// ─── In Animation (after out completes) ──────────────────────────────────────

function inAnimate(content) {
  populateContent(content);

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Eyebrow
  tl.fromTo(
    els.eyebrowText,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.5 },
    0,
  );

  // Title line 1
  const chars1 = splitChars(els.titleLine1);
  tl.fromTo(
    chars1,
    { y: "-110%", opacity: 0 }, // comes from top this time
    { y: "0%", opacity: 1, duration: 0.8, stagger: 0.025 },
    0.1,
  );

  // Title line 2
  const chars2 = splitChars(els.titleLine2);
  tl.fromTo(
    chars2,
    { y: "-110%", opacity: 0 },
    { y: "0%", opacity: 1, duration: 0.8, stagger: 0.025 },
    0.2,
  );

  // Body words
  const words = splitWords(els.heroBody);
  tl.fromTo(
    words,
    { y: "100%", opacity: 0 },
    { y: "0%", opacity: 1, duration: 0.6, stagger: 0.03 },
    0.45,
  );

  // Stats
  tl.fromTo(
    [
      els.stat1Val,
      els.stat1Lab,
      els.stat2Val,
      els.stat2Lab,
      els.stat3Val,
      els.stat3Lab,
    ],
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
    0.55,
  );

  // Tag
  tl.fromTo(
    [els.tagLabel, els.tagEdition],
    { x: 20, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.55, stagger: 0.1 },
    0.5,
  );
}

// ─── Populate DOM with content ────────────────────────────────────────────────

function populateContent(content) {
  els.eyebrowText.textContent = content.eyebrow;
  els.titleLine1.textContent = content.line1;
  els.titleLine2.textContent = content.line2;
  els.heroBody.textContent = content.body;
  els.stat1Val.textContent = content.stats[0].value;
  els.stat1Lab.textContent = content.stats[0].label;
  els.stat2Val.textContent = content.stats[1].value;
  els.stat2Lab.textContent = content.stats[1].label;
  els.stat3Val.textContent = content.stats[2].value;
  els.stat3Lab.textContent = content.stats[2].label;
  els.tagLabel.textContent = content.tagLabel;
  els.tagEdition.textContent = content.tagEdition;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

// Small delay so Three.js canvas is ready
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => introAnimate(0), 300);
});

// Expose for main.js
window.switchUI = switchUI;
