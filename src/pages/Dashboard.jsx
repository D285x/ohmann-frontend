import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsApi, SiteApi, parseError } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import CountUp from '../components/CountUp.jsx';
import HeroGlobe from '../viz/HeroGlobe.jsx';
import useReveal from '../hooks/useReveal.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Rocket, Orbit, Database } from '../components/Icons.jsx';
import { num } from '../format.js';

const FEATURES = [
  {
    key: 'launch',
    icon: <Rocket />,
    color: 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
    title: 'Launch Planner',
    text: 'Simulates the full ascent with drag, gravity and staging, then searches for the best pitch program.',
    points: ['LEO, sun-synchronous and GTO', 'Delta-v budget and payload capacity', 'Launch azimuth and windows'],
    to: '/launch',
    cta: 'Plan a launch',
  },
  {
    key: 'transfer',
    icon: <Orbit />,
    color: 'linear-gradient(135deg, #bf5af2, #ff375f)',
    title: 'Transfer Planner',
    text: 'Finds when two worlds line up and what it takes to travel between them.',
    points: ['Hohmann windows from real positions', 'C3, departure and capture burns', 'Animated orbital simulation'],
    to: '/transfer',
    cta: 'Plan a transfer',
  },
  {
    key: 'data',
    icon: <Database />,
    color: 'linear-gradient(135deg, #30d158, #0a84ff)',
    title: 'Your mission data',
    text: 'Vehicles, stages, launch sites and celestial bodies are all yours to add and edit.',
    points: ['Multi-stage vehicle editor', 'Custom launch corridors', 'Dwarf planets and asteroids'],
    to: '/vehicles',
    cta: 'Manage data',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sites, setSites] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([StatsApi.get(), SiteApi.list()])
      .then(([st, si]) => { setStats(st); setSites(si); })
      .catch((e) => setError(parseError(e).message));
  }, []);

  useReveal([stats]);

  const feasiblePct = stats?.missions ? Math.round((stats.feasibleMissions / stats.missions) * 100) : 0;

  return (
    <>
      <section className="landing-hero">
        <span className="eyebrow">{user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Mission planning'}</span>
        <h1 className="display">
          Every orbit starts with <span className="grad-text">a&nbsp;better trajectory.</span>
        </h1>
        <p className="lead">
          Simulate ascents, optimise launch trajectories and find interplanetary windows using your own vehicles, sites
          and destinations.
        </p>
        <div className="actions">
          <Link className="btn btn-lg" to="/launch">Plan a launch</Link>
          <Link className="btn btn-lg btn-ghost" to="/transfer">Plan a transfer</Link>
        </div>

        <div className="hero-stage">
          <HeroGlobe sites={sites} />
          <div className="hero-caption">
            <span className="live-dot" />
            {sites.length} launch site{sites.length === 1 ? '' : 's'} · drag to rotate
          </div>
        </div>
      </section>

      <Alert onClose={() => setError('')}>{error}</Alert>

      {stats && (
        <section className="section reveal">
          <div className="stat-row">
            {[
              ['Vehicles', stats.vehicles],
              ['Launch sites', stats.sites],
              ['Bodies', stats.bodies],
              ['Operators', stats.operators],
              ['Launch plans', stats.missions],
              ['Transfer plans', stats.transfers],
            ].map(([label, value]) => (
              <div key={label} className="stat">
                <div className="stat-value"><CountUp value={value} /></div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head reveal">
          <h2>Everything a mission needs.</h2>
          <p className="lead">From the launch pad to another planet, in two planners that share one catalogue.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.key} className="feature reveal">
              <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <ul>{f.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <Link className="more" to={f.to}>{f.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      {stats && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Fleet performance.</h2>
            <p className="lead">Results across every saved launch plan.</p>
          </div>
          <div className="two-col">
            <div className="card" style={{ margin: 0 }}>
              <h3>By vehicle</h3>
              <table className="table">
                <thead>
                  <tr><th>Vehicle</th><th className="num">Plans</th><th className="num">Avg. max payload</th><th className="num">Best margin</th></tr>
                </thead>
                <tbody>
                  {stats.vehicleStats.map((v) => (
                    <tr key={v.vehicle}>
                      <td className="cell-title">{v.vehicle}</td>
                      <td className="num">{v.missions}</td>
                      <td className="num">{v.missions ? `${num(v.avgMaxPayloadKg)} kg` : '–'}</td>
                      <td className="num">{v.missions ? `${num(v.bestMarginMs)} m/s` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <h3>By orbit</h3>
              {Object.keys(stats.missionsByOrbit).length === 0 ? (
                <p className="empty">No saved launch plans yet. <Link to="/launch">Create one</Link></p>
              ) : (
                <>
                  <ul className="bars">
                    {Object.entries(stats.missionsByOrbit).map(([orbit, n]) => (
                      <li key={orbit}>
                        <span>{orbit}</span>
                        <div className="bar"><div style={{ width: `${(n / stats.missions) * 100}%` }} /></div>
                        <span className="num">{n}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="feasible-ring" style={{ '--pct': feasiblePct }}>
                    <div>
                      <strong>{feasiblePct}%</strong>
                      <span className="muted small">feasible</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="cta-panel reveal">
        <h2>Ready when you are.</h2>
        <p className="lead">Pick a vehicle, choose a pad and let the optimiser do the rest.</p>
        <div className="actions">
          <Link className="btn btn-lg" to="/launch">Open Launch Planner</Link>
          {!user && <Link className="btn btn-lg btn-ghost" to="/register">Create an account</Link>}
        </div>
      </section>
    </>
  );
}
