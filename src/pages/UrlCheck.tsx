import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { analyzeUrl, PhishingResult } from "@/utils/phishing";
import ReputationTable from "@/components/url/ReputationTable";

const VerdictPill = ({ verdict }: { verdict: PhishingResult["verdict"] }) => {
  const map: Record<PhishingResult["verdict"], string> = {
    "Safe": "bg-secondary text-secondary-foreground",
    "Low Risk": "bg-accent text-accent-foreground",
    "Suspicious": "bg-destructive/10 text-destructive",
    "Phishing": "bg-destructive text-destructive-foreground",
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${map[verdict]}`}>{verdict}</span>;
};

const UrlCheckPage = () => {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<PhishingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const res = analyzeUrl(value);
    if (!res) {
      setResult(null);
      setError("Please enter a valid URL.");
      return;
    }
    setResult(res);
  };

  const scoreColor = useMemo(() => {
    if (!result) return "hsl(var(--muted-foreground))";
    if (result.score >= 60) return "hsl(var(--destructive))";
    if (result.score >= 40) return "hsl(var(--brand))";
    return "hsl(var(--sidebar-ring))";
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>URL Phishing Check – NetWatch</title>
        <meta name="description" content="Analyze a URL for phishing risk using fast, transparent heuristics." />
        <link rel="canonical" href="/url-check" />
      </Helmet>
      <Navbar />
      <main className="container mx-auto flex-1 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">URL Phishing Checker</h1>

        <Card>
          <CardHeader>
            <CardTitle>Check a URL</CardTitle>
            <CardDescription>Fast client-side heuristics to estimate phishing risk. For vendor reputation results, connect Supabase and we’ll add a secure server-side integration.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCheck} className="flex flex-col gap-3 md:flex-row">
              <Input
                placeholder="https://example.com/login"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-label="URL to analyze"
              />
              <Button variant="hero" type="submit">Analyze</Button>
            </form>
            {error && <div className="text-sm text-destructive mt-2">{error}</div>}
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <span className="truncate max-w-[70vw]" title={result.normalized}>{result.normalized}</span>
                      <VerdictPill verdict={result.verdict} />
                    </CardTitle>
                    <CardDescription>Analyzed just now • heuristic assessment</CardDescription>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative h-16 w-16">
                      <svg viewBox="0 0 36 36" className="h-16 w-16">
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${result.score}, 100`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{result.score}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Risk score</div>
                      <div className="text-xl font-semibold">{result.score}/100</div>
                    </div>
                    <Button variant="outline" onClick={() => onCheck()}>Reanalyze</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Signals</h3>
                    {result.factors.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No risky signals detected.</div>
                    ) : (
                      <ul className="space-y-2">
                        {result.factors.map((f, i) => (
                          <li key={i} className="flex items-center justify-between border rounded-md p-2">
                            <span className="text-sm">{f.label}</span>
                            <span className="text-xs text-muted-foreground">+{f.weight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">URL Parts</h3>
                    <div className="text-sm grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">Scheme</div>
                      <div className="col-span-2">{result.parts.scheme}</div>
                      <div className="text-muted-foreground">Hostname</div>
                      <div className="col-span-2">{result.parts.hostname}</div>
                      <div className="text-muted-foreground">TLD</div>
                      <div className="col-span-2">{result.parts.tld ?? '-'}</div>
                      <div className="text-muted-foreground">Port</div>
                      <div className="col-span-2">{result.parts.port ?? '-'}</div>
                      <div className="text-muted-foreground">Path</div>
                      <div className="col-span-2">{result.parts.path}</div>
                      <div className="text-muted-foreground">Query</div>
                      <div className="col-span-2 truncate" title={result.parts.query}>{result.parts.query || '-'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ReputationTable url={result.normalized} score={result.score} />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Integrate external reputation APIs securely</CardTitle>
            <CardDescription>
              To use services like VirusTotal/Google Safe Browsing, connect Supabase and store your API key as a Secret. We’ll call it from an Edge Function for privacy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Frontend-only keys are unsafe. If you still want a temporary local key for testing, I can add a localStorage field—just ask.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UrlCheckPage;
