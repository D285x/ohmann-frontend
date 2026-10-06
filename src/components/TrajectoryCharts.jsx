import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Label,
} from 'recharts';

const axis = { stroke: '#86868b', fontSize: 11 };
const grid = <CartesianGrid stroke="rgba(134,134,139,0.18)" vertical={false} />;
const tip = { contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }, labelStyle: { color: 'var(--text-2)', fontWeight: 600 } };

function Chart({ title, data, x, y, xLabel, yLabel, color }) {
  return (
    <div className="chart">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 20, left: 8 }}>
          {grid}
          <XAxis dataKey={x} type="number" domain={['dataMin', 'dataMax']} tick={axis}
            tickFormatter={(v) => Math.round(v)}>
            <Label value={xLabel} position="insideBottom" offset={-12} fill="#86868b" fontSize={12} />
          </XAxis>
          <YAxis tick={axis} tickFormatter={(v) => Math.round(v)}>
            <Label value={yLabel} angle={-90} position="insideLeft" fill="#86868b" fontSize={12} />
          </YAxis>
          <Tooltip {...tip} formatter={(v) => Number(v).toFixed(1)} labelFormatter={(v) => `${xLabel}: ${Number(v).toFixed(1)}`} />
          <Line type="monotone" dataKey={y} stroke={color} dot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrajectoryCharts({ points }) {
  const powered = points.filter((p) => p.stage > 0);
  return (
    <div className="chart-grid">
      <Chart title="Ascent profile" data={points} x="downrangeKm" y="altitudeKm"
        xLabel="Downrange (km)" yLabel="Altitude (km)" color="#0a84ff" />
      <Chart title="Inertial velocity" data={points} x="timeS" y="velocityMs"
        xLabel="Time (s)" yLabel="Velocity (m/s)" color="#ff9f0a" />
      <Chart title="Thrust pitch (powered flight)" data={powered} x="timeS" y="pitchDeg"
        xLabel="Time (s)" yLabel="Pitch (deg)" color="#5e5ce6" />
      <Chart title="Dynamic pressure" data={powered} x="timeS" y="dynamicPressureKPa"
        xLabel="Time (s)" yLabel="q (kPa)" color="#ff375f" />
    </div>
  );
}
