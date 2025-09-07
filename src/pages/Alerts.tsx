import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import AlertsList from "@/components/alerts/AlertsList";
import { usePacketStream } from "@/hooks/usePacketStream";

const AlertsPage = () => {
  const { alerts, connected, wsStatus } = usePacketStream({ 
    simulate: false, 
    websocketUrl: "ws://localhost:8765" 
  });
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Alerts – NetWatch</title>
        <meta name="description" content="Rule-based intrusion indicators including port scans and DDoS-like bursts." />
        <link rel="canonical" href="/alerts" />
      </Helmet>
      <Navbar />
      <main className="container mx-auto flex-1 py-8">
        <h1 className="text-2xl font-semibold mb-4">Threat Alerts</h1>
        <AlertsList alerts={alerts} />
      </main>
    </div>
  );
};

export default AlertsPage;
