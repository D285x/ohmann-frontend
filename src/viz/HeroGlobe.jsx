import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createStage, dottedEarth, latLonToVec3, starField, dotTexture, prefersReducedMotion } from './sceneKit.js';

/** Great-circle arc lifted above the surface, from a to b. */
function arcCurve(a, b) {
  const va = latLonToVec3(a[0], a[1], 1);
  const vb = latLonToVec3(b[0], b[1], 1);
  const angle = va.angleTo(vb);
  const lift = 1 + 0.06 + angle * 0.12;
  const mid = va.clone().add(vb).normalize().multiplyScalar(lift);
  const c1 = va.clone().lerp(mid, 0.5).normalize().multiplyScalar(lift * 0.95);
  const c2 = vb.clone().lerp(mid, 0.5).normalize().multiplyScalar(lift * 0.95);
  return new THREE.CubicBezierCurve3(va, c1, c2, vb);
}

const ARC_COLORS = [0x64d2ff, 0xbf5af2, 0xff375f, 0x30d158];

/**
 * Landing-page globe: dotted continents, launch sites with pulsing markers and
 * animated arcs between them, plus a satellite on an inclined orbit.
 */
export default function HeroGlobe({ sites = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const stage = createStage(el, { fov: 35, controls: true });
    const { scene, camera, controls } = stage;
    camera.position.set(0, 0.7, 4.6);
    controls.enableZoom = false;
    controls.autoRotate = !prefersReducedMotion();
    controls.autoRotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;

    scene.add(new THREE.AmbientLight(0x8899ff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-3, 2, 4);
    scene.add(key);
    scene.add(starField(1200, 40));

    const globe = new THREE.Group();
    globe.rotation.z = 23.4 * Math.PI / 180;
    globe.add(dottedEarth());
    scene.add(globe);

    // launch-site markers
    const coords = sites.map((s) => [s.latitudeDeg, s.longitudeDeg]);
    const ringTex = dotTexture('rgba(92,200,255,1)', 'rgba(92,200,255,0)');
    const pulses = coords.map((c, i) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ringTex, color: ARC_COLORS[i % ARC_COLORS.length], transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      sprite.position.copy(latLonToVec3(c[0], c[1], 1.01));
      sprite.userData.phase = i * 0.7;
      globe.add(sprite);
      return sprite;
    });

    // arcs between every pair of neighbouring sites, drawn progressively
    const arcs = [];
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        if (arcs.length >= 10) break;
        const curve = arcCurve(coords[i], coords[j]);
        const geo = new THREE.TubeGeometry(curve, 64, 0.004, 6, false);
        const mat = new THREE.MeshBasicMaterial({
          color: ARC_COLORS[arcs.length % ARC_COLORS.length], transparent: true, opacity: 0.9,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { total: geo.index.count, offset: arcs.length * 0.9 };
        globe.add(mesh);
        arcs.push(mesh);
      }
    }

    // satellite on an inclined circular orbit
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.set(0.9, 0, 0.35);
    const orbitR = 1.3;
    const ringPts = [];
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(t) * orbitR, 0, Math.sin(t) * orbitR));
    }
    orbitGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineDashedMaterial({ color: 0x8aa2ff, dashSize: 0.04, gapSize: 0.04, transparent: true, opacity: 0.5 }),
    ).computeLineDistances());
    const sat = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture('rgba(255,255,255,1)', 'rgba(177,140,255,0)'), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sat.scale.setScalar(0.09);
    orbitGroup.add(sat);
    scene.add(orbitGroup);

    const still = prefersReducedMotion();
    stage.loop((dt, t) => {
      const time = still ? 2 : t;
      pulses.forEach((p) => {
        const k = ((time * 0.8 + p.userData.phase) % 2) / 2;
        p.scale.setScalar(0.04 + k * 0.12);
        p.material.opacity = 1 - k;
      });
      arcs.forEach((a) => {
        const cycle = ((time + a.userData.offset) % 6) / 6; // 0..1
        const grow = Math.min(1, cycle * 2.5);
        const shrink = Math.max(0, (cycle - 0.6) * 2.5);
        const start = Math.floor(shrink * a.userData.total / 6) * 6;
        const end = Math.floor(grow * a.userData.total / 6) * 6;
        a.geometry.setDrawRange(start, Math.max(0, end - start));
      });
      const ang = time * 0.35;
      sat.position.set(Math.cos(ang) * orbitR, 0, Math.sin(ang) * orbitR);
    });

    return stage.dispose;
  }, [sites]);

  return <div ref={ref} className="hero-globe" aria-label="Rotating globe showing launch sites" role="img" />;
}
