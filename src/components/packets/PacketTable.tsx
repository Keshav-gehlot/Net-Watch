import { useMemo } from "react";
import { Packet } from "@/types/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PacketTable({ packets }: { packets: Packet[] }) {
  const rows = useMemo(() => packets.slice(0, 200), [packets]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Packets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
                <tr key={p.id} className="border-t">
                  <td className="py-2 pr-4">{new Date(p.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 pr-4">{p.srcIp}</td>
                  <td className="py-2 pr-4">{p.dstIp}</td>
                  <td className="py-2 pr-4">{p.protocol}</td>
                  <td className="py-2 pr-4">{p.srcPort ? `${p.srcPort} → ${p.dstPort ?? '-'}` : '-'}</td>
                  <td className="py-2 pr-4">{p.length}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.payloadPreview ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
