import { AlertItem } from "@/types/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsList({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Threat Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-sm text-muted-foreground">No alerts yet. You're all clear.</div>
        ) : (
          <ul className="space-y-3">
            {alerts.slice(0, 100).map((a) => (
              <li key={a.id} className="flex items-start justify-between border rounded-md p-3">
                <div>
                  <div className="text-sm font-medium">{a.threat}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.time).toLocaleTimeString()} - {a.srcIp ?? 'unknown'}
                    {a.details ? ` • ${a.details}` : ''}
                  </div>
                </div>
                <div className="text-xs">Confidence: {a.confidence}%</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
