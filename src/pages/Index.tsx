import { Helmet, HelmetProvider } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { StatCard } from "@/components/dashboard/StatCard";
import TrafficChart from "@/components/dashboard/TrafficChart";
import PacketTable from "@/components/packets/PacketTable";
import AlertsList from "@/components/alerts/AlertsList";
import { usePacketStream } from "@/hooks/usePacketStream";
import { useMemo } from "react";

const Index = () => {
  const { packets, alerts, pps, stats, connected } = usePacketStream({ simulate: true });

  const ppsSeries = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 30 }).map((_, i) => ({
      time: new Date(now - (30 - i) * 1000).toLocaleTimeString(),
      pps: i === 29 ? pps : Math.max(0, Math.round(pps * (0.7 + Math.random() * 0.6))),
    }));
  }, [pps]);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Dashboard – NetWatch</title>
        <meta name="description" content="Live network monitoring dashboard with packets per second, protocols, talkers and alerts." />
        <link rel="canonical" href="/" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container mx-auto flex-1 py-8 space-y-8">
          <h1 className="sr-only">NetWatch Network Packet Sniffer & Analyzer Dashboard</h1>
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard title="Connection" value={connected ? "Live" : "Offline"} kpi={connected ? "Receiving stream" : "Using simulator"} />
            <StatCard title="Packets / sec" value={`${pps}`} />
            <StatCard title="Top Protocol" value={stats.topProtocols[0]?.name ?? "-"} kpi={`${stats.topProtocols[0]?.value ?? 0} packets`} />
          </section>

          <section className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3">
              <h2 className="sr-only">Traffic</h2>
              <TrafficChart data={ppsSeries} />
            </div>
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold">Top Talkers</h2>
              <ul className="space-y-2">
                {stats.topTalkers.map((t) => (
                  <li key={t.ip} className="flex items-center justify-between border rounded-md p-3">
                    <span className="text-sm">{t.ip}</span>
                    <span className="text-xs text-muted-foreground">{t.count} pkts</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Button variant="hero" asChild>
                  <a href="#agent" aria-label="Download Python agent">Download Python Agent</a>
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3">
              <PacketTable packets={packets} />
            </div>
            <div className="md:col-span-2">
              <AlertsList alerts={alerts} />
            </div>
          </section>
        </main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} NetWatch</footer>
      </div>
    </HelmetProvider>
  );
};

export default Index;
