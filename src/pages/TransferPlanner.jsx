import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TransferApi, VehicleApi, SiteApi, BodyApi, parseError } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import Kpi from '../components/Kpi.jsx';
import Spinner from '../components/Spinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import TransferViewer from '../viz/TransferViewer.jsx';
import { num, date, localInputToIso } from '../format.js';

const initial = {
  originId: '',
  destinationId: '',
  earliestDeparture: '',
  windowCount: 3,
  parkingAltitudeKm: 200,
  capture: true,
  captureAltitudeKm: 400,
  vehicleId: '',
  siteId: '',
  save: false,
};

function validate(f, bodies) {
  const e = {};
  if (!f.originId) e.originId = 'Select an origin';
  if (!f.destinationId) e.destinationId = 'Select a destination';
  else if (f.originId === f.destinationId) e.destinationId = 'Destination must differ from origin';
  const w = Number(f.windowCount);
  if (!Number.isInteger(w) || w < 1 || w > 10) e.windowCount = 'Choose 1 to 10 windows';
  if (f.parkingAltitudeKm === '' || Number(f.parkingAltitudeKm) < 100) e.parkingAltitudeKm = 'At least 100 km';
  if (f.capture && (f.captureAltitudeKm === '' || Number(f.captureAltitudeKm) < 50)) e.captureAltitudeKm = 'At least 50 km';
  if (f.vehicleId && !f.siteId) e.siteId = 'Select a site to estimate payload';
  const origin = bodies.find((b) => String(b.id) === String(f.originId));
  if (f.vehicleId && origin && origin.name.toLowerCase() !== 'earth') {
    e.vehicleId = 'Vehicle capacity applies to Earth departures only';
  }
  return e;
}

export default function TransferPlanner() {
  const { user } = useAuth();
  const [bodies, setBodies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [windowIdx, setWindowIdx] = useState(0);

  useEffect(() => {
    Promise.all([BodyApi.list(), VehicleApi.list(), SiteApi.list()])
      .then(([b, v, s]) => {
        setBodies(b);
        const find = (n) => b.find((x) => x.name.toLowerCase() === n)?.id ?? '';
        setForm((f) => ({ ...f, originId: f.originId || find('earth'), destinationId: f.destinationId || find('mars') }));
        setVehicles(v);
        setSites(s);
      })
      .catch((e) => setApiError(parseError(e).message));
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form, bodies);
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    setApiError('');
    try {
      const data = await TransferApi.plan({
        originId: Number(form.originId),
        destinationId: Number(form.destinationId),
        earliestDepartureUtc: localInputToIso(form.earliestDeparture),
        windowCount: Number(form.windowCount),
        parkingAltitudeKm: Number(form.parkingAltitudeKm),
        captureAltitudeKm: form.capture ? Number(form.captureAltitudeKm) : null,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        siteId: form.siteId ? Number(form.siteId) : null,
        operatorId: user?.id ?? null,
        save: form.save && !!user,
      });
      setResult(data);
      setWindowIdx(0);
    } catch (err) {
      const p = parseError(err);
      setApiError(p.message);
      setErrors((er) => ({ ...er, ...p.fieldErrors }));
    } finally {
      setLoading(false);
    }
  };

  const first = result?.windows?.[windowIdx];

  return (
    <>
      <PageHeader eyebrow="Beyond Earth" title="Transfer Planner"
        subtitle="Find when the planets line up, what the journey costs and how long it takes." />

      <form className="card" onSubmit={onSubmit} noValidate>
        <section className="form-section">
          <header>
            <h3>Route</h3>
            <p>Any two bodies from your catalogue. <Link to="/bodies">Add a body</Link></p>
          </header>
          <div className="form-grid">
            <Field label="From" error={errors.originId}>
              <select name="originId" value={form.originId} onChange={onChange}>
                <option value="">Choose origin</option>
                {bodies.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="To" error={errors.destinationId}>
              <select name="destinationId" value={form.destinationId} onChange={onChange}>
                <option value="">Choose destination</option>
                {bodies.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Earliest departure (UTC)" name="earliestDeparture" type="datetime-local"
              value={form.earliestDeparture} onChange={onChange} hint="Blank means now" />
            <Field label="Windows to list" name="windowCount" type="number" value={form.windowCount}
              onChange={onChange} error={errors.windowCount} />
          </div>
        </section>

        <section className="form-section">
          <header>
            <h3>Orbits</h3>
            <p>Circular orbit you leave from, and the one you capture into on arrival.</p>
          </header>
          <div className="form-grid">
            <Field label="Parking orbit altitude (km)" name="parkingAltitudeKm" type="number"
              value={form.parkingAltitudeKm} onChange={onChange} error={errors.parkingAltitudeKm} />
            <Field label="Capture orbit altitude (km)" name="captureAltitudeKm" type="number"
              value={form.capture ? form.captureAltitudeKm : ''} placeholder="Flyby" onChange={onChange}
              disabled={!form.capture} error={errors.captureAltitudeKm} />
            <label className="check">
              <input type="checkbox" name="capture" checked={form.capture} onChange={onChange} />
              Capture into orbit on arrival
            </label>
          </div>
        </section>

        <section className="form-section">
          <header>
            <h3>Launch vehicle <span className="muted small">Optional</span></h3>
            <p>Estimate how much mass a vehicle can send on this trajectory (Earth departures).</p>
          </header>
          <div className="form-grid">
            <Field label="Vehicle" error={errors.vehicleId}>
              <select name="vehicleId" value={form.vehicleId} onChange={onChange}>
                <option value="">None</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="Launch site" error={errors.siteId}>
              <select name="siteId" value={form.siteId} onChange={onChange} disabled={!form.vehicleId}>
                <option value="">Choose a site</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <div className="actions">
          <label className="check" style={{ minHeight: 0 }}>
            <input type="checkbox" name="save" checked={form.save && !!user} onChange={onChange} disabled={!user} />
            {user ? 'Save first window to history' : <span>Save to history (<Link to="/login">log in</Link>)</span>}
          </label>
          <span className="spacer" />
          <button className="btn" disabled={loading}>{loading ? 'Computing…' : 'Find windows'}</button>
        </div>
      </form>

      <Alert onClose={() => setApiError('')}>{apiError}</Alert>
      {loading && <Spinner text="Computing transfer windows…" />}
      {result && first && (
        <section className="card result">
          <div className="result-head">
            <div>
              <span className="eyebrow">Transfer</span>
              <h2>{result.origin} to {result.destination}</h2>
            </div>
            {result.savedId && <span className="badge badge-ok">Saved</span>}
          </div>
          <div>
            <div className="kpi-grid">
              <Kpi label={windowIdx === 0 ? "Next departure" : `Departure (window ${windowIdx + 1})`} value={date(first.departureUtc)} tone="accent" wide />
              <Kpi label="Arrival" value={date(first.arrivalUtc)} wide />
              <Kpi label="Time of flight" value={num(first.timeOfFlightDays)} unit="days" />
              <Kpi label="Synodic period" value={num(result.synodicPeriodDays)} unit="days" />
              <Kpi label="Required phase angle" value={num(first.phaseAngleDeg, 1)} unit="°" />
              <Kpi label="C3" value={num(first.c3Km2s2, 2)} unit="km²/s²" />
              <Kpi label="Departure Δv" value={num(first.departureDvMs)} unit="m/s" />
              <Kpi label="Capture Δv" value={num(first.arrivalDvMs)} unit="m/s" />
              {result.payloadCapacityKg !== null && (
                <Kpi wide label={`Payload (${result.vehicleName})`} value={num(result.payloadCapacityKg)} unit="kg"
                  tone={result.payloadCapacityKg > 0 ? 'ok' : 'bad'} />
              )}
            </div>
          </div>
          <TransferViewer bodies={bodies} origin={result.origin} destination={result.destination}
            window={result.windows[windowIdx]} />

          <div className="card-head" style={{ marginTop: '1.5rem' }}>
            <h3>Upcoming windows</h3>
            <span className="muted small">Select a window to simulate it</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Departure</th><th>Arrival</th><th className="num">v∞ out</th>
                  <th className="num">v∞ in</th><th className="num">Total Δv</th>
                </tr>
              </thead>
              <tbody>
                {result.windows.map((w, i) => (
                  <tr key={w.departureUtc} className={`clickable ${i === windowIdx ? 'selected' : ''}`}
                    onClick={() => setWindowIdx(i)} title="Show this window in the simulation">
                    <td>{i + 1}</td>
                    <td>{date(w.departureUtc)}</td>
                    <td>{date(w.arrivalUtc)}</td>
                    <td className="num">{num(w.vInfDepartureMs)} m/s</td>
                    <td className="num">{num(w.vInfArrivalMs)} m/s</td>
                    <td className="num">{num(w.totalDvMs)} m/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h4>Notes</h4>
          <ul className="notes">
            {result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}
    </>
  );
}
