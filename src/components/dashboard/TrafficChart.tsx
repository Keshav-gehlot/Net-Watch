import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  data: { time: string; pps: number }[];
}

const TrafficChart = ({ data }: Props) => {
  return (
    <div className="h-56 w-full rounded-lg border" style={{ boxShadow: "var(--shadow-elevated)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.6} />
              <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Tooltip formatter={(v: any) => [`${v} pps`, ""]} />
          <Area type="monotone" dataKey="pps" stroke="hsl(var(--brand))" fillOpacity={1} fill="url(#colorPps)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrafficChart;
