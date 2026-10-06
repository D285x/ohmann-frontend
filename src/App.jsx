import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import EasterEgg from './components/EasterEgg.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LaunchPlanner from './pages/LaunchPlanner.jsx';
import TransferPlanner from './pages/TransferPlanner.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Sites from './pages/Sites.jsx';
import History from './pages/History.jsx';
import MissionDetail from './pages/MissionDetail.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Operators from './pages/Operators.jsx';
import Bodies from './pages/Bodies.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/launch" element={<LaunchPlanner />} />
          <Route path="/transfer" element={<TransferPlanner />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<MissionDetail />} />
          <Route path="/bodies" element={<Bodies />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/operators" element={<Operators />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <EasterEgg />
    </>
  );
}

function NotFound() {
  return (
    <section className="not-found">
      <span className="eyebrow">404</span>
      <h1>Off the trajectory</h1>
      <p className="muted">This page does not exist. It may have been moved, or the link was mistyped.</p>
      <Link className="btn" to="/">Back to the overview</Link>
    </section>
  );
}
