import { Fragment, useEffect, useState } from 'react';
import { VehicleApi, parseError } from '../api/client.js';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DragCurveChart from '../components/DragCurveChart.jsx';
import { num } from '../format.js';

const AERO_LABEL = {
  CONSTANT: 'Constant Cd',
  SHOCKFLOW: 'shockFLOW (GPU CFD)',
  ANALYTIC_FALLBACK: 'Analytic fallback',
};

const blankStage = { name: '', propellantMassKg: '', dryMassKg: '', thrustKn: '', ispS: '' };
const blank = { name: '', manufacturer: '', country: '', diameterM: '', dragCoefficient: 0.3, stages: [{ ...blankStage, name: 'Stage 1' }] };

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Name is required';
  if (!(Number(v.diameterM) > 0)) e.diameterM = 'Diameter must be positive';
  const cd = Number(v.dragCoefficient);
  if (!(cd >= 0.05 && cd <= 2)) e.dragCoefficient = 'Cd must be between 0.05 and 2';
  if (!v.stages.length) e.stages = 'At least one stage is required';
  v.stages.forEach((s, i) => {
    if (!s.name.trim()) e[`stages[${i}].name`] = 'Required';
    ['propellantMassKg', 'dryMassKg', 'thrustKn'].forEach((k) => {
      if (!(Number(s[k]) > 0)) e[`stages[${i}].${k}`] = 'Must be > 0';
    });
    const isp = Number(s.ispS);
    if (!(isp >= 100 && isp <= 500)) e[`stages[${i}].ispS`] = '100 to 500 s';
  });
  return e;
}

export default function Vehicles() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: 'error', text: '' });
  const [expanded, setExpanded] = useState(null);
  const [aeroBusy, setAeroBusy] = useState(null);

  const load = () => VehicleApi.list().then(setList).catch((e) => setMessage({ type: 'error', text: parseError(e).message }));
  useEffect(() => { load(); }, []);

  const startCreate = () => { setForm(structuredClone(blank)); setEditingId(null); setErrors({}); };
  const startEdit = (v) => {
    setForm({ ...v, manufacturer: v.manufacturer || '', country: v.country || '', stages: v.stages.map((s) => ({ ...s })) });
    setEditingId(v.id);
    setErrors({});
  };

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const setStage = (i, key, value) =>
    setForm((f) => ({ ...f, stages: f.stages.map((s, j) => (j === i ? { ...s, [key]: value } : s)) }));
  const addStage = () =>
    setForm((f) => ({ ...f, stages: [...f.stages, { ...blankStage, name: `Stage ${f.stages.length + 1}` }] }));
  const removeStage = (i) => setForm((f) => ({ ...f, stages: f.stages.filter((_, j) => j !== i) }));

  const save = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    const body = {
      name: form.name.trim(),
      manufacturer: form.manufacturer,
      country: form.country,
      diameterM: Number(form.diameterM),
      dragCoefficient: Number(form.dragCoefficient),
      stages: form.stages.map((s) => ({
        name: s.name.trim(),
        propellantMassKg: Number(s.propellantMassKg),
        dryMassKg: Number(s.dryMassKg),
        thrustKn: Number(s.thrustKn),
        ispS: Number(s.ispS),
      })),
    };
    try {
      if (editingId) await VehicleApi.update(editingId, body);
      else await VehicleApi.create(body);
      setMessage({ type: 'success', text: `Vehicle "${body.name}" saved` });
      setForm(null);
      load();
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fieldErrors);
      setMessage({ type: 'error', text: p.message });
    }
  };

  const refineAero = async (v) => {
    setAeroBusy(v.id);
    try {
      const updated = await VehicleApi.refineAero(v.id, {});
      setMessage({ type: 'success', text: `${v.name}: aerodynamics refined via ${AERO_LABEL[updated.aeroSource] || updated.aeroSource}` });
      setExpanded(v.id);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: parseError(err).message });
    } finally {
      setAeroBusy(null);
    }
  };

  const resetAero = async (v) => {
    setAeroBusy(v.id);
    try {
      await VehicleApi.resetAero(v.id);
      setMessage({ type: 'success', text: `${v.name}: back to constant drag coefficient` });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: parseError(err).message });
    } finally {
      setAeroBusy(null);
    }
  };

  const remove = async (v) => {
    if (!window.confirm(`Delete ${v.name}?`)) return;
    try {
      await VehicleApi.remove(v.id);
      setMessage({ type: 'success', text: `${v.name} deleted` });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: parseError(err).message });
    }
  };

  return (
    <>
      <PageHeader eyebrow="Fleet" title="Launch Vehicles"
        subtitle="Multi-stage rockets used by the planners. Fold strap-on boosters into stage 1.">
        {!form && <button className="btn" onClick={startCreate}>Add vehicle</button>}
      </PageHeader>
      <Alert type={message.type} onClose={() => setMessage({ ...message, text: '' })}>{message.text}</Alert>

      {form && (
        <form className="card" onSubmit={save} noValidate>
          <h3>{editingId ? 'Edit vehicle' : 'New vehicle'}</h3>
          <div className="form-grid">
            <Field label="Name" name="name" value={form.name} onChange={setField} error={errors.name} />
            <Field label="Manufacturer" name="manufacturer" value={form.manufacturer} onChange={setField} />
            <Field label="Country" name="country" value={form.country} onChange={setField} />
            <Field label="Diameter (m)" name="diameterM" type="number" step="0.1" value={form.diameterM}
              onChange={setField} error={errors.diameterM} />
            <Field label="Drag coefficient" name="dragCoefficient" type="number" step="0.01"
              value={form.dragCoefficient} onChange={setField} error={errors.dragCoefficient} />
          </div>
          <h4>Stages, in firing order</h4>
          {errors.stages && <p className="error-text">{errors.stages}</p>}
          <div className="table-wrap">
            <table className="table stage-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Propellant (kg)</th><th>Dry mass (kg)</th><th>Thrust (kN)</th><th>Isp (s)</th><th /></tr>
              </thead>
              <tbody>
                {form.stages.map((s, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    {['name', 'propellantMassKg', 'dryMassKg', 'thrustKn', 'ispS'].map((k) => {
                      const err = errors[`stages[${i}].${k}`];
                      return (
                        <td key={k} className={err ? 'has-error' : ''}>
                          <input type={k === 'name' ? 'text' : 'number'} step="any" value={s[k]}
                            onChange={(e) => setStage(i, k, e.target.value)} title={err || ''} />
                          {err && <div className="error-text small">{err}</div>}
                        </td>
                      );
                    })}
                    <td>
                      <button type="button" className="link danger" onClick={() => removeStage(i)}
                        disabled={form.stages.length === 1}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={addStage} disabled={form.stages.length >= 6}>Add stage</button>
            <span className="spacer" />
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn">Save vehicle</button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Manufacturer</th><th className="num">Stages</th>
              <th className="num">Liftoff mass (no payload)</th><th className="num">Ideal Δv</th>
              <th>Aerodynamics</th><th />
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <Fragment key={v.id}>
                <tr>
                  <td><div className="cell-title">{v.name}</div><div className="cell-sub">{v.country}</div></td>
                  <td>{v.manufacturer}</td>
                  <td className="num">{v.stages.length}</td>
                  <td className="num">{num(v.liftoffMassKg / 1000, 1)} t</td>
                  <td className="num">{num(v.idealDeltaVMs)} m/s</td>
                  <td>
                    <span className={`badge ${v.aeroSource === 'SHOCKFLOW' ? 'badge-ok' : 'badge-neutral'}`}
                      title="Where this vehicle's drag coefficient comes from">
                      {AERO_LABEL[v.aeroSource] || v.aeroSource || 'Constant Cd'}
                    </span>
                    {v.dragCurve?.length > 0 && (
                      <button type="button" className="link" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                        {expanded === v.id ? 'Hide curve' : 'Show curve'}
                      </button>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="link" disabled={aeroBusy === v.id} onClick={() => refineAero(v)}>
                      {aeroBusy === v.id ? 'Refining…' : 'Refine aero'}
                    </button>
                    {v.aeroSource !== 'CONSTANT' && (
                      <button className="link" disabled={aeroBusy === v.id} onClick={() => resetAero(v)}>Reset aero</button>
                    )}
                    <button className="link" onClick={() => startEdit(v)}>Edit</button>
                    <button className="link danger" onClick={() => remove(v)}>Delete</button>
                  </td>
                </tr>
                {expanded === v.id && v.dragCurve?.length > 0 && (
                  <tr>
                    <td colSpan={7}><DragCurveChart points={v.dragCurve} /></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
