import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserApi, parseError } from '../api/client.js';
import Field from '../components/Field.jsx';
import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export const ROLES = [
  ['MISSION_PLANNER', 'Mission planner'],
  ['FLIGHT_DYNAMICS_ENGINEER', 'Flight dynamics engineer'],
  ['STUDENT', 'Student'],
  ['VIEWER', 'Viewer'],
];

const initial = {
  fullName: '', email: '', phone: '', organization: '', role: '',
  password: '', confirmPassword: '', acceptedTerms: false,
};

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

function validate(f) {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
  if (!f.role) e.role = 'Select a role';
  if (!PASSWORD_RULE.test(f.password)) e.password = 'Use 8+ characters with upper case, lower case, a digit and a symbol';
  if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match';
  if (!f.acceptedTerms) e.acceptedTerms = 'You must accept the terms of use';
  return e;
}

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    setError('');
    try {
      const user = await UserApi.register({ ...form, fullName: form.fullName.trim(), email: form.email.trim() });
      login(user);
      navigate('/');
    } catch (err) {
      const p = parseError(err);
      const fe = { ...p.fieldErrors };
      if (fe.passwordsMatching) fe.confirmPassword = fe.passwordsMatching;
      setErrors(fe);
      setError(p.message);
    } finally {
      setSubmitting(false);
    }
  };

  const score = strength(form.password);

  return (
    <>
      <PageHeader eyebrow="Join mission control" title="Create your account"
        subtitle={<>Save launch and transfer plans under your name. Already registered? <Link to="/login">Log in</Link></>} />
      <Alert onClose={() => setError('')}>{error}</Alert>

      <form className="card form-grid" onSubmit={onSubmit} noValidate>
        <Field label="Full name" name="fullName" value={form.fullName} onChange={onChange} error={errors.fullName} />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Mobile number (optional)" name="phone" value={form.phone} onChange={onChange}
          error={errors.phone} maxLength={10} inputMode="numeric" />
        <Field label="Organization" name="organization" value={form.organization} onChange={onChange}
          error={errors.organization} />
        <Field label="Role" error={errors.role}>
          <select name="role" value={form.role} onChange={onChange}>
            <option value="">Select…</option>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Password" name="password" type="password" value={form.password} onChange={onChange}
          error={errors.password} autoComplete="new-password"
          hint={form.password ? `Strength: ${['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score]}` : '8+ chars, Aa, 0-9, symbol'} />
        <Field label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword}
          onChange={onChange} error={errors.confirmPassword} autoComplete="new-password" />
        <div className="field">
          <label className="check">
            <input type="checkbox" name="acceptedTerms" checked={form.acceptedTerms} onChange={onChange} />
            I accept the terms of use
          </label>
          {errors.acceptedTerms && <span className="error-text">{errors.acceptedTerms}</span>}
        </div>
        <div className="actions span-all">
          <button className="btn" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setForm(initial); setErrors({}); }}>Clear</button>
        </div>
      </form>
    </>
  );
}
