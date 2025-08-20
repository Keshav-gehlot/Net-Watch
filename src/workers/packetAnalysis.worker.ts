// Web Worker for heavy packet analysis tasks
import { Packet, AlertItem } from "../types/network";

export interface AnalysisTask {
  id: string;
  type: "threat-analysis" | "pattern-detection" | "statistics" | "geolocation";
  packets: Packet[];
  config?: Record<string, any>;
}

export interface AnalysisResult {
  taskId: string;
  type: string;
  result: any;
  processingTime: number;
}

// Threat detection patterns
const THREAT_PATTERNS = {
  portScan: {
    threshold: 20,
    timeWindow: 60000 // 1 minute
  },
  ddos: {
    threshold: 1000,
    timeWindow: 30000 // 30 seconds
  },
  suspiciousPayloads: [
    /eval\(/gi,
    /<script/gi,
    /\$\(\s*\)/gi,
    /base64_decode/gi,
    /exec\(/gi
  ]
};

// Statistics calculation
function calculateStatistics(packets: Packet[]) {
  const stats = {
    totalPackets: packets.length,
    totalBytes: packets.reduce((sum, p) => sum + p.length, 0),
    protocols: {} as Record<string, number>,
    topSources: {} as Record<string, number>,
    topDestinations: {} as Record<string, number>,
    portActivity: {} as Record<number, number>,
    timeRange: {
      start: Math.min(...packets.map(p => p.timestamp)),
      end: Math.max(...packets.map(p => p.timestamp))
    },
    packetsPerSecond: 0,
    averagePacketSize: 0
  };

  // Calculate protocol distribution
  packets.forEach(packet => {
    stats.protocols[packet.protocol] = (stats.protocols[packet.protocol] || 0) + 1;
    stats.topSources[packet.srcIp] = (stats.topSources[packet.srcIp] || 0) + 1;
    stats.topDestinations[packet.dstIp] = (stats.topDestinations[packet.dstIp] || 0) + 1;
    
    if (packet.dstPort) {
      stats.portActivity[packet.dstPort] = (stats.portActivity[packet.dstPort] || 0) + 1;
    }
  });

  // Calculate derived metrics
  const timeSpan = (stats.timeRange.end - stats.timeRange.start) / 1000; // seconds
  stats.packetsPerSecond = timeSpan > 0 ? stats.totalPackets / timeSpan : 0;
  stats.averagePacketSize = stats.totalPackets > 0 ? stats.totalBytes / stats.totalPackets : 0;

  return stats;
}

// Threat analysis
function analyzeThreat(packets: Packet[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = Date.now();
  
  // Port scan detection
  const portHits = new Map<string, Set<number>>();
  
  packets.forEach(packet => {
    if (packet.dstPort) {
      const ports = portHits.get(packet.srcIp) || new Set<number>();
      ports.add(packet.dstPort);
      portHits.set(packet.srcIp, ports);
    }
  });

  // Check for port scans
  portHits.forEach((ports, srcIp) => {
    if (ports.size >= THREAT_PATTERNS.portScan.threshold) {
      alerts.push({
        id: crypto.randomUUID(),
        time: now,
        srcIp,
        threat: "Port Scan",
        confidence: Math.min(95, 50 + ports.size * 2),
        details: `${srcIp} scanned ${ports.size} distinct ports`
      });
    }
  });

  // DDoS detection - high packet rate from single source
  const packetCounts = new Map<string, number>();
  packets.forEach(packet => {
    packetCounts.set(packet.srcIp, (packetCounts.get(packet.srcIp) || 0) + 1);
  });

  packetCounts.forEach((count, srcIp) => {
    if (count >= THREAT_PATTERNS.ddos.threshold) {
      alerts.push({
        id: crypto.randomUUID(),
        time: now,
        srcIp,
        threat: "DDoS",
        confidence: Math.min(98, 40 + count / 10),
        details: `${srcIp} sent ${count} packets in short timeframe`
      });
    }
  });

  // Payload analysis
  packets.forEach(packet => {
    if (packet.payloadPreview) {
      THREAT_PATTERNS.suspiciousPayloads.forEach(pattern => {
        if (pattern.test(packet.payloadPreview!)) {
          alerts.push({
            id: crypto.randomUUID(),
            time: now,
            packetId: packet.id,
            srcIp: packet.srcIp,
            threat: "Suspicious Protocol",
            confidence: 75,
            details: `Suspicious payload pattern detected: ${pattern.source}`
          });
        }
      });
    }
  });

  return alerts;
}

// Pattern detection
function detectPatterns(packets: Packet[]) {
  const patterns = {
    communicationPairs: new Map<string, number>(),
    timeBasedPatterns: [] as Array<{ time: number; count: number }>,
    protocolAnomalies: [] as Array<{ protocol: string; anomaly: string; severity: number }>,
    geographicPatterns: new Map<string, string[]>()
  };

  // Communication patterns
  packets.forEach(packet => {
    const pair = `${packet.srcIp}:${packet.dstIp}`;
    patterns.communicationPairs.set(pair, (patterns.communicationPairs.get(pair) || 0) + 1);
  });

  // Time-based patterns (packets per 5-second intervals)
  const timeIntervals = new Map<number, number>();
  packets.forEach(packet => {
    const interval = Math.floor(packet.timestamp / 5000) * 5000;
    timeIntervals.set(interval, (timeIntervals.get(interval) || 0) + 1);
  });

  patterns.timeBasedPatterns = Array.from(timeIntervals.entries())
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time - b.time);

  // Protocol anomalies
  const protocolCounts = new Map<string, number>();
  packets.forEach(packet => {
    protocolCounts.set(packet.protocol, (protocolCounts.get(packet.protocol) || 0) + 1);
  });

  const totalPackets = packets.length;
  protocolCounts.forEach((count, protocol) => {
    const percentage = (count / totalPackets) * 100;
    
    // Unusual protocol usage
    if (protocol === "ICMP" && percentage > 20) {
      patterns.protocolAnomalies.push({
        protocol,
        anomaly: "Unusually high ICMP traffic",
        severity: 7
      });
    }
    
    if (protocol === "ARP" && percentage > 10) {
      patterns.protocolAnomalies.push({
        protocol,
        anomaly: "High ARP traffic may indicate scanning",
        severity: 6
      });
    }
  });

  return patterns;
}

// Simulated geolocation lookup
function getGeolocation(ip: string): { country: string; city: string; risk: number } {
  // This would normally call a real geolocation API
  const regions = [
    { country: "US", city: "New York", risk: 1 },
    { country: "CA", city: "Toronto", risk: 1 },
    { country: "GB", city: "London", risk: 2 },
    { country: "DE", city: "Berlin", risk: 2 },
    { country: "CN", city: "Beijing", risk: 6 },
    { country: "RU", city: "Moscow", risk: 8 },
    { country: "IR", city: "Tehran", risk: 9 },
    { country: "KP", city: "Pyongyang", risk: 10 }
  ];
  
  const hash = ip.split('.').reduce((sum, part) => sum + parseInt(part), 0);
  return regions[hash % regions.length];
}

// Main message handler
self.onmessage = function(e: MessageEvent<AnalysisTask>) {
  const { id, type, packets, config } = e.data;
  const startTime = performance.now();
  
  let result: any;
  
  try {
    switch (type) {
      case "threat-analysis":
        result = analyzeThreat(packets);
        break;
        
      case "pattern-detection":
        result = detectPatterns(packets);
        break;
        
      case "statistics":
        result = calculateStatistics(packets);
        break;
        
      case "geolocation":
        result = packets.map(packet => ({
          ip: packet.srcIp,
          location: getGeolocation(packet.srcIp)
        }));
        break;
        
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }
    
    const processingTime = performance.now() - startTime;
    
    self.postMessage({
      taskId: id,
      type,
      result,
      processingTime
    } as AnalysisResult);
    
  } catch (error) {
    self.postMessage({
      taskId: id,
      type,
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
      processingTime: performance.now() - startTime
    });
  }
};

export {};
