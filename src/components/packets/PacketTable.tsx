import { useMemo } from "react";
import { Packet } from "@/types/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PacketTable({ packets, connected = false, wsStatus }: { 
  packets: Packet[];
  connected?: boolean;
  wsStatus?: {
    isConnecting: boolean;
    reconnectCount: number;
    error: any;
  };
}) {
  const rows = useMemo(() => packets.slice(0, 200), [packets]);
  
  const getProtocolColor = (protocol: string) => {
    const colors = {
      TCP: "bg-blue-100 text-blue-800",
      UDP: "bg-green-100 text-green-800",
      ICMP: "bg-yellow-100 text-yellow-800",
      ARP: "bg-purple-100 text-purple-800",
      OTHER: "bg-gray-100 text-gray-800"
    };
    return colors[protocol as keyof typeof colors] || colors.OTHER;
  };

  // Mobile card view for small screens
  const MobilePacketCard = ({ packet }: { packet: Packet }) => (
    <div className="border rounded-lg p-3 mb-3 bg-card">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-muted-foreground">
          {new Date(packet.timestamp).toLocaleTimeString()}
        </div>
        <Badge className={getProtocolColor(packet.protocol)} variant="secondary">
          {packet.protocol}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">From:</span>
          <div className="font-mono text-xs">{packet.srcIp}</div>
          {packet.srcPort && <div className="text-xs text-muted-foreground">Port {packet.srcPort}</div>}
        </div>
        <div>
          <span className="text-muted-foreground">To:</span>
          <div className="font-mono text-xs">{packet.dstIp}</div>
          {packet.dstPort && <div className="text-xs text-muted-foreground">Port {packet.dstPort}</div>}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Size: {packet.length} bytes</span>
        {packet.payloadPreview && (
          <span className="font-mono truncate max-w-24">
            {packet.payloadPreview}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Packets ({rows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Destination</th>
                <th className="py-2 pr-4">Proto</th>
                <th className="py-2 pr-4">Ports</th>
                <th className="py-2 pr-4">Len</th>
                <th className="py-2 pr-4">Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="py-2 pr-4 font-mono text-xs">{new Date(p.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.srcIp}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.dstIp}</td>
                  <td className="py-2 pr-4">
                    <Badge className={getProtocolColor(p.protocol)} variant="secondary">
                      {p.protocol}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.srcPort ? `${p.srcPort} → ${p.dstPort ?? '-'}` : '-'}</td>
                  <td className="py-2 pr-4 text-xs">{p.length}B</td>
                  <td className="py-2 pr-4 text-muted-foreground font-mono text-xs max-w-24 truncate">{p.payloadPreview ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          {rows.slice(0, 20).map((packet) => (
            <MobilePacketCard key={packet.id} packet={packet} />
          ))}
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
            {wsStatus?.isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Connecting to NetWatch agent...</p>
              </>
            ) : !connected ? (
              <>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                </div>
                <p>No connection to NetWatch agent</p>
                <p className="text-xs">Start the Python agent to see real packets</p>
              </>
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
                <p>Connected - Waiting for packets...</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
