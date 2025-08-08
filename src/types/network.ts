export type TransportProtocol = "TCP" | "UDP" | "ICMP" | "ARP" | "OTHER";

export interface Packet {
  id: string;
  timestamp: number; // epoch ms
  srcIp: string;
  dstIp: string;
  protocol: TransportProtocol;
  srcPort?: number;
  dstPort?: number;
  length: number;
  payloadPreview?: string;
}

export type ThreatType = "Port Scan" | "DDoS" | "Suspicious Protocol";

export interface AlertItem {
  id: string;
  time: number;
  packetId?: string;
  srcIp?: string;
  threat: ThreatType;
  confidence: number; // 0-100
  details?: string;
}
