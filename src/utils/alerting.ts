import { AlertItem, ThreatType } from "@/types/network";

export type AlertSeverity = "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "New" | "Acknowledged" | "Investigating" | "Resolved" | "False Positive";

export interface EnhancedAlert extends AlertItem {
  severity: AlertSeverity;
  status: AlertStatus;
  assignedTo?: string;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  notes?: string[];
  relatedAlerts?: string[]; // IDs of related alerts
  mitreTechniques?: string[]; // MITRE ATT&CK technique IDs
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownMinutes: number;
  lastTriggered?: number;
}

export interface AlertCondition {
  type: "protocol" | "ip" | "port" | "payload" | "frequency" | "geolocation";
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "regex" | "greater" | "less";
  value: string | number;
  timeWindow?: number; // minutes
}

export interface AlertAction {
  type: "email" | "webhook" | "log" | "block";
  config: Record<string, any>;
}

export class AlertManager {
  private static rules: AlertRule[] = [
    {
      id: "port-scan-advanced",
      name: "Advanced Port Scan Detection",
      description: "Detects when a single IP scans multiple ports within a short time",
      enabled: true,
      severity: "High",
      cooldownMinutes: 5,
      conditions: [
        { type: "frequency", operator: "greater", value: 20, timeWindow: 1 }
      ],
      actions: [
        { type: "log", config: { level: "warn" } }
      ]
    },
    {
      id: "suspicious-dns",
      name: "Suspicious DNS Queries",
      description: "Detects DNS queries to known malicious domains",
      enabled: true,
      severity: "Medium",
      cooldownMinutes: 1,
      conditions: [
        { type: "port", operator: "equals", value: 53 },
        { type: "payload", operator: "regex", value: "\\.(tk|ml|cf|ga)\\." }
      ],
      actions: [
        { type: "log", config: { level: "warn" } }
      ]
    },
    {
      id: "data-exfiltration",
      name: "Potential Data Exfiltration",
      description: "Large outbound data transfers to external IPs",
      enabled: true,
      severity: "Critical",
      cooldownMinutes: 10,
      conditions: [
        { type: "frequency", operator: "greater", value: 1000, timeWindow: 5 }
      ],
      actions: [
        { type: "log", config: { level: "error" } },
        { type: "email", config: { subject: "Critical Alert: Potential Data Exfiltration" } }
      ]
    }
  ];

  static getSeverityScore(severity: AlertSeverity): number {
    const scores = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    return scores[severity];
  }

  static getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      Low: "text-blue-600 bg-blue-50",
      Medium: "text-yellow-600 bg-yellow-50", 
      High: "text-orange-600 bg-orange-50",
      Critical: "text-red-600 bg-red-50"
    };
    return colors[severity];
  }

  static getStatusColor(status: AlertStatus): string {
    const colors = {
      New: "text-red-600 bg-red-50",
      Acknowledged: "text-yellow-600 bg-yellow-50",
      Investigating: "text-blue-600 bg-blue-50",
      Resolved: "text-green-600 bg-green-50",
      "False Positive": "text-gray-600 bg-gray-50"
    };
    return colors[status];
  }

  static enhanceAlert(alert: AlertItem): EnhancedAlert {
    const severity = this.calculateSeverity(alert);
    
    return {
      ...alert,
      severity,
      status: "New",
      mitreTechniques: this.getMitreTechniques(alert.threat),
      notes: []
    };
  }

  private static calculateSeverity(alert: AlertItem): AlertSeverity {
    const { threat, confidence } = alert;
    
    if (confidence >= 90) {
      return threat === "DDoS" ? "Critical" : "High";
    } else if (confidence >= 70) {
      return "High";
    } else if (confidence >= 50) {
      return "Medium";
    } else {
      return "Low";
    }
  }

  private static getMitreTechniques(threat: ThreatType): string[] {
    const mapping: Record<ThreatType, string[]> = {
      "Port Scan": ["T1046"], // Network Service Scanning
      "DDoS": ["T1499"], // Endpoint Denial of Service
      "Suspicious Protocol": ["T1071"] // Application Layer Protocol
    };
    
    return mapping[threat] || [];
  }

  static correlateAlerts(alerts: EnhancedAlert[]): EnhancedAlert[] {
    // Simple correlation based on source IP and time proximity
    const correlated = alerts.map(alert => ({ ...alert }));
    
    alerts.forEach((alert, index) => {
      const related = alerts
        .filter((other, otherIndex) => 
          otherIndex !== index &&
          other.srcIp === alert.srcIp &&
          Math.abs(other.time - alert.time) < 5 * 60 * 1000 // 5 minutes
        )
        .map(related => related.id);
      
      if (related.length > 0) {
        correlated[index].relatedAlerts = related;
      }
    });
    
    return correlated;
  }

  static generateAlertSummary(alerts: EnhancedAlert[]): {
    total: number;
    bySeverity: Record<AlertSeverity, number>;
    byStatus: Record<AlertStatus, number>;
    byThreat: Record<ThreatType, number>;
    topSources: Array<{ ip: string; count: number }>;
  } {
    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const byStatus = alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {} as Record<AlertStatus, number>);

    const byThreat = alerts.reduce((acc, alert) => {
      acc[alert.threat] = (acc[alert.threat] || 0) + 1;
      return acc;
    }, {} as Record<ThreatType, number>);

    const sourceMap = alerts.reduce((acc, alert) => {
      if (alert.srcIp) {
        acc[alert.srcIp] = (acc[alert.srcIp] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    return {
      total: alerts.length,
      bySeverity,
      byStatus,
      byThreat,
      topSources
    };
  }

  static createIncidentReport(alerts: EnhancedAlert[]): string {
    const summary = this.generateAlertSummary(alerts);
    const highPriorityAlerts = alerts.filter(a => 
      a.severity === "Critical" || a.severity === "High"
    );

    return `
# Security Incident Report

**Generated:** ${new Date().toLocaleString()}
**Alert Count:** ${summary.total}

## Executive Summary
${summary.total > 0 ? `
Security monitoring detected ${summary.total} alerts requiring attention.
${highPriorityAlerts.length} alerts are classified as high priority.
` : "No security alerts detected during this period."}

## Alert Breakdown
### By Severity
${Object.entries(summary.bySeverity).map(([severity, count]) => 
  `- **${severity}:** ${count}`
).join('\n')}

### By Status
${Object.entries(summary.byStatus).map(([status, count]) => 
  `- **${status}:** ${count}`
).join('\n')}

### Top Source IPs
${summary.topSources.map((source, i) => 
  `${i+1}. ${source.ip} (${source.count} alerts)`
).join('\n')}

## High Priority Alerts
${highPriorityAlerts.slice(0, 10).map(alert => `
### ${alert.threat} - ${alert.severity}
- **Time:** ${new Date(alert.time).toLocaleString()}
- **Source:** ${alert.srcIp || 'Unknown'}
- **Confidence:** ${alert.confidence}%
- **Details:** ${alert.details || 'No additional details'}
- **Status:** ${alert.status}
${alert.mitreTechniques ? `- **MITRE Techniques:** ${alert.mitreTechniques.join(', ')}` : ''}
`).join('\n')}

## Recommendations
${highPriorityAlerts.length > 0 ? `
1. Investigate high-confidence alerts immediately
2. Review source IPs with multiple alerts
3. Consider blocking suspicious sources
4. Update detection rules based on findings
` : `
1. Continue monitoring for new threats
2. Review and update detection rules
3. Ensure all systems are properly monitored
`}
`;
  }
}
