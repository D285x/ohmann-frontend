import { useEffect, useState } from 'react';
import { VehicleApi, SiteApi, MissionApi, parseError } from '../api/client.js';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import MissionResult from '../components/MissionResult.jsx';
import Spinner from '../components/Spinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Segmented from '../components/Segmented.jsx';
import { localInputToIso } from '../format.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Link } from 'react-router-dom';

const initial = {
  missionName: '',
  vehicleId: '',
  siteId: '',
  orbitType: 'LEO',
  altitudeKm: 400,
  inclinationDeg: '',
  payloadKg: 1000,
  targetRaanDeg: '',
  earliestLaunch: '',
  save: true,
};

function validate(f) {
  const e = {};
  if (!f.missionName.trim()) e.missionName = 'Mission name is required';
  if (!f.vehicleId) e.vehicleId = 'Select a launch vehicle';
  if (!f.siteId) e.siteId = 'Select a launch site';
  const alt = Number(f.altitudeKm);
  if (f.altitudeKm === '' || alt < 150 || alt > 2000) e.altitudeKm = 'Altitude must be 150 to 2000 km';
  if (f.orbitType !== 'SSO' && f.inclinationDeg !== '') {
    const i = Number(f.inclinationDeg);
    if (i < 0 || i > 180) e.inclinationDeg = 'Inclination must be 0 to 180°';
  }
  if (f.payloadKg === '' || Number(f.payloadKg) < 0) e.payloadKg = 'Payload cannot be negative';
  if (f.targetRaanDeg !== '') {
    const r = Number(f.targetRaanDeg);
    if (r < 0 || r > 360) e.targetRaanDeg = 'RAAN must be 0 to 360°';
  }
  return e;
}

export default function LaunchPlanner() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([VehicleApi.list(), SiteApi.list()])
      .then(([v, s]) => {
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
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    setApiError('');
    setResult(null);
    try {
      const req = {
        missionName: form.missionName.trim(),
        vehicleId: Number(form.vehicleId),
        siteId: Number(form.siteId),
        orbitType: form.orbitType,
        altitudeKm: Number(form.altitudeKm),
        inclinationDeg: form.orbitType === 'SSO' || form.inclinationDeg === '' ? null : Number(form.inclinationDeg),
        payloadKg: Number(form.payloadKg),
        targetRaanDeg: form.targetRaanDeg === '' ? null : Number(form.targetRaanDeg),
        earliestLaunchUtc: localInputToIso(form.earliestLaunch),
        operatorId: user?.id ?? null,
        save: form.save && !!user,
      };
      setResult(await MissionApi.plan(req));
    } catch (err) {
      const p = parseError(err);
      setApiError(p.message);
      setErrors((er) => ({ ...er, ...p.fieldErrors }));
    } finally {
      setLoading(false);
    }
  };

  const site = sites.find((s) => String(s.id) === String(form.siteId));

  const orbitHelp = {
    LEO: 'Circular low Earth orbit. Leave inclination blank to launch due east.',
    SSO: 'Sun-synchronous orbit. Inclination is set by the altitude.',
    GTO: 'Geostationary transfer orbit, reached from a circular parking orbit.',
  }[form.orbitType];

  return (
    <>
      <PageHeader eyebrow="Earth to orbit" title="Launch Planner"
        subtitle="Simulate the ascent, optimise the pitch program and find the largest payload your vehicle can deliver." />

      <form className="card" onSubmit={onSubmit} noValidate>
        <section className="form-section">
          <header>
            <h3>Mission</h3>
            <p>Name the mission and choose what flies from where.</p>
          </header>
          <div className="form-grid">
            <Field label="Mission name" name="missionName" value={form.missionName} onChange={onChange}
              error={errors.missionName} placeholder="EOS-12" />
            <Field label="Launch vehicle" error={errors.vehicleId}>
              <select name="vehicleId" value={form.vehicleId} onChange={onChange}>
                <option value="">Choose a vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="Launch site" error={errors.siteId}
              hint={site ? `${site.latitudeDeg.toFixed(2)}° latitude · corridor ${site.minAzimuthDeg}° to ${site.maxAzimuthDeg}°` : ''}>
              <select name="siteId" value={form.siteId} onChange={onChange}>
                <option value="">Choose a site</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="form-section">
          <header>
            <h3>Target orbit</h3>
            <p>{orbitHelp}</p>
          </header>
          <Segmented label="Orbit type" value={form.orbitType}
            onChange={(v) => setForm((f) => ({ ...f, orbitType: v }))}
            options={[['LEO', 'Low Earth orbit'], ['SSO', 'Sun-synchronous'], ['GTO', 'Geostationary transfer']]} />
          <div className="form-grid" style={{ marginTop: '1.1rem' }}>
            <Field label={form.orbitType === 'GTO' ? 'Parking altitude (km)' : 'Altitude (km)'}
              name="altitudeKm" type="number" value={form.altitudeKm} onChange={onChange} error={errors.altitudeKm} />
            <Field label="Inclination (°)" name="inclinationDeg" type="number" step="0.01"
              value={form.orbitType === 'SSO' ? '' : form.inclinationDeg} onChange={onChange}
              disabled={form.orbitType === 'SSO'} error={errors.inclinationDeg}
              placeholder={form.orbitType === 'SSO' ? 'Set by altitude' : 'Site latitude'} />
            <Field label="Payload (kg)" name="payloadKg" type="number" value={form.payloadKg}
              onChange={onChange} error={errors.payloadKg} />
          </div>
        </section>

        <section className="form-section">
          <header>
            <h3>Launch window <span className="muted small">Optional</span></h3>
            <p>Give the orbital plane (RAAN) to find the next time the pad passes under it.</p>
          </header>
          <div className="form-grid">
            <Field label="Target RAAN (°)" name="targetRaanDeg" type="number" step="0.1"
              value={form.targetRaanDeg} onChange={onChange} error={errors.targetRaanDeg} placeholder="Any" />
            <Field label="Earliest launch (UTC)" name="earliestLaunch" type="datetime-local"
              value={form.earliestLaunch} onChange={onChange} hint="Blank means now" />
          </div>
        </section>

        <div className="actions">
          <label className="check" style={{ minHeight: 0 }}>
            <input type="checkbox" name="save" checked={form.save && !!user} onChange={onChange} disabled={!user} />
            {user ? 'Save to history' : <span>Save to history (<Link to="/login">log in</Link>)</span>}
          </label>
          <span className="spacer" />
          <button type="button" className="btn btn-ghost"
            onClick={() => { setForm(initial); setErrors({}); setResult(null); }}>
            Reset
          </button>
          <button className="btn" disabled={loading}>{loading ? 'Optimising…' : 'Optimise trajectory'}</button>
        </div>
      </form>

      <Alert onClose={() => setApiError('')}>{apiError}</Alert>
      {loading && <Spinner text="Simulating ascents in parallel…" />}
      {result && <MissionResult result={result} />}
    </>
  );
}
