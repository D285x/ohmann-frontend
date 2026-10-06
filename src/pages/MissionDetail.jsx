import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MissionApi, parseError } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import MissionResult from '../components/MissionResult.jsx';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    MissionApi.get(id).then(setMission).catch((e) => setError(parseError(e).message));
  }, [id]);

  const download = async () => {
    try {
      const res = await MissionApi.exportCsv(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mission_${id}_trajectory.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(parseError(e).message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this mission?')) return;
    try {
      await MissionApi.remove(id);
      navigate('/history');
    } catch (e) {
      setError(parseError(e).message);
    }
  };

  return (
    <>
      <p><Link to="/history">‹ History</Link></p>
      <Alert onClose={() => setError('')}>{error}</Alert>
      {!mission && !error && <p className="muted">Loading…</p>}
      {mission && (
        <MissionResult
          result={mission}
          actions={
            <>
              <button className="btn" onClick={download}>Export trajectory CSV</button>
              <button className="btn btn-danger" onClick={remove}>Delete</button>
            </>
          }
        />
      )}
    </>
  );
}
