import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserApi, parseError } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ROLES } from './Register.jsx';
import { utcShort } from '../format.js';

export default function Operators() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () => UserApi.list().then(setUsers).catch((e) => setError(parseError(e).message));
  useEffect(() => { load(); }, []);

  const remove = async (u) => {
    if (!window.confirm('Delete your own account? You will be logged out. Your saved plans are kept.')) return;
    try {
      await UserApi.remove(u.id);
      logout();
      load();
    } catch (err) {
      setError(parseError(err).message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Team" title="Operators" subtitle="People who can save plans. You can remove only your own account; your plans are kept.">
        <Link className="btn" to="/register">Add operator</Link>
      </PageHeader>
      <Alert onClose={() => setError('')}>{error}</Alert>
      <div className="card table-wrap">
        {users.length === 0 ? <p className="empty">No operators registered yet.</p> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organization</th><th>Registered</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="cell-title">{u.fullName}</span>
                    {user?.id === u.id && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>You</span>}
                    <div className="cell-sub">{u.phone || ''}</div>
                  </td>
                  <td>{u.email}</td>
                  <td>{ROLES.find(([v]) => v === u.role)?.[1] || u.role}</td>
                  <td>{u.organization || '-'}</td>
                  <td className="small">{utcShort(u.createdAt)}</td>
                  <td className="row-actions">{user?.id === u.id && <button className="link danger" onClick={() => remove(u)}>Remove</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
