import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sankey, ScatterChart, Scatter } from "recharts";
import { Packet } from "@/types/network";

interface NetworkFlowProps {
  packets: Packet[];
}

export const NetworkFlowChart: React.FC<NetworkFlowProps> = ({ packets }) => {
  const flowData = useMemo(() => {
    if (!packets.length) return { protocolFlow: [], ipFlow: [], portFlow: [] };

    // Protocol distribution
    const protocolCounts = packets.reduce((acc, packet) => {
      acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const protocolFlow = Object.entries(protocolCounts).map(([protocol, count]) => ({
      name: protocol,
      value: count,
      percentage: ((count / packets.length) * 100).toFixed(1)
    }));

    // Top IP communications
    const ipPairs = packets.reduce((acc, packet) => {
      const key = `${packet.srcIp} → ${packet.dstIp}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ipFlow = Object.entries(ipPairs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pair, count]) => {
        const [src, dst] = pair.split(' → ');
        return {
          name: pair,
          source: src,
          target: dst,
          value: count,
          bandwidth: count * 1024 // Simulated bandwidth
        };
      });

    // Port activity
    const portActivity = packets
      .filter(p => p.dstPort)
      .reduce((acc, packet) => {
        const port = packet.dstPort!;
        acc[port] = (acc[port] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const portFlow = Object.entries(portActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([port, count]) => ({
        port: Number(port),
        name: getPortName(Number(port)),
        value: count,
        risk: getPortRisk(Number(port))
      }));

    return { protocolFlow, ipFlow, portFlow };
  }, [packets]);

  const getPortName = (port: number): string => {
    const commonPorts: Record<number, string> = {
      80: "HTTP", 443: "HTTPS", 53: "DNS", 22: "SSH", 
      21: "FTP", 25: "SMTP", 110: "POP3", 143: "IMAP",
      3389: "RDP", 3306: "MySQL", 5432: "PostgreSQL",
      6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
    };
    return commonPorts[port] || `Port ${port}`;
  };

  const getPortRisk = (port: number): "Low" | "Medium" | "High" => {
    const highRisk = [21, 23, 135, 139, 445, 1433, 3389];
    const mediumRisk = [22, 25, 110, 143, 993, 995];
    
    if (highRisk.includes(port)) return "High";
    if (mediumRisk.includes(port)) return "Medium";
    return "Low";
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
  const RISK_COLORS = { Low: '#4CAF50', Medium: '#FF9800', High: '#F44336' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Protocol Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={flowData.protocolFlow}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {flowData.protocolFlow.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Port Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Top Destination Ports</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flowData.portFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} packets`,
                  `Port ${props.payload.port} (${props.payload.risk} Risk)`
                ]}
              />
              <Bar dataKey="value">
                {flowData.portFlow.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Communications */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top IP Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flowData.ipFlow.slice(0, 8).map((flow, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="font-mono text-sm">{flow.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{flow.value} packets</div>
                  <div className="text-sm text-gray-500">{(flow.bandwidth / 1024).toFixed(1)}KB</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
