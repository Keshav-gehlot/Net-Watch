import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Packet, TransportProtocol } from "@/types/network";

export interface PacketFilter {
  searchTerm: string;
  protocol: TransportProtocol | "ALL";
  sourceIp: string;
  destinationIp: string;
  portRange: { min: number; max: number };
  timeRange: { start: number; end: number };
}

interface PacketFilterPanelProps {
  onFilterChange: (filter: PacketFilter) => void;
  packets: Packet[];
}

export const PacketFilterPanel = ({ onFilterChange, packets }: PacketFilterPanelProps) => {
  const [filter, setFilter] = useState<PacketFilter>({
    searchTerm: "",
    protocol: "ALL",
    sourceIp: "",
    destinationIp: "",
    portRange: { min: 0, max: 65535 },
    timeRange: { start: 0, end: Date.now() }
  });

  const updateFilter = (updates: Partial<PacketFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  const clearFilters = () => {
    const defaultFilter: PacketFilter = {
      searchTerm: "",
      protocol: "ALL",
      sourceIp: "",
      destinationIp: "",
      portRange: { min: 0, max: 65535 },
      timeRange: { start: 0, end: Date.now() }
    };
    setFilter(defaultFilter);
    onFilterChange(defaultFilter);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Packet Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search packets..."
            value={filter.searchTerm}
            onChange={(e) => updateFilter({ searchTerm: e.target.value })}
          />
          
          <Select value={filter.protocol} onValueChange={(value) => updateFilter({ protocol: value as TransportProtocol | "ALL" })}>
            <SelectTrigger>
              <SelectValue placeholder="Protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Protocols</SelectItem>
              <SelectItem value="TCP">TCP</SelectItem>
              <SelectItem value="UDP">UDP</SelectItem>
              <SelectItem value="ICMP">ICMP</SelectItem>
              <SelectItem value="ARP">ARP</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Source IP (e.g., 192.168.1.1)"
            value={filter.sourceIp}
            onChange={(e) => updateFilter({ sourceIp: e.target.value })}
          />
          
          <Input
            placeholder="Destination IP (e.g., 192.168.1.1)"
            value={filter.destinationIp}
            onChange={(e) => updateFilter({ destinationIp: e.target.value })}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {packets.length} packets
        </div>
      </CardContent>
    </Card>
  );
};
