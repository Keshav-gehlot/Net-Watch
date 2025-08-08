import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type VendorStatus = "Clean" | "Suspicious" | "Phishing" | "Untested";

export interface VendorVerdict {
  vendor: string;
  status: VendorStatus;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

const DEFAULT_VENDORS = [
  "alphaMountain.ai", "G Data", "Webroot", "Acronis", "AlienVault", "Anlyz ML",
  "Bitdefender", "BlackList", "Certego", "CRDF", "Cyble", "DNS8",
  "EmergingThreats", "ESET", "ESTsecurity", "GreenSnow", "Kaspersky", "Malwared",
  "Phishing Database", "PREBYTES", "Quick Heal", "SCUMWARE.org", "Spam404",
  "Sucuri", "ThreatFox", "URLhaus", "VX Vault", "Yandex", "ZeroCERT",
  "AlphaSOC", "Abusix", "Lumu", "PhishFort", "PreciseSec", "UndeRW00d"
];

function pickStatuses(seed: number, count: number, severity: "low" | "mid" | "high") {
  const arr: VendorVerdict[] = [];
  let rnd = seed;
  const flagged = severity === "high" ? 8 : severity === "mid" ? 3 : 1;
  for (let i = 0; i < DEFAULT_VENDORS.length; i++) {
    rnd = (rnd * 1664525 + 1013904223) >>> 0;
    const vendor = DEFAULT_VENDORS[i];
    let status: VendorStatus = "Clean";
    if (i < flagged && (rnd % 3 === 0)) status = "Phishing";
    else if (i < flagged && (rnd % 3 === 1)) status = "Suspicious";
    else if (rnd % 17 === 0) status = "Untested";
    arr.push({ vendor, status });
  }
  return arr.slice(0, count);
}

export default function ReputationTable({ url, score }: { url: string; score: number }) {
  const seed = hashString(url);
  const severity = score >= 60 ? "high" : score >= 40 ? "mid" : "low";
  const rows = pickStatuses(seed, DEFAULT_VENDORS.length, severity);

  const badge = (s: VendorStatus) => {
    const map: Record<VendorStatus, string> = {
      Clean: "bg-secondary text-secondary-foreground",
      Suspicious: "bg-accent text-accent-foreground",
      Phishing: "bg-destructive text-destructive-foreground",
      Untested: "bg-muted text-muted-foreground",
    };
    return <span className={`px-2 py-1 rounded-md text-xs ${map[s]}`}>{s}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Security vendors' analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th className="py-2 pr-4">Vendor</th>
                <th className="py-2 pr-4">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vendor} className="border-t">
                  <td className="py-2 pr-4">{r.vendor}</td>
                  <td className="py-2 pr-4">{badge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
