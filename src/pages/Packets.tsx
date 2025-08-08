import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import PacketTable from "@/components/packets/PacketTable";
import { usePacketStream } from "@/hooks/usePacketStream";

const PacketsPage = () => {
  const { packets } = usePacketStream({ simulate: true });
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Packets – NetWatch</title>
        <meta name="description" content="Explore recent packets with protocol, ports, and payload preview." />
        <link rel="canonical" href="/packets" />
      </Helmet>
      <Navbar />
      <main className="container mx-auto flex-1 py-8">
        <h1 className="text-2xl font-semibold mb-4">Packet List</h1>
        <PacketTable packets={packets} />
      </main>
    </div>
  );
};

export default PacketsPage;
