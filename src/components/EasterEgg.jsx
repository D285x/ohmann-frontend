import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VehicleApi, parseError } from '../api/client.js';
import { Rocket } from './Icons.jsx';

// Hidden unlock: the Konami code (up up down down left right left right B A)
// adds the FSS-1000 Sabre, a nod to the Halo: Reach spaceplane, to the fleet.
const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export const SABRE_NAME = 'FSS-1000 Sabre';

// Booster plus spaceplane, sized so it can actually reach LEO in the Launch Planner
const SABRE = {
  name: SABRE_NAME,
  manufacturer: 'UNSC Fleet Command',
  country: 'Reach',
  diameterM: 4.4,
  dragCoefficient: 0.35,
  stages: [
    { name: 'Launch booster', propellantMassKg: 260000, dryMassKg: 18000, thrustKn: 5400, ispS: 290 },
    { name: 'Sabre spaceplane', propellantMassKg: 24000, dryMassKg: 8000, thrustKn: 500, ispS: 380 },
  ],
};

export default function EasterEgg() {
  const [state, setState] = useState(null); // null | { status: 'added' | 'exists' | 'error', text? }

  useEffect(() => {
    let pos = 0;
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === CODE[pos] ? pos + 1 : (key === CODE[0] ? 1 : 0);
      if (pos === CODE.length) {
        pos = 0;
        unlock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function unlock() {
    setState({ status: 'launching' });
    try {
      const fleet = await VehicleApi.list();
      if (fleet.some((v) => v.name === SABRE_NAME)) {
        setState({ status: 'exists' });
      } else {
        await VehicleApi.create(SABRE);
        window.dispatchEvent(new Event('ohmann:fleet-changed'));
        setState({ status: 'added' });
      }
    } catch (err) {
      setState({ status: 'error', text: parseError(err).message });
    }
  }

  if (!state) return null;
  const close = () => setState(null);

  return (
    <div className="egg-overlay" role="dialog" aria-modal="true" aria-label="Sabre program unlocked" onClick={close}>
      <div className="egg-streak" aria-hidden="true"><Rocket /></div>
      <div className="egg-card" onClick={(e) => e.stopPropagation()}>
        <span className="eyebrow">Classified program unlocked</span>
        <h2>FSS-1000 Sabre</h2>
        {state.status === 'launching' && <p className="muted">Clearing the Sabre for launch...</p>}
        {state.status === 'added' && <p>The Sabre has joined the fleet: a two-stage booster and spaceplane stack, ready for the Launch Planner.</p>}
        {state.status === 'exists' && <p>The Sabre is already in the fleet. Take it up from the Launch Planner.</p>}
        {state.status === 'error' && <p className="muted">Launch scrubbed: {state.text}</p>}
        <div className="egg-actions">
          {(state.status === 'added' || state.status === 'exists') && (
            <Link className="btn btn-sm" to="/launch" onClick={close}>Plan a launch</Link>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
