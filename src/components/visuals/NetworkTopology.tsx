import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Packet } from "@/types/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  ip: string;
  type: "internal" | "external" | "gateway";
  packetCount: number;
  connections: string[];
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string;
  target: string;
  value: number;
  protocol: string;
}

interface NetworkTopologyProps {
  packets: Packet[];
  width?: number;
  height?: number;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({ 
  packets, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || packets.length === 0) return;

    // Process packets to create nodes and links
    const nodeMap = new Map<string, NetworkNode>();
    const linkMap = new Map<string, NetworkLink>();

    packets.forEach(packet => {
      // Create or update source node
      if (!nodeMap.has(packet.srcIp)) {
        nodeMap.set(packet.srcIp, {
          id: packet.srcIp,
          ip: packet.srcIp,
          type: isInternalIP(packet.srcIp) ? "internal" : "external",
          packetCount: 0,
          connections: []
        });
      }

      // Create or update destination node
      if (!nodeMap.has(packet.dstIp)) {
        nodeMap.set(packet.dstIp, {
          id: packet.dstIp,
          ip: packet.dstIp,
          type: isInternalIP(packet.dstIp) ? "internal" : "external",
          packetCount: 0,
          connections: []
        });
      }

      // Update packet counts
      nodeMap.get(packet.srcIp)!.packetCount++;
      nodeMap.get(packet.dstIp)!.packetCount++;

      // Create or update link
      const linkId = `${packet.srcIp}-${packet.dstIp}`;
      if (!linkMap.has(linkId)) {
        linkMap.set(linkId, {
          source: packet.srcIp,
          target: packet.dstIp,
          value: 0,
          protocol: packet.protocol
        });
      }
      linkMap.get(linkId)!.value++;

      // Update connections
      const srcNode = nodeMap.get(packet.srcIp)!;
      const dstNode = nodeMap.get(packet.dstIp)!;
      if (!srcNode.connections.includes(packet.dstIp)) {
        srcNode.connections.push(packet.dstIp);
      }
      if (!dstNode.connections.includes(packet.srcIp)) {
        dstNode.connections.push(packet.srcIp);
      }
    });

    const nodes = Array.from(nodeMap.values());
    const links = Array.from(linkMap.values());

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.1))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create arrow markers for links
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .style("fill", "#666");

    // Create links
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value))
      .attr("marker-end", "url(#arrow)");

    // Create nodes
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", d => Math.max(8, Math.sqrt(d.packetCount) * 2))
      .attr("fill", d => getNodeColor(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => setSelectedNode(d))
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add labels
    const labels = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .text(d => d.ip.split('.').pop() || d.ip)
      .style("font-size", "10px")
      .style("text-anchor", "middle")
      .style("fill", "#333")
      .style("pointer-events", "none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as NetworkNode).x!)
        .attr("y1", d => (d.source as NetworkNode).y!)
        .attr("x2", d => (d.target as NetworkNode).x!)
        .attr("y2", d => (d.target as NetworkNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y! + 25);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [packets, width, height]);

  const isInternalIP = (ip: string): boolean => {
    const parts = ip.split('.').map(Number);
    return (
      (parts[0] === 10) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 127)
    );
  };

  const getNodeColor = (type: string): string => {
    const colors = {
      internal: "#4CAF50",
      external: "#F44336",
      gateway: "#FF9800"
    };
    return colors[type as keyof typeof colors] || "#9E9E9E";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Network Topology</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Internal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>External</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Gateway</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <svg ref={svgRef} className="border rounded-lg"></svg>
          {selectedNode && (
            <div className="w-64 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Node Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>IP:</strong> {selectedNode.ip}</div>
                <div><strong>Type:</strong> {selectedNode.type}</div>
                <div><strong>Packets:</strong> {selectedNode.packetCount}</div>
                <div><strong>Connections:</strong> {selectedNode.connections.length}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
