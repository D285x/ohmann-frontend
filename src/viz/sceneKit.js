import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import landDots from '../assets/landDots.json';

export const DEG = Math.PI / 180;
export const EARTH_RADIUS_KM = 6378.137;
export const J2000_JD = 2451545.0;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const julianDate = (ms) => ms / 86400000 + 2440587.5;

/** Geographic or ecliptic coordinates to a Y-up vector. */
export function latLonToVec3(latDeg, lonDeg, r = 1) {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  return new THREE.Vector3(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon));
}

/**
 * Creates renderer, camera, optional orbit controls and label layer inside a container,
 * keeps them sized to the container and returns a dispose function.
 */
export function createStage(container, { fov = 40, controls = true, labels = false, alpha = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 2000);

  let labelRenderer = null;
  if (labels) {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'viz-labels';
    container.appendChild(labelRenderer.domElement);
  }

  let orbit = null;
  if (controls) {
    orbit = new OrbitControls(camera, (labelRenderer ?? renderer).domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.enablePan = false;
  }

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    labelRenderer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let frame = 0;
  let running = true;
  const loop = (fn) => {
    const clock = new THREE.Clock();
    const tick = () => {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      fn?.(dt, clock.elapsedTime);
      orbit?.update();
      renderer.render(scene, camera);
      labelRenderer?.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();
  };

  const dispose = () => {
    running = false;
    cancelAnimationFrame(frame);
    ro.disconnect();
    orbit?.dispose();
    scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    });
    renderer.dispose();
    renderer.domElement.remove();
    labelRenderer?.domElement.remove();
  };

  return { renderer, scene, camera, controls: orbit, loop, dispose };
}

/** Soft round sprite texture drawn on a canvas (no image files needed). */
export function dotTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function starField(count = 1500, radius = 60) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.7 + Math.random() * 0.3));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.25, map: dotTexture(), transparent: true, depthWrite: false, color: 0x9fb4ff, opacity: 0.8,
  });
  return new THREE.Points(geo, mat);
}

/** Fresnel glow shell around a sphere. */
export function atmosphere(radius, color = 0x4f8cff, intensity = 1.0) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) }, intensity: { value: intensity } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
        gl_FragColor = vec4(glowColor, f * intensity);
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), mat);
}

/**
 * Dark Earth sphere with dotted continents, a lat/long grid and an atmosphere,
 * in the style of a data-globe. Radius 1 = Earth's equatorial radius.
 */
export function dottedEarth({ dotColor = 0x7cc4ff, dotSize = 0.018, grid = true } = {}) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x0b1433, emissive: 0x060b1f, shininess: 12, specular: 0x223366 }),
  );
  group.add(body);

  const n = landDots.length / 2;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = latLonToVec3(landDots[2 * i] / 10, landDots[2 * i + 1] / 10, 1.001);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  group.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: dotSize, map: dotTexture(), color: dotColor, transparent: true, depthWrite: false,
    alphaTest: 0.05,
  })));

  if (grid) {
    const mat = new THREE.LineBasicMaterial({ color: 0x3a4f8a, transparent: true, opacity: 0.25 });
    for (let lat = -60; lat <= 60; lat += 30) group.add(circleLine((l) => latLonToVec3(lat, l, 1.002), mat));
    for (let lon = 0; lon < 180; lon += 30) {
      // latitude running past 90 deg wraps onto the opposite meridian, giving a full great circle
      group.add(circleLine((a) => latLonToVec3(a, lon, 1.002), mat));
    }
  }

  group.add(atmosphere(1.12, 0x3d7bff, 0.75));
  return group;
}

function circleLine(fn, material, segments = 128) {
  const pts = [];
  for (let i = 0; i <= segments; i++) pts.push(fn((360 * i) / segments));
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
}

/** Circle of radius r in the plane with the given unit normal. */
export function ringInPlane(normal, r, material, segments = 256) {
  const n = normal.clone().normalize();
  const u = new THREE.Vector3(0, 1, 0).cross(n);
  if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
  u.normalize();
  const v = n.clone().cross(u).normalize();
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(u.clone().multiplyScalar(Math.cos(t) * r).add(v.clone().multiplyScalar(Math.sin(t) * r)));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
}

export function label(text, className = 'viz-label') {
  const div = document.createElement('div');
  div.className = className;
  div.textContent = text;
  return new CSS2DObject(div);
}
