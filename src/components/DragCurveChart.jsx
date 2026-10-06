import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Label } from 'recharts';

const axis = { stroke: '#86868b', fontSize: 11 };
const tip = { contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }, labelStyle: { color: 'var(--text-2)', fontWeight: 600 } };

/** Small Cd-vs-Mach chart for a vehicle's shockFLOW / analytic-fallback drag curve. */
export default function DragCurveChart({ points }) {
  if (!points?.length) return null;
  return (
    <div className="chart">
      <h4>Drag coefficient vs. Mach</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 20, left: 8 }}>
          <CartesianGrid stroke="rgba(134,134,139,0.18)" vertical={false} />
          <XAxis dataKey="mach" type="number" domain={['dataMin', 'dataMax']} tick={axis}
            tickFormatter={(v) => v.toFixed(1)}>
            <Label value="Mach" position="insideBottom" offset={-12} fill="#86868b" fontSize={12} />
          </XAxis>
          <YAxis tick={axis} tickFormatter={(v) => v.toFixed(2)}>
            <Label value="Cd" angle={-90} position="insideLeft" fill="#86868b" fontSize={12} />
          </YAxis>
          <Tooltip {...tip} formatter={(v) => [Number(v).toFixed(3), 'Cd']} labelFormatter={(v) => `Mach ${Number(v).toFixed(2)}`} />
          <Line type="monotone" dataKey="cd" stroke="#ff375f" dot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
