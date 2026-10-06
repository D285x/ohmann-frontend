import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause } from '../components/Icons.jsx';
import {
  createStage, dottedEarth, latLonToVec3, starField, dotTexture, ringInPlane, label, EARTH_RADIUS_KM, DEG,
} from './sceneKit.js';

const STAGE_COLORS = [0x98989d, 0x0a84ff, 0xbf5af2, 0xff375f, 0xff9f0a, 0x30d158, 0x64d2ff];
const SPEEDS = [10, 30, 60, 120];

/** Interpolates the simulated trajectory at time t (seconds). */
function sampleAt(points, t) {
  if (t <= points[0].timeS) return points[0];
  const last = points[points.length - 1];
  if (t >= last.timeS) return last;
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].timeS <= t) lo = mid; else hi = mid;
  }
  const a = points[lo];
  const b = points[hi];
  const f = (t - a.timeS) / (b.timeS - a.timeS || 1);
  const mix = (k) => a[k] + (b[k] - a[k]) * f;
  return {
    timeS: t, altitudeKm: mix('altitudeKm'), downrangeKm: mix('downrangeKm'), velocityMs: mix('velocityMs'),
    dynamicPressureKPa: mix('dynamicPressureKPa'), pitchDeg: mix('pitchDeg'), stage: a.stage,
  };
}

/**
 * 3D playback of a simulated ascent. The planar trajectory is wrapped onto the great circle
 * that leaves the launch site along the launch azimuth; altitude can be exaggerated for visibility.
 */
export default function AscentViewer({ trajectory, siteLat, siteLon, azimuthDeg, targetAltitudeKm, siteName }) {
  const ref = useRef(null);
  const api = useRef({});
  const [exaggeration, setExaggeration] = useState(8);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(30);
  const [time, setTime] = useState(0);

  const points = useMemo(() => trajectory.filter((p) => Number.isFinite(p.altitudeKm)), [trajectory]);
  const duration = points.length ? points[points.length - 1].timeS : 0;
  const playRef = useRef({ playing, speed, time: 0 });
  playRef.current.playing = playing;
  playRef.current.speed = speed;

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length < 2) return undefined;
    const stage = createStage(el, { fov: 38, labels: true });
    const { scene, camera, controls } = stage;
    controls.minDistance = 1.3;
    controls.maxDistance = 8;

    scene.add(new THREE.AmbientLight(0x8899ff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(3, 2, 4);
    scene.add(sun);
    scene.add(starField(1500, 50));
    scene.add(dottedEarth({ dotSize: 0.014 }));

    // local frame at the launch site
    const s = latLonToVec3(siteLat, siteLon, 1).normalize();
    const north = new THREE.Vector3(0, 1, 0).sub(s.clone().multiplyScalar(s.y)).normalize();
    const east = north.clone().cross(s).normalize();
    const az = azimuthDeg * DEG;
    const heading = north.clone().multiplyScalar(Math.cos(az)).add(east.clone().multiplyScalar(Math.sin(az)));

    const position = (p) => {
      const theta = p.downrangeKm / EARTH_RADIUS_KM;
      const r = 1 + (p.altitudeKm * exaggeration) / EARTH_RADIUS_KM;
      return s.clone().multiplyScalar(Math.cos(theta)).add(heading.clone().multiplyScalar(Math.sin(theta)))
        .multiplyScalar(r);
    };

    // trajectory as glowing tubes, one per stage (stage 0 = unpowered coast)
    const verts = points.map(position);
    const cum = [0];
    for (let i = 1; i < verts.length; i++) cum.push(cum[i - 1] + verts[i].distanceTo(verts[i - 1]));
    const runs = [];
    let startIdx = 0;
    for (let i = 1; i < points.length; i++) {
      const isLast = i === points.length - 1;
      if (points[i].stage !== points[startIdx].stage || isLast) {
        runs.push({ from: startIdx, to: i, stage: points[startIdx].stage }); // shares point i so tubes join
        startIdx = i;
      }
    }
    const segments = runs.map((run) => {
      const pts = verts.slice(run.from, run.to + 1);
      if (pts.length < 2) return null;
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const tubular = Math.max(8, pts.length * 3);
      const color = STAGE_COLORS[run.stage % STAGE_COLORS.length];
      const ghost = new THREE.Mesh(
        new THREE.TubeGeometry(curve, tubular, 0.004, 6, false),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }),
      );
      const flownGeo = new THREE.TubeGeometry(curve, tubular, 0.007, 8, false);
      const flown = new THREE.Mesh(flownGeo, new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      scene.add(ghost, flown);
      return {
        flown, perSegment: flownGeo.index.count / tubular, tubular,
        t0: points[run.from].timeS, t1: points[run.to].timeS,
        len0: cum[run.from], len1: cum[run.to],
      };
    }).filter(Boolean);

    const updateTrail = (t) => {
      let idx = 0;
      while (idx < points.length - 1 && points[idx + 1].timeS <= t) idx++;
      const frac = idx < points.length - 1
        ? (t - points[idx].timeS) / ((points[idx + 1].timeS - points[idx].timeS) || 1) : 0;
      const along = cum[idx] + (idx < points.length - 1 ? frac * (cum[idx + 1] - cum[idx]) : 0);
      segments.forEach((sg) => {
        const k = sg.len1 > sg.len0 ? Math.min(1, Math.max(0, (along - sg.len0) / (sg.len1 - sg.len0))) : 0;
        const count = Math.floor(k * sg.tubular) * sg.perSegment;
        sg.flown.geometry.setDrawRange(0, count);
      });
    };

    // launch site marker
    const siteDot = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture('rgba(247,185,85,1)', 'rgba(247,185,85,0)'), transparent: true, depthWrite: false,
    }));
    siteDot.scale.setScalar(0.06);
    siteDot.position.copy(s.clone().multiplyScalar(1.004));
    scene.add(siteDot);
    const siteLabel = label(siteName || 'Launch site');
    siteLabel.position.copy(s.clone().multiplyScalar(1.06));
    scene.add(siteLabel);

    // target orbit ring through the insertion point
    const lastP = points[points.length - 1];
    const theta = lastP.downrangeKm / EARTH_RADIUS_KM;
    const along = s.clone().multiplyScalar(-Math.sin(theta)).add(heading.clone().multiplyScalar(Math.cos(theta)));
    const radial = position(lastP).normalize();
    const normal = radial.clone().cross(along);
    const ringR = 1 + (targetAltitudeKm * exaggeration) / EARTH_RADIUS_KM;
    scene.add(ringInPlane(normal, ringR, new THREE.LineDashedMaterial({
      color: 0x4fd18b, dashSize: 0.03, gapSize: 0.02, transparent: true, opacity: 0.7,
    })).computeLineDistances());

    // vehicle
    const vehicle = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture('rgba(255,255,255,1)', 'rgba(92,200,255,0)'), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    vehicle.scale.setScalar(0.09);
    scene.add(vehicle);

    // camera looks at the middle of the trajectory from above and behind
    const mid = verts[Math.floor(verts.length / 3)].clone().normalize();
    const side = mid.clone().cross(heading).normalize();
    camera.position.copy(mid.clone().multiplyScalar(2.6).add(side.multiplyScalar(1.2)).add(heading.clone().multiplyScalar(-0.4)));
    controls.target.copy(mid.clone().multiplyScalar(0.55));

    const setTimeTo = (t) => {
      playRef.current.time = Math.max(0, Math.min(duration, t));
    };
    api.current.setTime = setTimeTo;

    let lastUi = 0;
    stage.loop((dt, elapsed) => {
      const st = playRef.current;
      if (st.playing) {
        st.time += dt * st.speed;
        if (st.time > duration) st.time = 0;
      }
      const cur = sampleAt(points, st.time);
      vehicle.position.copy(position(cur));
      updateTrail(st.time);
      if (elapsed - lastUi > 0.1) {
        lastUi = elapsed;
        setTime(st.time);
      }
    });

    return () => {
      api.current = {};
      stage.dispose();
    };
  }, [points, siteLat, siteLon, azimuthDeg, targetAltitudeKm, exaggeration, duration, siteName]);

  if (points.length < 2) return null;
  const cur = sampleAt(points, time);
  const stageLabel = cur.stage === 0 ? 'Coast' : `Stage ${cur.stage}`;
  const stagesPresent = [...new Set(points.map((p) => p.stage))].sort((a, b) => (a || 99) - (b || 99));

  return (
    <div className="viz-panel">
      <div className="viz-head">
        <div>
          <span className="eyebrow">Flight replay</span>
          <h3>Ascent from {siteName}</h3>
        </div>
        <div className="viz-legend">
          {stagesPresent.map((st) => (
            <span key={st}>
              <i style={{ background: `#${STAGE_COLORS[st % STAGE_COLORS.length].toString(16).padStart(6, '0')}` }} />
              {st === 0 ? 'Coast' : `Stage ${st}`}
            </span>
          ))}
          <span><i className="dashed" />Target orbit</span>
        </div>
      </div>
      <div className="viz-canvas" ref={ref}>
        <div className="viz-hud">
          <div><span>T+</span><strong>{cur.timeS.toFixed(0)} s</strong></div>
          <div><span>Altitude</span><strong>{cur.altitudeKm.toFixed(1)} km</strong></div>
          <div><span>Velocity</span><strong>{(cur.velocityMs / 1000).toFixed(2)} km/s</strong></div>
          <div><span>Downrange</span><strong>{cur.downrangeKm.toFixed(0)} km</strong></div>
          <div><span>Phase</span><strong>{stageLabel}</strong></div>
        </div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn play-btn" onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause /> : <Play />}
        </button>
        <input type="range" min={0} max={duration} step={1} value={time} aria-label="Flight time"
          onChange={(e) => { api.current.setTime?.(Number(e.target.value)); setTime(Number(e.target.value)); }} />
        <label className="inline">
          Speed
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>
        <label className="inline">
          Altitude scale
          <select value={exaggeration} onChange={(e) => setExaggeration(Number(e.target.value))}>
            {[1, 2, 4, 8, 16].map((k) => <option key={k} value={k}>{k}×</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
