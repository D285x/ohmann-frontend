import { useEffect, useState } from 'react';
import { SiteApi, parseError } from '../api/client.js';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';

const blank = { name: '', country: '', latitudeDeg: '', longitudeDeg: '', minAzimuthDeg: 0, maxAzimuthDeg: 360 };

function validate(s) {
  const e = {};
  if (!s.name.trim()) e.name = 'Name is required';
  const lat = Number(s.latitudeDeg);
  if (s.latitudeDeg === '' || lat < -90 || lat > 90) e.latitudeDeg = 'Latitude must be -90 to 90';
  const lon = Number(s.longitudeDeg);
  if (s.longitudeDeg === '' || lon < -180 || lon > 180) e.longitudeDeg = 'Longitude must be -180 to 180';
  ['minAzimuthDeg', 'maxAzimuthDeg'].forEach((k) => {
    const a = Number(s[k]);
    if (s[k] === '' || a < 0 || a > 360) e[k] = 'Azimuth must be 0 to 360';
  });
  return e;
}

export default function Sites() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: 'error', text: '' });

  const load = () => SiteApi.list().then(setList).catch((e) => setMessage({ type: 'error', text: parseError(e).message }));
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
      country: form.country,
      latitudeDeg: Number(form.latitudeDeg),
      longitudeDeg: Number(form.longitudeDeg),
      minAzimuthDeg: Number(form.minAzimuthDeg),
      maxAzimuthDeg: Number(form.maxAzimuthDeg),
    };
    try {
      if (editingId) await SiteApi.update(editingId, body);
      else await SiteApi.create(body);
      setMessage({ type: 'success', text: `Site "${body.name}" saved` });
      setForm(null);
      load();
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fieldErrors);
      setMessage({ type: 'error', text: p.message });
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try {
      await SiteApi.remove(s.id);
      setMessage({ type: 'success', text: `${s.name} deleted` });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: parseError(err).message });
    }
  };

  return (
    <>
      <PageHeader eyebrow="Spaceports" title="Launch Sites"
        subtitle="Pad locations and the launch directions range safety allows.">
        {!form && <button className="btn" onClick={() => { setForm({ ...blank }); setEditingId(null); setErrors({}); }}>Add site</button>}
      </PageHeader>
      <Alert type={message.type} onClose={() => setMessage({ ...message, text: '' })}>{message.text}</Alert>

      {form && (
        <form className="card" onSubmit={save} noValidate>
          <h3>{editingId ? 'Edit site' : 'New site'}</h3>
          <div className="form-grid">
            <Field label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} />
            <Field label="Country" name="country" value={form.country || ''} onChange={onChange} />
            <Field label="Latitude (°N)" name="latitudeDeg" type="number" step="0.01" value={form.latitudeDeg}
              onChange={onChange} error={errors.latitudeDeg} />
            <Field label="Longitude (°E)" name="longitudeDeg" type="number" step="0.01" value={form.longitudeDeg}
              onChange={onChange} error={errors.longitudeDeg} />
            <Field label="Corridor start azimuth (°)" name="minAzimuthDeg" type="number" value={form.minAzimuthDeg}
              onChange={onChange} error={errors.minAzimuthDeg} hint="Clockwise from north" />
            <Field label="Corridor end azimuth (°)" name="maxAzimuthDeg" type="number" value={form.maxAzimuthDeg}
              onChange={onChange} error={errors.maxAzimuthDeg} hint="May wrap past 360, e.g. 350 to 95" />
          </div>
          <div className="actions">
            <span className="spacer" />
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn">Save site</button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Country</th><th className="num">Latitude</th><th className="num">Longitude</th><th className="num">Azimuth corridor</th><th /></tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td className="cell-title">{s.name}</td>
                <td>{s.country}</td>
                <td className="num">{s.latitudeDeg.toFixed(2)}°</td>
                <td className="num">{s.longitudeDeg.toFixed(2)}°</td>
                <td className="num">{s.minAzimuthDeg}° to {s.maxAzimuthDeg}°</td>
                <td className="row-actions">
                  <button className="link" onClick={() => { setForm({ ...s }); setEditingId(s.id); setErrors({}); }}>Edit</button>
                  <button className="link danger" onClick={() => remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
