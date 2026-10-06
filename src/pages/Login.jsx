import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserApi, parseError } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import { Logo } from '../components/Icons.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) v.email = 'Enter a valid email address';
    if (!form.password) v.password = 'Password is required';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError('');
    try {
      login(await UserApi.login({ email: form.email.trim(), password: form.password }));
      navigate(location.state?.from || '/');
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fieldErrors);
      setError(p.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card auth-card" onSubmit={onSubmit} noValidate>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Logo style={{ width: 48, height: 48 }} />
        <h1 style={{ marginTop: '0.75rem' }}>Welcome back</h1>
        <p className="muted">Log in to save plans under your name.</p>
      </div>
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Field label="Email" name="email" type="email" value={form.email} onChange={onChange}
        error={errors.email} autoComplete="username" />
      <Field label="Password" name="password" type="password" value={form.password} onChange={onChange}
        error={errors.password} autoComplete="current-password" />
      <div className="actions">
        <button className="btn btn-lg" disabled={busy}>{busy ? 'Checking…' : 'Log in'}</button>
      </div>
      <p className="muted small demo-hint">
        Just looking around? Use the demo account: <strong>demo@ohmann.app</strong> / <strong>ohmann-demo</strong>{' '}
        <button type="button" className="link" onClick={() => { setForm({ email: 'demo@ohmann.app', password: 'ohmann-demo' }); setErrors({}); }}>
          Fill in
        </button>
      </p>
      <p className="muted small" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        New to OhMann? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}
