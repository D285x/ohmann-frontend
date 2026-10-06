import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MissionApi, TransferApi, parseError } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { num, date, utcShort } from '../format.js';

export default function History() {
  const [missions, setMissions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([MissionApi.list(), TransferApi.list()])
      .then(([m, t]) => { setMissions(m); setTransfers(t); })
      .catch((e) => setError(parseError(e).message));

  useEffect(() => { load(); }, []);

  const removeMission = async (m) => {
    if (!window.confirm(`Delete mission "${m.missionName}"?`)) return;
    try { await MissionApi.remove(m.id); load(); } catch (e) { setError(parseError(e).message); }
  };
  const removeTransfer = async (t) => {
    if (!window.confirm('Delete this transfer plan?')) return;
    try { await TransferApi.remove(t.id); load(); } catch (e) { setError(parseError(e).message); }
  };

  const shown = filter === 'ALL' ? missions : missions.filter((m) => m.orbitType === filter);

  return (
    <>
      <PageHeader eyebrow="Mission log" title="History" subtitle="Every saved launch and transfer plan." />
      <Alert onClose={() => setError('')}>{error}</Alert>

      <section className="card">
        <div className="card-head">
          <h3>Launch plans</h3>
          <div className="segmented">
            {['ALL', 'LEO', 'SSO', 'GTO'].map((f) => (
              <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="empty">No saved launch plans yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mission</th><th>Vehicle / Site</th><th>Orbit</th><th className="num">Payload</th>
                  <th className="num">Max payload</th><th>Status</th><th>Planned by</th><th>Created</th><th />
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => (
                  <tr key={m.id}>
                    <td><Link to={`/history/${m.id}`} className="cell-title">{m.missionName}</Link></td>
                    <td>{m.vehicleName}<div className="cell-sub">{m.siteName}</div></td>
                    <td className="nowrap">{m.orbitType} {num(m.targetAltitudeKm)} km</td>
                    <td className="num">{num(m.payloadKg)} kg</td>
                    <td className="num">{num(m.maxPayloadKg)} kg</td>
                    <td><span className={`badge ${m.feasible ? 'badge-ok' : 'badge-bad'}`}>{m.feasible ? 'Feasible' : 'Not feasible'}</span></td>
                    <td>{m.plannedBy || '-'}</td>
                    <td className="small">{utcShort(m.createdAt)}</td>
                    <td className="row-actions">
                      <Link className="link" to={`/history/${m.id}`}>View</Link>
                      <button className="link danger" onClick={() => removeMission(m)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h3>Transfer plans</h3>
        {transfers.length === 0 ? (
          <p className="empty">No saved transfer plans yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Route</th><th>Departure</th><th>Arrival</th><th className="num">C3</th><th className="num">Total Δv</th><th>Vehicle</th><th>Planned by</th><th /></tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-title">{t.origin} to {t.destination}</td>
                    <td>{date(t.departureUtc)}</td>
                    <td>{date(t.arrivalUtc)}</td>
                    <td className="num">{num(t.c3Km2s2, 2)} km²/s²</td>
                    <td className="num">{num(t.totalDvMs)} m/s</td>
                    <td>{t.vehicleName ? `${t.vehicleName} (${num(t.payloadCapacityKg)} kg)` : '-'}</td>
                    <td>{t.plannedBy || '-'}</td>
                    <td className="row-actions"><button className="link danger" onClick={() => removeTransfer(t)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
