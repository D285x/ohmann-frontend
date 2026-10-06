import Kpi from './Kpi.jsx';
import TrajectoryCharts from './TrajectoryCharts.jsx';
import AscentViewer from '../viz/AscentViewer.jsx';
import { num, utcShort } from '../format.js';

/** Shows the outcome of a launch plan: verdict, KPIs, delta-v budget, notes and charts. */
export default function MissionResult({ result, actions }) {
  const r = result;
  const budget = [
    ['Delta-v burned during ascent', r.ascentDvMs],
    ['  of which gravity loss', r.gravityLossMs],
    ['  of which drag loss', r.dragLossMs],
    ['  of which steering loss', r.steeringLossMs],
    ['Orbit insertion / circularisation', r.insertionDvMs],
    ['Post-insertion manoeuvres', r.postInsertionDvMs],
    ['Total mission delta-v', r.totalDvMs, 'total'],
    ['Remaining margin', r.dvMarginMs, 'total'],
  ];

  return (
    <section className="card result">
      <div className="result-head">
        <div>
          <span className="eyebrow">Launch plan</span>
          <h2>{r.missionName}</h2>
          <p className="muted">
            {r.vehicleName} from {r.siteName} to {r.orbitType} · {num(r.targetAltitudeKm)} km ·{' '}
            {num(r.inclinationDeg, 2)}°
            {r.plannedBy && <> · planned by {r.plannedBy}</>}
          </p>
        </div>
        <span className={`badge ${r.feasible ? 'badge-ok' : 'badge-bad'}`}>
          {r.feasible ? 'Feasible' : 'Not feasible'}
        </span>
      </div>
      {r.failureReason && <div className="alert alert-error">{r.failureReason}</div>}

      <div className="kpi-grid">
        <Kpi label="Payload" value={num(r.payloadKg)} unit="kg" />
        <Kpi label="Max payload" value={num(r.maxPayloadKg)} unit="kg" tone="accent" />
        <Kpi label="Launch azimuth" value={num(r.launchAzimuthDeg, 1)} unit="°" />
        <Kpi label="Pitch kick" value={num(r.pitchKickDeg, 2)} unit="°" />
        <Kpi label="Final pitch" value={num(r.finalPitchDeg, 2)} unit="°" />
        <Kpi label="Engine cutoff" value={num(r.insertionTimeS)} unit="s" />
        <Kpi label="Cutoff altitude" value={num(r.insertionAltitudeKm)} unit="km" />
        <Kpi label="Max Q" value={num(r.maxQkPa, 1)} unit="kPa" />
        <Kpi label="Delta-v margin" value={num(r.dvMarginMs)} unit="m/s" tone={r.dvMarginMs >= 0 ? 'ok' : 'bad'} />
        {r.nextWindowUtc && <Kpi label="Next launch window" value={utcShort(r.nextWindowUtc)} wide />}
      </div>

      <div className="two-col">
        <div>
          <h3>Delta-v budget</h3>
          <table className="table compact">
            <tbody>
              {budget.map(([k, v, kind]) => (
                <tr key={k} className={kind || (k.startsWith('  ') ? 'sub' : '')}>
                  <td>{k.trim()}</td>
                  <td className="num">{num(v)} m/s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3>Notes</h3>
          {r.notes?.length ? (
            <ul className="notes">
              {r.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No notes.</p>
          )}
        </div>
      </div>

      {r.trajectory?.length > 1 && (
        <AscentViewer trajectory={r.trajectory} siteLat={r.siteLatitudeDeg} siteLon={r.siteLongitudeDeg}
          azimuthDeg={r.launchAzimuthDeg} targetAltitudeKm={r.targetAltitudeKm} siteName={r.siteName} />
      )}
      {r.trajectory?.length > 0 && <TrajectoryCharts points={r.trajectory} />}
      {actions && <div className="actions">{actions}</div>}
    </section>
  );
}
