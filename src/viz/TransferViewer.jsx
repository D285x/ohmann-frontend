import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause } from '../components/Icons.jsx';
import { createStage, starField, dotTexture, label, julianDate, J2000_JD, DEG } from './sceneKit.js';

const MU_SUN = 1.32712440018e20; // m^3/s^2
const AU = 1.495978707e11;
const DAY = 86400;
const PAD_DAYS = 45;

/** Distances are shown on a square-root scale so inner and outer orbits fit together. */
const scaleR = (au) => Math.sqrt(au) * 3;

const toScene = (angleDeg, au) => {
  const a = angleDeg * DEG;
  const r = scaleR(au);
  return new THREE.Vector3(r * Math.cos(a), 0, -r * Math.sin(a));
};

const meanLongitude = (body, jd) => body.meanLongitudeJ2000Deg + (360 / body.orbitalPeriodDays) * (jd - J2000_JD);

/** Solves Kepler's equation M = E - e sin E by Newton iteration. */
function eccentricAnomaly(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 30; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

/**
 * Builds a function giving the spacecraft's heliocentric longitude, distance and speed
 * at any time during a Hohmann transfer between two circular orbits.
 */
function hohmannState(origin, dest, departureMs) {
  const r1 = origin.semiMajorAxisAu * AU;
  const r2 = dest.semiMajorAxisAu * AU;
  const a = (r1 + r2) / 2;
  const e = Math.abs(r2 - r1) / (r2 + r1);
  const n = Math.sqrt(MU_SUN / a ** 3);
  const outward = r2 > r1;
  const lonDep = meanLongitude(origin, julianDate(departureMs));
  return (ms) => {
    const dt = (ms - departureMs) / 1000;
    const M = (outward ? 0 : Math.PI) + n * dt;
    const E = eccentricAnomaly(M, e);
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const r = a * (1 - e * Math.cos(E));
    const swept = (nu - (outward ? 0 : Math.PI)) / DEG;
    const speed = Math.sqrt(MU_SUN * (2 / r - 1 / a));
    return { lon: lonDep + swept, au: r / AU, speed };
  };
}

const planetColor = (name) => ({
  mercury: 0xb7b0a8, venus: 0xf2c46d, earth: 0x5cc8ff, mars: 0xff7a55, jupiter: 0xe0b98a,
  saturn: 0xf0d58c, uranus: 0x8fe3e8, neptune: 0x5b7cff,
}[name.toLowerCase()] ?? 0xb18cff);

const fmtDate = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Animated view of the transfer: all bodies move on their orbits in real calendar time,
 * the spacecraft follows the Hohmann ellipse between departure and arrival.
 */
export default function TransferViewer({ bodies, origin, destination, window: win }) {
  const ref = useRef(null);
  const depMs = useMemo(() => Date.parse(win.departureUtc), [win.departureUtc]);
  const arrMs = useMemo(() => Date.parse(win.arrivalUtc), [win.arrivalUtc]);
  const startMs = depMs - PAD_DAYS * DAY * 1000;
  const endMs = arrMs + PAD_DAYS * DAY * 1000;
  const totalDays = (endMs - startMs) / (DAY * 1000);

  const [playing, setPlaying] = useState(true);
  const [daysPerSecond, setDaysPerSecond] = useState(Math.max(10, Math.round(totalDays / 20)));
  const [day, setDay] = useState(0);
  const state = useRef({ day: 0, playing: true, rate: 20 });
  state.current.playing = playing;
  state.current.rate = daysPerSecond;

  const o = bodies.find((b) => b.name === origin);
  const d = bodies.find((b) => b.name === destination);
  const craft = useMemo(() => (o && d ? hohmannState(o, d, depMs) : null), [o, d, depMs]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !o || !d) return undefined;
    const stage = createStage(el, { fov: 40, labels: true });
    const { scene, camera, controls } = stage;
    const outer = scaleR(Math.max(o.semiMajorAxisAu, d.semiMajorAxisAu));
    camera.position.set(0, outer * 1.9, outer * 1.7);
    controls.maxDistance = outer * 6;
    controls.minDistance = 1;
    scene.add(starField(2000, outer * 8));

    // Sun
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    scene.add(sun);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture('rgba(255,200,110,0.9)', 'rgba(255,140,40,0)'), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.setScalar(1.5);
    scene.add(glow);
    const sunLabel = label('Sun', 'viz-label muted');
    sunLabel.position.set(0, 0.45, 0);
    scene.add(sunLabel);

    // orbits and bodies
    const movers = bodies.map((b) => {
      const key = b.name === origin || b.name === destination;
      const ringPts = [];
      for (let i = 0; i <= 256; i++) ringPts.push(toScene((360 * i) / 256, b.semiMajorAxisAu));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({
        color: key ? planetColor(b.name) : 0x3a4f8a, transparent: true, opacity: key ? 0.55 : 0.18,
      })));
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(key ? 0.11 : 0.06, 24, 24),
        new THREE.MeshBasicMaterial({ color: planetColor(b.name) }),
      );
      scene.add(mesh);
      const tag = label(b.name, key ? 'viz-label' : 'viz-label muted');
      mesh.add(tag);
      tag.position.set(0, 0.25, 0);
      return { body: b, mesh };
    });

    // transfer ellipse (half orbit) and spacecraft
    const pathPts = [];
    for (let i = 0; i <= 200; i++) {
      const s = craft(depMs + ((arrMs - depMs) * i) / 200);
      pathPts.push(toScene(s.lon, s.au));
    }
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPts);
    scene.add(new THREE.Line(pathGeo, new THREE.LineDashedMaterial({
      color: 0xb18cff, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.5,
    })).computeLineDistances());
    const trail = new THREE.Line(pathGeo.clone(), new THREE.LineBasicMaterial({ color: 0xff7ac8 }));
    scene.add(trail);

    const ship = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture('rgba(255,255,255,1)', 'rgba(255,122,200,0)'), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    ship.scale.setScalar(0.35);
    scene.add(ship);

    const depMarker = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.19, 40), new THREE.MeshBasicMaterial({
      color: 0x4fd18b, side: THREE.DoubleSide, transparent: true, opacity: 0.8,
    }));
    depMarker.rotation.x = -Math.PI / 2;
    depMarker.position.copy(pathPts[0]);
    scene.add(depMarker);
    const arrMarker = depMarker.clone();
    arrMarker.material = depMarker.material.clone();
    arrMarker.material.color.setHex(0xf7b955);
    arrMarker.position.copy(pathPts[pathPts.length - 1]);
    scene.add(arrMarker);

    let lastUi = 0;
    stage.loop((dt, elapsed) => {
      const st = state.current;
      if (st.playing) {
        st.day += dt * st.rate;
        if (st.day > totalDays) st.day = 0;
      }
      const ms = startMs + st.day * DAY * 1000;
      const jd = julianDate(ms);
      movers.forEach(({ body, mesh }) => mesh.position.copy(toScene(meanLongitude(body, jd), body.semiMajorAxisAu)));

      const inFlight = ms >= depMs && ms <= arrMs;
      ship.visible = inFlight;
      if (ms < depMs) {
        trail.geometry.setDrawRange(0, 0);
      } else {
        const frac = Math.min(1, (ms - depMs) / (arrMs - depMs));
        trail.geometry.setDrawRange(0, Math.floor(frac * 200) + 1);
        if (inFlight) {
          const s = craft(ms);
          ship.position.copy(toScene(s.lon, s.au));
        }
      }
      if (elapsed - lastUi > 0.1) {
        lastUi = elapsed;
        setDay(st.day);
      }
    });
    return stage.dispose;
  }, [bodies, o, d, origin, destination, craft, depMs, arrMs, startMs, totalDays]);

  if (!o || !d || !craft) return null;

  const ms = startMs + day * DAY * 1000;
  let status;
  if (ms < depMs) status = `Launch in ${Math.ceil((depMs - ms) / (DAY * 1000))} days`;
  else if (ms > arrMs) status = `Arrived ${Math.floor((ms - arrMs) / (DAY * 1000))} days ago`;
  else status = `Day ${Math.floor((ms - depMs) / (DAY * 1000))} of ${Math.round(win.timeOfFlightDays)}`;
  const s = ms >= depMs && ms <= arrMs ? craft(ms) : null;

  return (
    <div className="viz-panel">
      <div className="viz-head">
        <div>
          <span className="eyebrow">Orbital simulation</span>
          <h3>{origin} to {destination}</h3>
        </div>
        <div className="viz-legend">
          <span><i style={{ background: '#ff7ac8' }} />Spacecraft path</span>
          <span><i style={{ background: '#4fd18b' }} />Departure</span>
          <span><i style={{ background: '#f7b955' }} />Arrival</span>
        </div>
      </div>
      <div className="viz-canvas tall" ref={ref}>
        <div className="viz-hud">
          <div><span>Date</span><strong>{fmtDate(ms)}</strong></div>
          <div><span>Mission</span><strong>{status}</strong></div>
          <div><span>Sun distance</span><strong>{s ? `${s.au.toFixed(3)} AU` : '-'}</strong></div>
          <div><span>Heliocentric speed</span><strong>{s ? `${(s.speed / 1000).toFixed(2)} km/s` : '-'}</strong></div>
        </div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn play-btn" onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause /> : <Play />}
        </button>
        <input type="range" min={0} max={totalDays} step={1} value={day} aria-label="Mission day"
          onChange={(e) => { state.current.day = Number(e.target.value); setDay(Number(e.target.value)); }} />
        <label className="inline">
          Speed
          <select value={daysPerSecond} onChange={(e) => setDaysPerSecond(Number(e.target.value))}>
            {[5, 10, 20, 40, 80, 160].map((v) => <option key={v} value={v}>{v} days/s</option>)}
            {![5, 10, 20, 40, 80, 160].includes(daysPerSecond) && (
              <option value={daysPerSecond}>{daysPerSecond} days/s</option>
            )}
          </select>
        </label>
        <span className="muted small">Distances on a square-root scale; planets not to size.</span>
      </div>
    </div>
  );
}
