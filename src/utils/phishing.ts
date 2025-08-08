export interface PhishingResult {
  input: string;
  normalized: string;
  score: number; // 0-100
  verdict: "Safe" | "Low Risk" | "Suspicious" | "Phishing";
  factors: { label: string; weight: number }[];
  parts: {
    scheme: string;
    hostname: string;
    tld: string | null;
    port: string | null;
    path: string;
    query: string;
  };
}

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "top",
  "tk",
  "ru",
  "xyz",
  "gq",
  "cf",
  "ml",
  "work",
  "link",
  "kim",
  "fit",
  "quest",
]);

function isIp(host: string): boolean {
  // IPv4 check (simple)
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function asciiOnly(str: string) {
  return /^[\x00-\x7F]*$/.test(str);
}

export function analyzeUrl(input: string): PhishingResult | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch (e) {
    // try to coerce
    try {
      url = new URL(`http://${input.trim()}`);
    } catch (e2) {
      return null;
    }
  }

  const hostname = url.hostname.toLowerCase();
  const parts = hostname.split(".");
  const tld = parts.length > 1 ? parts[parts.length - 1] : null;
  const scheme = url.protocol.replace(":", "");
  const path = url.pathname || "/";
  const query = url.search || "";
  const port = url.port || null;

  let score = 0;
  const factors: { label: string; weight: number }[] = [];

  const add = (label: string, weight: number) => {
    score += weight;
    factors.push({ label, weight });
  };

  // Heuristics
  if (scheme !== "https") add("Not using HTTPS", 15);
  if (hostname.includes("xn--")) add("IDN (punycode) domain", 25);
  if (!asciiOnly(hostname)) add("Non-ASCII characters in hostname", 15);
  if (hostname.includes("@")) add("'@' present in hostname", 20);
  if (isIp(hostname)) add("Direct IP address used as hostname", 25);

  const subdomainCount = Math.max(0, parts.length - 2);
  if (subdomainCount >= 3) add("Excessive subdomains", 10);

  const hyphens = (hostname.match(/-/g) || []).length;
  if (hyphens >= 2) add("Multiple hyphens in hostname", 8);

  if (tld && SUSPICIOUS_TLDS.has(tld)) add(`Suspicious TLD .${tld}`, 15);

  const urlStr = url.toString();
  if (urlStr.length > 120) add("Very long URL", 8);

  const sensitiveKeywords = ["password", "login", "verify", "bank", "account", "update", "secure"];
  const combined = `${path} ${query}`.toLowerCase();
  if (sensitiveKeywords.some((k) => combined.includes(k))) add("Sensitive keywords in path/query", 12);

  if (port && !["", "80", "443"].includes(port)) add(`Non-standard port :${port}`, 6);

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let verdict: PhishingResult["verdict"] = "Safe";
  if (score >= 60) verdict = "Phishing";
  else if (score >= 40) verdict = "Suspicious";
  else if (score >= 20) verdict = "Low Risk";

  return {
    input,
    normalized: url.toString(),
    score,
    verdict,
    factors,
    parts: { scheme, hostname, tld, port, path, query },
  };
}
