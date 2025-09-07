import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import PacketTable from "@/components/packets/PacketTable";
import { AgentSetup } from "@/components/setup/AgentSetup";
import { usePacketStream } from "@/hooks/usePacketStream";

const PacketsPage = () => {
  const { packets, connected, wsStatus } = usePacketStream({ 
    simulate: false, 
    websocketUrl: "ws://localhost:8765" 
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Packets – NetWatch</title>
        <meta name="description" content="Real-time network packet monitoring and analysis." />
        <link rel="canonical" href="/packets" />
      </Helmet>
      <Navbar />
      <main className="container mx-auto flex-1 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Live Packet Capture</h1>
        
        <AgentSetup wsStatus={wsStatus} connected={connected} />
        
        <PacketTable packets={packets} />
      </main>
    </div>
  );
};

export default PacketsPage;
