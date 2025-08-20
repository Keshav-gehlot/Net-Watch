import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: { time: string; pps: number }[];
}

const TrafficChart = ({ data }: Props) => {
  // Ensure we have valid data
  const hasValidData = data && data.length > 0;
  const hasAnyPositiveData = hasValidData && data.some(d => d.pps > 0);
  const maxPps = hasValidData ? Math.max(...data.map(d => d.pps || 0), 1) : 100;
  const currentPps = hasValidData ? (data[data.length - 1]?.pps || 0) : 0;

  // Show chart even with zero data, but indicate waiting state
  const chartData = hasValidData ? data : [];

  return (
    <Card className="h-72">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Traffic Overview (2s intervals)</CardTitle>
        <div className="text-2xl font-bold">{currentPps} pps</div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-48 w-full px-2">
          {hasValidData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorPps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  domain={[0, maxPps]}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value} pps`, "Packets/sec"]}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pps" 
                  stroke="hsl(var(--brand))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPps)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-sm">Initializing traffic monitor...</div>
                <div className="text-xs mt-1">Chart will appear when data is available</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficChart;
