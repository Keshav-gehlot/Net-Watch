import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePacketStream } from "@/hooks/usePacketStream";
import { usePacketAnalysisWorker } from "@/hooks/usePacketAnalysisWorker";
import { NetworkFlowChart } from "@/components/visuals/NetworkFlowChart";
import { VirtualizedPacketTable } from "@/components/packets/VirtualizedPacketTable";
import { CustomDetectionRules, DetectionRule } from "@/components/rules/CustomDetectionRules";
import { useState, useEffect } from "react";
import { Activity, Cpu, Zap, Shield, Smartphone } from "lucide-react";

const FeaturesPage = () => {
  const { packets, alerts, connected, pps, wsStatus } = usePacketStream({ 
    simulate: false, 
    websocketUrl: "ws://localhost:8765" 
  });
  const { isWorkerReady, analyzeThreat, calculateStatistics } = usePacketAnalysisWorker();
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [workerStats, setWorkerStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "visualizations" | "performance" | "rules" | "mobile">("overview");

  useEffect(() => {
    if (isWorkerReady && packets.length > 100) {
      // Demonstrate worker capabilities
      calculateStatistics(packets.slice(0, 100)).then(result => {
        setWorkerStats(result.result);
      }).catch(console.error);
    }
  }, [isWorkerReady, packets, calculateStatistics]);

  const handleRuleAdd = (rule: DetectionRule) => {
    setRules(prev => [...prev, rule]);
  };

  const handleRuleUpdate = (rule: DetectionRule) => {
    setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
  };

  const handleRuleDelete = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const handleRuleToggle = (ruleId: string, enabled: boolean) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
  };

  const features = [
    {
      id: "websocket",
      title: "Enhanced WebSocket Connection", 
      description: "Auto-reconnection with exponential backoff, connection monitoring, and error handling",
      icon: <Activity className="w-5 h-5" />,
      status: connected ? "Connected" : "Disconnected",
      details: `Reconnect attempts: ${wsStatus?.reconnectCount || 0}`
    },
    {
      id: "visualizations",
      title: "Advanced Visualizations",
      description: "Network flow charts, protocol distribution, port analysis with interactive charts",
      icon: <Zap className="w-5 h-5" />,
      status: "Active",
      details: `${packets.length} packets analyzed`
    },
    {
      id: "performance",
      title: "Performance Optimizations",
      description: "Virtual scrolling for large datasets, Web Workers for heavy computations",
      icon: <Cpu className="w-5 h-5" />,
      status: isWorkerReady ? "Worker Ready" : "Loading...",
      details: workerStats ? `Processed ${workerStats.totalPackets} packets` : "Standby"
    },
    {
      id: "rules",
      title: "Custom Detection Rules",
      description: "Create and manage custom security detection rules with conditions and actions",
      icon: <Shield className="w-5 h-5" />,
      status: `${rules.length} rules`,
      details: `${rules.filter(r => r.enabled).length} active`
    },
    {
      id: "mobile",
      title: "Mobile Responsive Design",
      description: "Optimized for all screen sizes with mobile-first approach",
      icon: <Smartphone className="w-5 h-5" />,
      status: "Responsive",
      details: "Mobile-optimized layouts"
    }
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "visualizations", label: "Visualizations" },
    { id: "performance", label: "Performance" },
    { id: "rules", label: "Detection Rules" },
    { id: "mobile", label: "Mobile View" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Features – NetWatch</title>
        <meta name="description" content="Explore NetWatch's advanced features: WebSocket reconnection, visualizations, performance optimizations, custom rules, and mobile design." />
        <link rel="canonical" href="/features" />
      </Helmet>
      <Navbar />
      
      <main className="container mx-auto flex-1 py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Advanced Features</h1>
          <p className="text-gray-600">Explore NetWatch's cutting-edge capabilities for network monitoring and security analysis.</p>
        </div>

        {/* Feature Overview Cards */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <Badge variant="outline">{feature.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{feature.description}</p>
                  <div className="text-sm text-muted-foreground">{feature.details}</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setActiveTab(feature.id as any)}
                  >
                    Explore
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as any)}
              className="mb-2"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Feature Demonstrations */}
        {activeTab === "visualizations" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Advanced Network Visualizations</h2>
              <p className="text-gray-600 mb-6">Interactive charts showing network traffic patterns, protocol distribution, and communication flows.</p>
            </div>
            <NetworkFlowChart packets={packets} />
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Performance Optimizations</h2>
              <p className="text-gray-600 mb-6">Virtual scrolling handles thousands of packets efficiently, while Web Workers process data without blocking the UI.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Web Worker Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Worker Ready:</span>
                      <Badge variant={isWorkerReady ? "default" : "secondary"}>
                        {isWorkerReady ? "✓ Active" : "Loading..."}
                      </Badge>
                    </div>
                    {workerStats && (
                      <>
                        <div className="flex justify-between">
                          <span>Packets Analyzed:</span>
                          <span className="font-mono">{workerStats.totalPackets}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Speed:</span>
                          <span className="font-mono">{workerStats.packetsPerSecond.toFixed(2)} pps</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Virtual Scrolling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Packets:</span>
                      <span className="font-mono">{packets.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendered Items:</span>
                      <span className="font-mono">~20-50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <Badge variant="outline">Optimized</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <VirtualizedPacketTable packets={packets} height={400} />
          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Custom Detection Rules</h2>
              <p className="text-gray-600 mb-6">Create sophisticated detection rules with multiple conditions, severity levels, and automated actions.</p>
            </div>
            <CustomDetectionRules
              rules={rules}
              onRuleAdd={handleRuleAdd}
              onRuleUpdate={handleRuleUpdate}
              onRuleDelete={handleRuleDelete}
              onRuleToggle={handleRuleToggle}
            />
          </div>
        )}

        {activeTab === "mobile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Mobile Responsive Design</h2>
              <p className="text-gray-600 mb-6">NetWatch is fully optimized for mobile devices with adaptive layouts and touch-friendly interfaces.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Responsive Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">✓</Badge>
                      Mobile-first navigation with collapsible menu
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">✓</Badge>
                      Adaptive card layouts for small screens
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">✓</Badge>
                      Touch-optimized controls and interactions
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">✓</Badge>
                      Optimized charts and visualizations
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">✓</Badge>
                      Progressive disclosure of information
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Viewport</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="block sm:hidden">
                      <Badge className="bg-blue-100 text-blue-800">Mobile View (&lt; 640px)</Badge>
                    </div>
                    <div className="hidden sm:block md:hidden">
                      <Badge className="bg-green-100 text-green-800">Tablet View (640px - 768px)</Badge>
                    </div>
                    <div className="hidden md:block lg:hidden">
                      <Badge className="bg-orange-100 text-orange-800">Desktop View (768px - 1024px)</Badge>
                    </div>
                    <div className="hidden lg:block">
                      <Badge className="bg-purple-100 text-purple-800">Large Desktop (&gt; 1024px)</Badge>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      Try resizing your browser window to see the responsive design in action!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Demo of mobile-optimized packet table */}
            <div className="lg:hidden">
              <h3 className="text-lg font-semibold mb-3">Mobile Packet View</h3>
              <div className="border rounded-lg p-3 bg-card">
                <div className="text-sm text-muted-foreground mb-2">
                  This is how packets appear on mobile devices:
                </div>
                {packets.slice(0, 3).map((packet) => (
                  <div key={packet.id} className="border rounded-lg p-3 mb-3 bg-background">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-muted-foreground">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </div>
                      <Badge variant="outline">{packet.protocol}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">From:</span>
                        <div className="font-mono text-xs">{packet.srcIp}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To:</span>
                        <div className="font-mono text-xs">{packet.dstIp}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FeaturesPage;
