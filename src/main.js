import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls, RGBELoader } from "three/examples/jsm/Addons.js";
import { GUI } from "lil-gui";
import {
  AmbientLight,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const THEMES = ["orange", "skyblue"];

const THEME_CONFIG = {
  orange: {
    bloom: { strength: 0.4, radius: 0.65, threshold: 0.1 },
    colorIndices: [7, 4],
  },
  skyblue: {
    bloom: { strength: 0.25, radius: 0.8, threshold: 0.15 },
    colorIndices: [10, 6],
  },
};

const COLORS = [
  "#1A0A2E", // 0
  "#0D0B1E", // 1
  "#0F0A1A", // 2
  "#1C0D0A", // 3
  "#FF6B35", // 4
  "#ce7656", // 5
  "#7B5CFF", // 6
  "#6350b8", // 7
  "#2D0A5E", // 8
  "#8B1A6B", // 9
  "#97B8DF", // 10
  "#bab7a9", // 11
  "#183e6c", // 12
];

const CAR_ANIM = {
  floatAmplitude: 0.3,
  floatSpeed: 0.3,
};

const CAR_ROTATION = {
  x: 0,
  y: -Math.PI / 4,
  z: 0,
};

const LERP_SPEED = 0.75;

// ─── State ────────────────────────────────────────────────────────────────────

let currentThemeIndex = 1; // start on skyblue
let isTransitioning = false;

const mouse = { x: 0, y: 0 };
const targetRotation = { x: 0, y: 0 };

const blobLerp = {
  color1From: new Color(),
  color1To: new Color(),
  color2From: new Color(),
  color2To: new Color(),
  t: 1,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

const canvas = document.querySelector("canvas");

const lil = new GUI();
// const stats = new Stats();
// document.body.appendChild(stats.dom);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071a1f);
scene.fog = new THREE.FogExp2(0x071a1f, 0.06);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000,
);
camera.position.set(4, 2, 0);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ─── Loaders ─────────────────────────────────────────────────────────────────

const Manager = new THREE.LoadingManager(onLoadComplete);
const Draco = new DRACOLoader(Manager);
const GLB = new GLTFLoader(Manager);
const RGBE = new RGBELoader(Manager);
const PMGen = new THREE.PMREMGenerator(renderer);
PMGen.compileEquirectangularShader();

Draco.setDecoderPath("/draco/");
Draco.setDecoderConfig({ type: "wasm" });
GLB.setDRACOLoader(Draco);

// ─── HDRIs ───────────────────────────────────────────────────────────────────

let hdri1, hdri2;

RGBE.load("/hdris/hdri1.hdr", (hdri) => {
  hdri.mapping = THREE.EquirectangularReflectionMapping;
  hdri1 = PMGen.fromEquirectangular(hdri).texture;
  hdri.dispose();
});

RGBE.load("/hdris/hdri2.hdr", (hdri) => {
  hdri.mapping = THREE.EquirectangularReflectionMapping;
  hdri2 = PMGen.fromEquirectangular(hdri).texture;
  hdri.dispose();
});

// ─── Materials ───────────────────────────────────────────────────────────────

const carMaterial1 = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0.2,
  envMapIntensity: 1,
});

const carMaterial2 = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0.2,
  envMapIntensity: 1,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x071a1f,
  metalness: 0.5,
  emissive: 0x071a1f,
  envMapIntensity: 0,
});

// ─── Car Containers ──────────────────────────────────────────────────────────

const Car1Container = new THREE.Group(); // orange theme
const Car2Container = new THREE.Group(); // skyblue theme

Car1Container.rotation.set(CAR_ROTATION.x, CAR_ROTATION.y, CAR_ROTATION.z);
Car2Container.rotation.set(CAR_ROTATION.x, CAR_ROTATION.y, CAR_ROTATION.z);

// Orange starts hidden, skyblue starts visible
Car1Container.visible = false;
Car2Container.visible = true;

scene.add(Car1Container);
scene.add(Car2Container);

// ─── Load Car Models ─────────────────────────────────────────────────────────

GLB.load("/car_body.glb", (glb) => {
  const body1 = glb.scene;
  body1.scale.setScalar(0.01);
  body1.traverse((node) => {
    if (node?.isMesh) node.material = carMaterial1;
  });
  Car1Container.add(body1);

  const body2 = glb.scene.clone();
  body2.scale.setScalar(0.01);
  body2.traverse((node) => {
    if (node?.isMesh) node.material = carMaterial2;
  });
  Car2Container.add(body2);
});

GLB.load("/car_glass.glb", (glb) => {
  const glass1 = glb.scene;
  glass1.scale.setScalar(0.01);
  glass1.traverse((node) => {
    if (node?.isMesh) node.material = glassMaterial;
  });
  Car1Container.add(glass1);

  const glass2 = glb.scene.clone();
  glass2.scale.setScalar(0.01);
  glass2.traverse((node) => {
    if (node?.isMesh) node.material = glassMaterial.clone();
  });
  Car2Container.add(glass2);
});

// ─── Background Blob ─────────────────────────────────────────────────────────

const initIndices = THEME_CONFIG[THEMES[currentThemeIndex]].colorIndices;

const blobGeo = new SphereGeometry(10, 10, 10);
const blobMat = new ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    color1: { value: new Color(COLORS[initIndices[0]]) },
    color2: { value: new Color(COLORS[initIndices[1]]) },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float uTime;

    float random(float x) {
      return fract(sin(x * 127.1) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv - vec2(0.5);
      vec3 color = mix(
        color1,
        color2,
        clamp(abs(uv.y * 0.7 + random(uv.x + uTime * 0.1) * 0.3) * 1.5, 0.0, 1.0)
      );
      gl_FragColor = vec4(color * 0.9, 1.0);
    }
  `,
});

const Blob = new Mesh(blobGeo, blobMat);
scene.add(Blob);

// ─── Postprocessing ──────────────────────────────────────────────────────────

const Composer = new EffectComposer(renderer);
const RenderPass_ = new RenderPass(scene, camera);
const Bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  THEME_CONFIG[THEMES[currentThemeIndex]].bloom.strength,
  THEME_CONFIG[THEMES[currentThemeIndex]].bloom.radius,
  THEME_CONFIG[THEMES[currentThemeIndex]].bloom.threshold,
);
const Afterimg = new AfterimagePass(0.85);

Composer.addPass(RenderPass_);
Composer.addPass(Bloom);
Composer.addPass(Afterimg);

const bloomFolder = lil.addFolder("Bloom");
bloomFolder.add(Bloom, "strength", 0, 2);
bloomFolder.add(Bloom, "radius", 0, 1);
bloomFolder.add(Bloom, "threshold", 0, 1);
lil.close();

// ─── Theme Switch ─────────────────────────────────────────────────────────────

function switchTheme(newIndex) {
  if (newIndex === currentThemeIndex || isTransitioning) return;
  isTransitioning = true;
  switchUI(newIndex)

  const prevIndex = currentThemeIndex;
  currentThemeIndex = newIndex;

  const newConfig = THEME_CONFIG[THEMES[newIndex]];
  const containers = [Car1Container, Car2Container];

  // Swap visibility
  containers[prevIndex].visible = false;
  containers[newIndex].visible = true;

  // Blob color lerp
  blobLerp.color1From.copy(blobMat.uniforms.color1.value);
  blobLerp.color2From.copy(blobMat.uniforms.color2.value);
  blobLerp.color1To.set(COLORS[newConfig.colorIndices[0]]);
  blobLerp.color2To.set(COLORS[newConfig.colorIndices[1]]);
  blobLerp.t = 0;

  // Env map
  scene.environment = newIndex === 0 ? hdri1 : hdri2;
  carMaterial1.envMap = hdri1;
  carMaterial2.envMap = hdri2;

  // Bloom
  Bloom.strength = newConfig.bloom.strength;
  Bloom.radius = newConfig.bloom.radius;
  Bloom.threshold = newConfig.bloom.threshold;

  // isTransitioning unlocks in Animate once blob lerp completes
}

// ─── Scene Init ──────────────────────────────────────────────────────────────

function onLoadComplete() {
  scene.environment = hdri2;
  carMaterial1.envMap = hdri1;
  carMaterial2.envMap = hdri2;

  scene.add(new AmbientLight(0xffffff, 10));

  const spotLight = new THREE.SpotLight(0xffffff, 3, 5, 0.6, 1, 0.2);
  spotLight.position.set(0, 5, 0);
  scene.add(spotLight);

  resize();
  initNav();
}

// ─── Navigation ──────────────────────────────────────────────────────────────

function initNav() {
  const buttons = document.querySelectorAll("nav .nav-link");
  const pill = document.getElementById("pill");
  const container = document.querySelector("nav .nav-links"); // fixed: space before .nav-links

  if (!buttons.length || !pill || !container) return;

  function setPillToBtn(btn) {
    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    pill.style.left = btnRect.left - containerRect.left + "px";
    pill.style.width = btnRect.width + "px";
    pill.style.height = btnRect.height + "px";
  }

  function setActive(btn) {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    setPillToBtn(btn);
    switchTheme(parseInt(btn.dataset.theme ?? "0"));
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => setActive(btn)));

  const firstActive =
    document.querySelector("nav .nav-link.active") ?? buttons[0];
  setActive(firstActive);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ─── Resize ──────────────────────────────────────────────────────────────────

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  Composer.setSize(innerWidth, innerHeight);
}

window.addEventListener("resize", resize);
resize();

// ─── Mouse ───────────────────────────────────────────────────────────────────

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX / innerWidth - 0.5 - 1; // fixed: was (... - 0.5) - 1
  mouse.y = (e.clientY / innerHeight - 0.5) * 2;
});

// ─── Animation Loop ──────────────────────────────────────────────────────────

const clock = new THREE.Clock();

function Animate() {
  // stats.begin();

  const DT = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();

  // Blob time
  blobMat.uniforms.uTime.value = elapsed;

  // Blob color lerp — unlock isTransitioning when done
  if (blobLerp.t < 1) {
    blobLerp.t = Math.min(blobLerp.t + DT * 1.5, 1);
    const et = easeInOut(blobLerp.t);
    blobMat.uniforms.color1.value.lerpColors(
      blobLerp.color1From,
      blobLerp.color1To,
      et,
    );
    blobMat.uniforms.color2.value.lerpColors(
      blobLerp.color2From,
      blobLerp.color2To,
      et,
    );
    if (blobLerp.t >= 1) isTransitioning = false;
  }

  // Float only the active car
  const floatY =
    Math.sin(elapsed * CAR_ANIM.floatSpeed * Math.PI * 2) *
    CAR_ANIM.floatAmplitude;
  const activeContainer =
    currentThemeIndex === 0 ? Car1Container : Car2Container;
  activeContainer.position.y = floatY;

  // Mouse rotation on both containers so orientation is always in sync
  targetRotation.y = lerp(targetRotation.y, mouse.x * 0.4, DT * 3);
  targetRotation.x = lerp(targetRotation.x, mouse.y * 0.15, DT * 3);

  Car1Container.rotation.y = CAR_ROTATION.y + targetRotation.y;
  Car2Container.rotation.y = CAR_ROTATION.y + targetRotation.y;
  Car1Container.rotation.x = CAR_ROTATION.x + targetRotation.x;
  Car2Container.rotation.x = CAR_ROTATION.x + targetRotation.x;

  Composer.render();

  // stats.end();
  requestAnimationFrame(Animate);
}

lil.destroy()

requestAnimationFrame(Animate);
