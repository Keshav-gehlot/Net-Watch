import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StatCard = ({ title, value, kpi }: { title: string; value: string; kpi?: string }) => (
  <Card className="transition-transform hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-elevated)" }}>
    <CardHeader>
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {kpi && <div className="text-xs text-muted-foreground mt-1">{kpi}</div>}
    </CardContent>
  </Card>
);
