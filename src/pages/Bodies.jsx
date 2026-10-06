import { useEffect, useState } from 'react';
import { BodyApi, parseError } from '../api/client.js';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { num, title } from '../format.js';

const TYPES = ['PLANET', 'DWARF_PLANET', 'ASTEROID', 'COMET', 'OTHER'];
const blank = { name: '', bodyType: 'DWARF_PLANET', semiMajorAxisAu: '', meanLongitudeJ2000Deg: '', gmKm3s2: '', radiusKm: '' };

function validate(b) {
  const e = {};
  if (!b.name.trim()) e.name = 'Name is required';
  const a = Number(b.semiMajorAxisAu);
  if (b.semiMajorAxisAu === '' || a < 0.05 || a > 200) e.semiMajorAxisAu = 'Orbit radius must be 0.05 to 200 AU';
  const l = Number(b.meanLongitudeJ2000Deg);
  if (b.meanLongitudeJ2000Deg === '' || l < 0 || l > 360) e.meanLongitudeJ2000Deg = 'Mean longitude must be 0 to 360';
  if (!(Number(b.gmKm3s2) > 0)) e.gmKm3s2 = 'GM must be positive';
  if (!(Number(b.radiusKm) > 0)) e.radiusKm = 'Radius must be positive';
  return e;
}

const label = (t) => title(t).replace('_', ' ');

export default function Bodies() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: 'error', text: '' });

  const load = () => BodyApi.list().then(setList).catch((e) => setMessage({ type: 'error', text: parseError(e).message }));
  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    const body = {
      name: form.name.trim(),
      bodyType: form.bodyType,
      semiMajorAxisAu: Number(form.semiMajorAxisAu),
      meanLongitudeJ2000Deg: Number(form.meanLongitudeJ2000Deg),
      gmKm3s2: Number(form.gmKm3s2),
      radiusKm: Number(form.radiusKm),
    };
    try {
      if (editingId) await BodyApi.update(editingId, body);
      else await BodyApi.create(body);
      setMessage({ type: 'success', text: `"${body.name}" saved` });
      setForm(null);
      load();
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fieldErrors);
      setMessage({ type: 'error', text: p.message });
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete ${b.name}? Saved transfer plans keep its name.`)) return;
    try {
      await BodyApi.remove(b.id);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: parseError(err).message });
    }
  };

  return (
    <>
      <PageHeader eyebrow="Solar system" title="Celestial Bodies"
        subtitle="Destinations for the Transfer Planner. Period, gravity and position are calculated from what you enter.">
        {!form && (
          <button className="btn" onClick={() => { setForm({ ...blank }); setEditingId(null); setErrors({}); }}>
            Add body
          </button>
        )}
      </PageHeader>
      <Alert type={message.type} onClose={() => setMessage({ ...message, text: '' })}>{message.text}</Alert>

      {form && (
        <form className="card" onSubmit={save} noValidate>
          <h3>{editingId ? `Edit ${form.name}` : 'New body'}</h3>
          <div className="form-grid">
            <Field label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} />
            <Field label="Type" error={errors.bodyType}>
              <select name="bodyType" value={form.bodyType} onChange={onChange}>
                {TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </select>
            </Field>
            <Field label="Orbit radius (AU)" name="semiMajorAxisAu" type="number" step="any"
              value={form.semiMajorAxisAu} onChange={onChange} error={errors.semiMajorAxisAu} hint="Earth = 1" />
            <Field label="Mean longitude at J2000 (°)" name="meanLongitudeJ2000Deg" type="number" step="any"
              value={form.meanLongitudeJ2000Deg} onChange={onChange} error={errors.meanLongitudeJ2000Deg}
              hint="Position on 1 Jan 2000, 12:00 TT" />
            <Field label="GM (km³/s²)" name="gmKm3s2" type="number" step="any" value={form.gmKm3s2}
              onChange={onChange} error={errors.gmKm3s2} hint="Earth = 398600" />
            <Field label="Mean radius (km)" name="radiusKm" type="number" step="any" value={form.radiusKm}
              onChange={onChange} error={errors.radiusKm} />
          </div>
          <div className="actions">
            <span className="spacer" />
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn">Save body</button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th className="num">Orbit radius</th><th className="num">Period</th>
              <th className="num">Surface gravity</th><th className="num">Current longitude</th><th />
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td className="cell-title">{b.name}</td>
                <td>{label(b.bodyType)}</td>
                <td className="num">{num(b.semiMajorAxisAu, 3)} AU</td>
                <td className="num">{num(b.orbitalPeriodDays)} days</td>
                <td className="num">{num(b.surfaceGravity, 2)} m/s²</td>
                <td className="num">{num(b.currentMeanLongitudeDeg, 1)}°</td>
                <td className="row-actions">
                  <button className="link" onClick={() => {
                    setForm({ ...b }); setEditingId(b.id); setErrors({});
                  }}>Edit</button>
                  <button className="link danger" onClick={() => remove(b)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
