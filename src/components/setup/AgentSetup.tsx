import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Download, Terminal, Wifi, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AgentSetupProps {
  wsStatus?: {
    isConnecting: boolean;
    reconnectCount: number;
    error: any;
  };
  connected: boolean;
}

export function AgentSetup({ wsStatus = { isConnecting: false, reconnectCount: 0, error: null }, connected }: AgentSetupProps) {
  const [wsUrl, setWsUrl] = useState("ws://localhost:8765");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadAgent = () => {
    const link = document.createElement('a');
    link.href = '/agent/netwatch_agent.py';
    link.download = 'netwatch_agent.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Agent downloaded!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>NetWatch Agent Setup</CardTitle>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To capture real network packets from your computer, you need to run the NetWatch Python agent.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 1: Download the Agent</h4>
            <Button onClick={downloadAgent} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download netwatch_agent.py
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 2: Install Dependencies</h4>
            <div className="bg-muted rounded-lg p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span>pip install scapy websockets</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyToClipboard("pip install scapy websockets")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 3: Run the Agent</h4>
            <div className="bg-muted rounded-lg p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span>sudo python3 netwatch_agent.py -i eth0 -p 8765</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyToClipboard("sudo python3 netwatch_agent.py -i eth0 -p 8765")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Replace 'eth0' with your network interface (e.g., wlan0 for WiFi)
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 4: WebSocket Connection</h4>
            <div className="flex space-x-2">
              <Input
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8765"
              />
              <Button 
                onClick={() => window.location.reload()}
                disabled={wsStatus.isConnecting}
              >
                <Wifi className="h-4 w-4 mr-2" />
                {wsStatus.isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>

          {wsStatus.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connection failed: {wsStatus.error.message || "Unable to connect to agent"}
              </AlertDescription>
            </Alert>
          )}

          {connected && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected! Real-time packet capture is active.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}