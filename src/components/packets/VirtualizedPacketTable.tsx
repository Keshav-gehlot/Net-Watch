import React, { useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Packet } from "@/types/network";
import { Search } from "lucide-react";

interface VirtualizedPacketTableProps {
  packets: Packet[];
  height?: number;
}

const PacketRow: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: Packet[];
}> = ({ index, style, data }) => {
  const packet = data[index];
  
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

  return (
    <div style={style} className="flex items-center px-4 py-2 border-b hover:bg-gray-50">
      <div className="grid grid-cols-12 gap-2 w-full text-sm">
        <div className="col-span-2 font-mono text-xs">
          {new Date(packet.timestamp).toLocaleTimeString()}
        </div>
        <div className="col-span-2 font-mono text-xs">
          {packet.srcIp}
        </div>
        <div className="col-span-2 font-mono text-xs">
          {packet.dstIp}
        </div>
        <div className="col-span-1">
          <Badge className={getProtocolColor(packet.protocol)} variant="secondary">
            {packet.protocol}
          </Badge>
        </div>
        <div className="col-span-1 font-mono text-xs">
          {packet.srcPort || "-"}
        </div>
        <div className="col-span-1 font-mono text-xs">
          {packet.dstPort || "-"}
        </div>
        <div className="col-span-1 text-xs">
          {packet.length} B
        </div>
        <div className="col-span-2 font-mono text-xs truncate">
          {packet.payloadPreview || "-"}
        </div>
      </div>
    </div>
  );
};

export const VirtualizedPacketTable: React.FC<VirtualizedPacketTableProps> = ({ 
  packets, 
  height = 400 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPackets = useMemo(() => {
    if (!searchTerm) return packets;
    
    const term = searchTerm.toLowerCase();
    return packets.filter(packet => 
      packet.srcIp.toLowerCase().includes(term) ||
      packet.dstIp.toLowerCase().includes(term) ||
      packet.protocol.toLowerCase().includes(term) ||
      (packet.payloadPreview && packet.payloadPreview.toLowerCase().includes(term))
    );
  }, [packets, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Live Packets ({filteredPackets.length.toLocaleString()})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search packets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b font-semibold text-sm">
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Source IP</div>
          <div className="col-span-2">Destination IP</div>
          <div className="col-span-1">Protocol</div>
          <div className="col-span-1">Src Port</div>
          <div className="col-span-1">Dst Port</div>
          <div className="col-span-1">Length</div>
          <div className="col-span-2">Payload Preview</div>
        </div>
        
        {/* Virtualized List */}
        {filteredPackets.length > 0 ? (
          <List
            height={height}
            itemCount={filteredPackets.length}
            itemSize={50}
            itemData={filteredPackets}
            overscanCount={5}
          >
            {PacketRow}
          </List>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No packets found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
