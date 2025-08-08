import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { Packet } from "@/types/network";
import PacketTable from "@/components/packets/PacketTable";

const UploadPage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Packet[]>([]);

  const onPick = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = (res.data as any[]).map((r) => ({
            id: crypto.randomUUID(),
            timestamp: Number(r.timestamp) || Date.now(),
            srcIp: r.srcIp || r.source || "0.0.0.0",
            dstIp: r.dstIp || r.destination || "0.0.0.0",
            protocol: (r.protocol || "OTHER").toUpperCase(),
            srcPort: r.srcPort ? Number(r.srcPort) : undefined,
            dstPort: r.dstPort ? Number(r.dstPort) : undefined,
            length: r.length ? Number(r.length) : 0,
            payloadPreview: r.payloadPreview || undefined,
          })) as Packet[];
          setParsed(rows);
        },
      });
    } else if (file.name.endsWith(".pcap") || file.name.endsWith(".pcapng")) {
      alert("PCAP parsing is handled by the Python agent. Use CSV here for now.");
    } else {
      alert("Unsupported file. Please upload .csv or .pcap.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Upload – NetWatch</title>
        <meta name="description" content="Upload PCAP/CSV files for offline analysis. CSV parsed in-browser; PCAP via Python agent." />
        <link rel="canonical" href="/upload" />
      </Helmet>
      <Navbar />
      <main className="container mx-auto flex-1 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Upload Capture</h1>
        <Card id="agent">
          <CardHeader>
            <CardTitle>Python Agent (Real-time)</CardTitle>
            <CardDescription>Run locally with root/admin privileges. Sends JSON packets over WebSocket to the UI.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button asChild variant="outline">
              <a href="/agent/netwatch_agent.py" download>Download agent.py</a>
            </Button>
            <Button variant="hero" asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Start the agent in your terminal: python3 agent.py -i eth0'); }}>Run Instructions</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyze a file</CardTitle>
            <CardDescription>Drop a CSV (columns: timestamp, srcIp, dstIp, protocol, srcPort, dstPort, length, payloadPreview) or a PCAP.</CardDescription>
          </CardHeader>
          <CardContent>
            <input ref={inputRef} type="file" className="hidden" onChange={onFile} accept=".csv,.pcap,.pcapng" />
            <div className="border-dashed border rounded-lg p-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">Click to choose a file or drag & drop</p>
              <Button variant="hero" onClick={onPick}>Choose File</Button>
            </div>
          </CardContent>
        </Card>

        {parsed.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Parsed Packets ({parsed.length})</h2>
            <PacketTable packets={parsed} />
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadPage;
