import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p style={{ maxWidth: 320 }}>
          OhMann plans launch trajectories and interplanetary transfers from your own mission data.
        </p>
        <nav className="footer-links" aria-label="Footer">
          <div>
            <h4>Plan</h4>
            <Link to="/launch">Launch Planner</Link>
            <Link to="/transfer">Transfer Planner</Link>
            <Link to="/history">History</Link>
          </div>
          <div>
            <h4>Data</h4>
            <Link to="/vehicles">Vehicles</Link>
            <Link to="/sites">Launch sites</Link>
            <Link to="/bodies">Celestial bodies</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/register">Sign up</Link>
            <Link to="/login">Log in</Link>
            <Link to="/operators">Operators</Link>
          </div>
        </nav>
      </div>
      <div className="footer-base">ESE3104 Full Stack Java-1 · Anurag University · React, Spring Boot and MySQL</div>
    </footer>
  );
}
