import { Packet, AlertItem } from "@/types/network";
import Papa from "papaparse";

export type ExportFormat = "csv" | "json" | "pcap";

export interface ExportOptions {
  format: ExportFormat;
  includeAlerts?: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
  filters?: {
    protocols?: string[];
    sourceIps?: string[];
    destinationIps?: string[];
  };
}

export class DataExporter {
  static exportPackets(packets: Packet[], alerts: AlertItem[], options: ExportOptions): void {
    const { format, includeAlerts = false, dateRange, filters } = options;

    // Filter packets based on options
    let filteredPackets = packets;
    
    if (dateRange) {
      filteredPackets = filteredPackets.filter(p => 
        p.timestamp >= dateRange.start && p.timestamp <= dateRange.end
      );
    }

    if (filters?.protocols?.length) {
      filteredPackets = filteredPackets.filter(p => 
        filters.protocols!.includes(p.protocol)
      );
    }

    if (filters?.sourceIps?.length) {
      filteredPackets = filteredPackets.filter(p => 
        filters.sourceIps!.some(ip => p.srcIp.includes(ip))
      );
    }

    if (filters?.destinationIps?.length) {
      filteredPackets = filteredPackets.filter(p => 
        filters.destinationIps!.some(ip => p.dstIp.includes(ip))
      );
    }

    switch (format) {
      case "csv":
        this.exportAsCSV(filteredPackets, alerts, includeAlerts);
        break;
      case "json":
        this.exportAsJSON(filteredPackets, alerts, includeAlerts);
        break;
      case "pcap":
        this.exportAsPCAP(filteredPackets);
        break;
    }
  }

  private static exportAsCSV(packets: Packet[], alerts: AlertItem[], includeAlerts: boolean): void {
    const packetData = packets.map(p => ({
      timestamp: new Date(p.timestamp).toISOString(),
      srcIp: p.srcIp,
      dstIp: p.dstIp,
      protocol: p.protocol,
      srcPort: p.srcPort || "",
      dstPort: p.dstPort || "",
      length: p.length,
      payloadPreview: p.payloadPreview || ""
    }));

    const csv = Papa.unparse(packetData);
    this.downloadFile(`netwatch-packets-${this.getTimestamp()}.csv`, csv, "text/csv");

    if (includeAlerts && alerts.length > 0) {
      const alertData = alerts.map(a => ({
        time: new Date(a.time).toISOString(),
        threat: a.threat,
        confidence: a.confidence,
        srcIp: a.srcIp || "",
        details: a.details || "",
        packetId: a.packetId || ""
      }));

      const alertCsv = Papa.unparse(alertData);
      this.downloadFile(`netwatch-alerts-${this.getTimestamp()}.csv`, alertCsv, "text/csv");
    }
  }

  private static exportAsJSON(packets: Packet[], alerts: AlertItem[], includeAlerts: boolean): void {
    const exportData: any = {
      exportTime: new Date().toISOString(),
      totalPackets: packets.length,
      packets: packets
    };

    if (includeAlerts) {
      exportData.totalAlerts = alerts.length;
      exportData.alerts = alerts;
    }

    const json = JSON.stringify(exportData, null, 2);
    this.downloadFile(`netwatch-data-${this.getTimestamp()}.json`, json, "application/json");
  }

  private static exportAsPCAP(packets: Packet[]): void {
    // Note: This would require a library like pcap-writer or similar
    // For now, we'll create a JSON representation that could be converted
    alert("PCAP export requires additional processing. Use CSV or JSON for now.");
  }

  private static downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  private static getTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  }

  static generateReport(packets: Packet[], alerts: AlertItem[]): string {
    const now = new Date();
    const startTime = packets.length > 0 ? new Date(Math.min(...packets.map(p => p.timestamp))) : now;
    const endTime = packets.length > 0 ? new Date(Math.max(...packets.map(p => p.timestamp))) : now;
    
    const protocolStats = packets.reduce((acc, p) => {
      acc[p.protocol] = (acc[p.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTalkers = packets.reduce((acc, p) => {
      acc[p.srcIp] = (acc[p.srcIp] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedTalkers = Object.entries(topTalkers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const threatStats = alerts.reduce((acc, a) => {
      acc[a.threat] = (acc[a.threat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `
# NetWatch Network Analysis Report

**Generated:** ${now.toLocaleString()}
**Analysis Period:** ${startTime.toLocaleString()} - ${endTime.toLocaleString()}

## Summary
- **Total Packets:** ${packets.length.toLocaleString()}
- **Total Alerts:** ${alerts.length.toLocaleString()}
- **Analysis Duration:** ${Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)} minutes

## Protocol Distribution
${Object.entries(protocolStats).map(([proto, count]) => 
  `- **${proto}:** ${count.toLocaleString()} packets (${((count/packets.length)*100).toFixed(1)}%)`
).join('\n')}

## Top Talkers
${sortedTalkers.map(([ip, count], i) => 
  `${i+1}. **${ip}:** ${count.toLocaleString()} packets`
).join('\n')}

## Security Alerts
${Object.entries(threatStats).map(([threat, count]) => 
  `- **${threat}:** ${count.toLocaleString()} alerts`
).join('\n')}

## Recent High-Confidence Alerts
${alerts
  .filter(a => a.confidence > 80)
  .slice(0, 5)
  .map(a => `- **${a.threat}** (${a.confidence}% confidence): ${a.details} - ${new Date(a.time).toLocaleString()}`)
  .join('\n')}
`;
  }
}
